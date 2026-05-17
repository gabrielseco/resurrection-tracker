const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const crypto = require("crypto");

puppeteer.use(StealthPlugin());

const TICKETSWAP_URL =
  "https://www.ticketswap.es/event/resurrection-fest-2026/4-day-ticket-tickets/0a722a0d-6e0d-44a1-a134-0e42bc43f003/4997727";

const API_URL = process.env.API_URL || "https://resurrection-tracker.vercel.app/api/listings";

function waitForNextListingsResponse(page, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      page.off("response", handler);
      reject(new Error("Timed out waiting for GraphQL response"));
    }, timeoutMs);

    async function handler(res) {
      if (!res.url().includes("/api/graphql/public")) return;
      try {
        const body = JSON.parse(res.request().postData() || "{}");
        if (body.operationName !== "getEventTypeListings") return;
        const data = await res.json();
        const listings = data.data?.node?.listings;
        if (!listings) return;
        clearTimeout(timer);
        page.off("response", handler);
        resolve(listings);
      } catch {}
    }

    page.on("response", handler);
  });
}

async function scrapeListingCount() {
  console.log("Launching browser...");

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  });

  try {
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.setRequestInterception(true);
    page.on("request", (req) => req.continue());

    console.log("Navigating to TicketSwap...");

    // Wait for the initial listings response while the page loads
    const initialResponsePromise = waitForNextListingsResponse(page, 30000);
    await page.goto(TICKETSWAP_URL, { waitUntil: "networkidle2", timeout: 30000 });

    const isBlocked = await page.evaluate(() => {
      const text = document.body.innerText;
      return (
        text.includes("Iniciar sesión para echar un vistazo") ||
        text.includes("Log in to take a look") ||
        text.includes("debes iniciar sesión")
      );
    });

    if (isBlocked) {
      console.log("Blocked by TicketSwap: login required. Skipping.");
      await browser.close();
      process.exit(0);
    }

    let totalListings = 0;
    let totalTickets = 0;

    // Process initial page load response
    const initialListings = await initialResponsePromise;
    for (const { node } of initialListings.edges) {
      totalListings++;
      totalTickets += node.numberOfAvailableTickets || 0;
    }
    console.log(`Initial load: ${initialListings.edges.length} listings, hasNextPage: ${initialListings.pageInfo.hasNextPage}`);

    // Paginate by clicking "show more" and waiting for each GraphQL response
    let clickCount = 0;
    const MAX_CLICKS = 100;
    while (initialListings.pageInfo.hasNextPage && clickCount < MAX_CLICKS) {
      const showMoreBtn = await page.$("button.styles_showMoreButton__aEXQc");
      if (!showMoreBtn) break;

      clickCount++;
      console.log(`Clicking "Mostrar más" (#${clickCount})...`);
      await page.evaluate((btn) => btn.scrollIntoView({ block: "center" }), showMoreBtn);
      await new Promise((resolve) => setTimeout(resolve, 300));

      const nextResponsePromise = waitForNextListingsResponse(page);
      await showMoreBtn.click();

      const nextListings = await nextResponsePromise;
      for (const { node } of nextListings.edges) {
        totalListings++;
        totalTickets += node.numberOfAvailableTickets || 0;
      }
      console.log(`  → ${nextListings.edges.length} new listings, hasNextPage: ${nextListings.pageInfo.hasNextPage}`);

      if (!nextListings.pageInfo.hasNextPage) break;
    }

    await browser.close();

    console.log(`\nDone after ${clickCount} clicks`);
    console.log(`Found ${totalListings} listings with ${totalTickets} total tickets`);

    if (totalListings === 0) {
      console.log("No listings found — skipping API call.");
      process.exit(0);
    }

    return { totalListings, totalTickets };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

async function sendCountToAPI(totalTickets, totalListings) {
  const payload = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    ticketType: "4-day",
    totalTickets,
    totalListings,
  };

  console.log("\nSending listing count to API...");
  console.log("Data:", JSON.stringify(payload, null, 2));

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log("✓ Listing count successfully saved to API");
  console.log("Response:", JSON.stringify(data, null, 2));
}

scrapeListingCount()
  .then(async (result) => {
    if (!result) process.exit(0);
    await sendCountToAPI(result.totalTickets, result.totalListings);
    console.log("\n✓ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Script failed:", error);
    process.exit(1);
  });
