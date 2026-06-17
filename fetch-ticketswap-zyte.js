const crypto = require("crypto");

const TICKETSWAP_URL =
  "https://www.ticketswap.es/event/resurrection-fest-2026/4-day-ticket-tickets/0a722a0d-6e0d-44a1-a134-0e42bc43f003/4997727";

const ZYTE_API_KEY = process.env.ZYTE_API_KEY;
const BASE_API_URL =
  process.env.API_URL || "https://resurrection-tracker.vercel.app";

async function scrape() {
  if (!ZYTE_API_KEY) {
    throw new Error("ZYTE_API_KEY environment variable is required");
  }

  console.log("Fetching page via Zyte API...");
  const response = await fetch("https://api.zyte.com/v1/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${ZYTE_API_KEY}:`).toString("base64")}`,
    },
    body: JSON.stringify({
      url: TICKETSWAP_URL,
      browserHtml: true,
    }),
    signal: AbortSignal.timeout(90000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Zyte API request failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const html = data.browserHtml;
  console.log(`Got ${html.length} bytes of HTML`);

  const nextDataMatch = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  );
  if (!nextDataMatch) {
    console.log("DEBUG: No __NEXT_DATA__ found. HTML snippet:\n", html.slice(0, 3000));
    console.log("No data found — skipping.");
    process.exit(0);
  }

  const nextDataJson = nextDataMatch[1];

  // --- Listing count ---
  const ticketsMatch = nextDataJson.match(/"availableTicketsCount":(\d+)/);
  const totalTickets = ticketsMatch ? parseInt(ticketsMatch[1], 10) : 0;

  const listingMatches = html.match(/class="[^"]*styles_link__Jm_hk[^"]*"/g);
  const totalListings = listingMatches ? listingMatches.length : 0;

  console.log(`Found ${totalListings} listings with ${totalTickets} total tickets`);

  // --- Prices ---
  const listingRegex =
    /class="[^"]*styles_link__Jm_hk[^"]*"[\s\S]*?<footer[\s\S]*?<strong[^>]*>([\s\S]*?)<\/strong>/g;

  const prices = [];
  let match;
  while ((match = listingRegex.exec(html)) !== null) {
    const priceMatch = match[1].match(/(\d+),(\d+)/);
    if (priceMatch) {
      prices.push(parseFloat(`${priceMatch[1]}.${priceMatch[2]}`));
    }
  }

  // Fallback: try extracting prices from __NEXT_DATA__ JSON
  if (prices.length === 0) {
    const priceRegex = /"price":{"amount":(\d+),"currency"/g;
    let jsonMatch;
    while ((jsonMatch = priceRegex.exec(nextDataJson)) !== null) {
      const cents = parseInt(jsonMatch[1], 10);
      prices.push(cents / 100);
    }
  }

  console.log(`Prices found: ${prices.join(", ")}`);

  const cheapestPrice = prices.length > 0 ? Math.min(...prices) : null;
  if (cheapestPrice !== null) {
    console.log(`Cheapest price: ${cheapestPrice}€`);
  }

  return { totalListings, totalTickets, cheapestPrice };
}

async function sendListingCount(totalTickets, totalListings) {
  const payload = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    ticketType: "4-day",
    totalTickets,
    totalListings,
  };

  console.log("\nSending listing count to API...");
  const response = await fetch(`${BASE_API_URL}/api/listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Listings API failed: ${response.status} - ${errorText}`);
  }

  console.log("✓ Listing count saved");
}

async function sendPrice(price) {
  const payload = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    ticketType: "4-day",
    price,
    notes: "Auto-fetched from TicketSwap",
  };

  console.log("Sending price to API...");
  const response = await fetch(`${BASE_API_URL}/api/prices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Prices API failed: ${response.status} - ${errorText}`);
  }

  console.log("✓ Price saved");
}

scrape()
  .then(async ({ totalTickets, totalListings, cheapestPrice }) => {
    if (totalTickets === 0) {
      console.log("No tickets found — skipping API calls.");
      process.exit(0);
    }

    const calls = [sendListingCount(totalTickets, totalListings)];
    if (cheapestPrice !== null) {
      calls.push(sendPrice(cheapestPrice));
    }
    await Promise.all(calls);

    console.log("\n✓ Done");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Failed:", error);
    process.exit(1);
  });
