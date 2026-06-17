const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const crypto = require("crypto");

puppeteer.use(StealthPlugin());

const TICKETSWAP_URL =
  "https://www.ticketswap.es/event/resurrection-fest-2026/4-day-ticket-tickets/0a722a0d-6e0d-44a1-a134-0e42bc43f003/4997727";

// Use production URL or localhost for testing
const API_URL = process.env.API_URL || "https://resurrection-tracker.vercel.app/api/prices";

async function scrapePrice() {
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

    // Set a realistic user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    console.log("Navigating to TicketSwap...");
    await page.goto(TICKETSWAP_URL, {
      waitUntil: "networkidle2",
      timeout: 30000
    });

    console.log("Waiting for content to load...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Try to find listings
    const result = await page.evaluate(() => {
      const links = document.querySelectorAll(".styles_link__Jm_hk");
      const prices = [];

      links.forEach((link) => {
        const priceEl = link.querySelector("footer > strong");
        if (priceEl) {
          const match = priceEl.textContent?.match(/(\d+),(\d+)/);
          if (match) {
            prices.push(parseFloat(`${match[1]}.${match[2]}`));
          }
        }
      });

      return { count: links.length, prices };
    });
    console.log(`Found ${result.count} listings`);
    console.log(`Prices found: ${result.prices.join(", ")}`);

    if (result.prices.length > 0) {
      const cheapestPrice = Math.min(...result.prices);
      console.log(`Cheapest price: ${cheapestPrice}€`);

      // Send to API
      await sendPriceToAPI(cheapestPrice);
    } else {
      console.log("No prices found");
    }

    await browser.close();
    return result;
  } catch (error) {
    await browser.close();
    throw error;
  }
}

async function sendPriceToAPI(price) {
  const priceData = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    ticketType: "4-day",
    price: price,
    notes: "Auto-fetched from TicketSwap",
  };

  console.log("\nSending price to API...");
  console.log("Data:", JSON.stringify(priceData, null, 2));

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(priceData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("✓ Price successfully saved to API");
    console.log("Response:", JSON.stringify(data, null, 2));

    return data;
  } catch (error) {
    console.error("✗ Failed to send price to API:", error.message);
    throw error;
  }
}

// Run the script
scrapePrice()
  .then(() => {
    console.log("\n✓ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Script failed:", error);
    process.exit(1);
  });
