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

    console.log("Waiting for content to load...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const isBlocked = await page.evaluate(() => {
      // Check for login wall button or known blocked page text
      const hasLoginButton = !!document.querySelector("a[href*='login'], button[data-testid='login']");
      const text = document.body.innerText;
      return (
        hasLoginButton ||
        text.includes("Iniciar sesión para echar un vistazo") ||
        text.includes("Log in to take a look") ||
        text.includes("debes iniciar sesión")
      );
    });

    if (isBlocked) {
      console.log("Blocked by TicketSwap: login required (rate limited / bot detected). Skipping.");
      await browser.close();
      process.exit(0);
    }

    // Click "Mostrar más" until it disappears, waiting for new listings to appear after each click
    let clickCount = 0;
    const MAX_CLICKS = 20;
    while (clickCount < MAX_CLICKS) {
      const showMoreBtn = await page.$("button.styles_showMoreButton__aEXQc");
      if (!showMoreBtn) break;

      const countBefore = await page.$$eval(".styles_link__Jm_hk", (els) => els.length);
      console.log(`Clicking "Mostrar más" (click #${++clickCount}, listings so far: ${countBefore})...`);
      await page.evaluate((btn) => btn.scrollIntoView({ block: "center" }), showMoreBtn);
      await new Promise((resolve) => setTimeout(resolve, 500));
      await showMoreBtn.click();
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const countAfter = await page.$$eval(".styles_link__Jm_hk", (els) => els.length);
      console.log(`  → listings after click: ${countAfter}`);
      if (countAfter <= countBefore) {
        console.log("  → count did not increase, stopping pagination.");
        break;
      }
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

    if (result.totalListings === 0) {
      console.log("No listings found — likely blocked or page failed to load. Skipping API call.");
      await browser.close();
      process.exit(0);
    }

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
