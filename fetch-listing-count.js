const crypto = require("crypto");

const GRAPHQL_URL = "https://www.ticketswap.es/api/graphql/public?version=5";
const EVENT_TYPE_ID = "RXZlbnRUeXBlOjQ5OTc3Mjc=";
const API_URL = process.env.API_URL || "https://resurrection-tracker.vercel.app/api/listings";

const QUERY = `
  query getEventTypeListings($id: ID!, $currency: Currency, $first: Int = 1, $filter: ListingFilterInput = {}, $after: String = null) {
    node(id: $id) {
      ... on EventType {
        id
        availableTicketsCount
        listings(first: $first, filter: $filter, after: $after) {
          edges {
            node {
              id
              numberOfAvailableTickets
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  }
`;

async function fetchAllListings() {
  let totalListings = 0;
  let totalTickets = 0;
  let cursor = null;
  let page = 0;

  while (true) {
    page++;
    console.log(`Fetching page ${page} (cursor: ${cursor || "start"})...`);

    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        operationName: "getEventTypeListings",
        variables: {
          id: EVENT_TYPE_ID,
          first: 20,
          filter: { listingStatus: "AVAILABLE" },
          after: cursor,
          currency: "EUR",
        },
        query: QUERY,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const data = await response.json();
    const eventType = data.data?.node;

    if (!eventType) {
      console.log("No event type in response — possibly blocked.");
      return null;
    }

    const { edges, pageInfo } = eventType.listings;

    for (const { node } of edges) {
      totalListings++;
      totalTickets += node.numberOfAvailableTickets || 0;
    }

    console.log(`  → ${edges.length} listings on this page, hasNextPage: ${pageInfo.hasNextPage}`);

    if (!pageInfo.hasNextPage) break;
    cursor = pageInfo.endCursor;
  }

  return { totalListings, totalTickets };
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

fetchAllListings()
  .then(async (result) => {
    if (!result) {
      console.log("Skipping API call — no data.");
      process.exit(0);
    }
    console.log(`\nFound ${result.totalListings} listings with ${result.totalTickets} total tickets`);
    if (result.totalListings === 0) {
      console.log("No listings found — skipping API call.");
      process.exit(0);
    }
    await sendCountToAPI(result.totalTickets, result.totalListings);
    console.log("\n✓ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Script failed:", error);
    process.exit(1);
  });
