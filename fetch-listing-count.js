const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const crypto = require("crypto");

puppeteer.use(StealthPlugin());

const TICKETSWAP_URL =
  "https://www.ticketswap.es/event/resurrection-fest-2026/4-day-ticket-tickets/0a722a0d-6e0d-44a1-a134-0e42bc43f003/4997727";

const API_URL = process.env.API_URL || "https://resurrection-tracker.vercel.app/api/listings";

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

    console.log("Navigating to TicketSwap...");
    await page.goto(TICKETSWAP_URL, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    console.log("Waiting for listings to appear...");
    try {
      await page.waitForSelector(".styles_link__Jm_hk", { timeout: 15000 });
    } catch {
      // Take a screenshot to help debug if listings never appear
      await page.screenshot({ path: "debug-listing-count.png" });
      console.log("Listings not found within 15s — saved debug-listing-count.png");
    }

    // Click "Mostrar más" until it disappears
    let clickCount = 0;
    while (true) {
      const showMoreBtn = await page.$("button.styles_showMoreButton__aEXQc");
      if (!showMoreBtn) break;

      console.log(`Clicking "Mostrar más" (click #${++clickCount})...`);
      await showMoreBtn.click();
      await page.waitForNetworkIdle({ idleTime: 500, timeout: 5000 }).catch(() => {});
    }

    console.log(`Expanded all listings after ${clickCount} clicks`);

    // Count total tickets across all listings
    const result = await page.evaluate(() => {
      const links = document.querySelectorAll(".styles_link__Jm_hk");
      let totalTickets = 0;
      let totalListings = 0;

      links.forEach((link) => {
        const titleEl = link.querySelector("h4.styles_title__cgWBt");
        if (titleEl) {
          const match = titleEl.textContent?.match(/(\d+)/);
          if (match) {
            totalTickets += parseInt(match[1], 10);
            totalListings++;
          }
        }
      });

      return { totalTickets, totalListings };
    });

    console.log(`Found ${result.totalListings} listings with ${result.totalTickets} total tickets`);

    await sendCountToAPI(result.totalTickets, result.totalListings);

    await browser.close();
    return result;
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

  try {
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
    return data;
  } catch (error) {
    console.error("✗ Failed to send listing count to API:", error.message);
    throw error;
  }
}

scrapeListingCount()
  .then(() => {
    console.log("\n✓ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Script failed:", error);
    process.exit(1);
  });
