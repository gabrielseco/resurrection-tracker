import { NextResponse } from "next/server";

// GraphQL query to fetch Resurrection Fest 2026 listings
const GRAPHQL_QUERY = [
	{
		operationName: "GetEventTypeListings",
		variables: {
			id: "RXZlbnRUeXBlOjQ5OTc3Mjc=", // 4-day ticket ID
		},
		query: `
      query GetEventTypeListings($id: ID!) {
        node(id: $id) {
          ... on EventType {
            id
            title
            listings(first: 50) {
              edges {
                node {
                  id
                  numberOfAvailableTickets
                  price {
                    totalPrice {
                      amount
                      currency
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
	},
];

interface Listing {
	node: {
		id: string;
		numberOfAvailableTickets: number;
		price: {
			totalPrice: {
				amount: string; // Price in cents
				currency: string;
			};
		};
	};
}

interface GraphQLResponse {
	data: {
		node: {
			listings: {
				edges: Listing[];
			};
		};
	};
}

export async function GET(request: Request) {
	try {
		// Verify the request is coming from Vercel Cron
		const authHeader = request.headers.get("authorization");
		if (
			process.env.CRON_SECRET &&
			authHeader !== `Bearer ${process.env.CRON_SECRET}`
		) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		console.log("[Cron] Fetching prices from TicketSwap...");

		// Fetch data from TicketSwap GraphQL API with retry logic
		let response: Response | null = null;
		let lastError: Error | null = null;

		// Retry up to 3 times with exponential backoff
		for (let attempt = 0; attempt < 3; attempt++) {
			try {
				response = await fetch(
					"https://www.ticketswap.es/api/graphql/public?version=4",
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"User-Agent":
								"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
							Accept: "application/json",
							"Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
							Origin: "https://www.ticketswap.es",
							Referer:
								"https://www.ticketswap.es/event/resurrection-fest-2026/4-day-ticket-tickets/0a722a0d-6e0d-44a1-a134-0e42bc43f003/4997727",
						},
						body: JSON.stringify(GRAPHQL_QUERY),
					},
				);

				if (response.ok) {
					break; // Success, exit retry loop
				}

				// If rate limited, wait before retrying
				if (response.status === 429) {
					const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
					console.log(
						`[Cron] Rate limited, waiting ${waitTime}ms before retry...`,
					);
					await new Promise((resolve) => setTimeout(resolve, waitTime));
					continue;
				}

				// Other errors, throw immediately
				throw new Error(`TicketSwap API failed: ${response.status}`);
			} catch (error) {
				lastError = error instanceof Error ? error : new Error("Unknown error");
				if (attempt === 2) break; // Last attempt, don't wait
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}

		if (!response || !response.ok) {
			throw new Error(
				lastError?.message || `TicketSwap API failed: ${response?.status}`,
			);
		}

		const data: GraphQLResponse[] = await response.json();

		// Extract listings from the response (should be in data[1])
		const listingsData = data.find((item) => item.data?.node?.listings);
		if (!listingsData?.data?.node?.listings) {
			console.log("[Cron] No listings found");
			return NextResponse.json({
				success: true,
				message: "No listings available",
			});
		}

		const listings = listingsData.data.node.listings.edges;

		// Filter only available tickets and get the cheapest price
		const availableListings = listings.filter(
			(listing) => listing.node.numberOfAvailableTickets > 0,
		);

		if (availableListings.length === 0) {
			console.log("[Cron] No available tickets");
			return NextResponse.json({
				success: true,
				message: "No available tickets",
			});
		}

		// Find the cheapest price (amount is in cents)
		const cheapestListing = availableListings.reduce((min, listing) =>
			Number.parseInt(listing.node.price.totalPrice.amount) <
			Number.parseInt(min.node.price.totalPrice.amount)
				? listing
				: min,
		);

		const priceInEuros =
			Number.parseInt(cheapestListing.node.price.totalPrice.amount) / 100;

		console.log(`[Cron] Cheapest price found: €${priceInEuros}`);

		// Save to database via our existing API
		const saveResponse = await fetch(
			`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/prices`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					ticketType: "4-day",
					price: priceInEuros,
					notes: "Auto-fetched from TicketSwap",
					date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
				}),
			},
		);

		if (!saveResponse.ok) {
			throw new Error(`Failed to save price: ${saveResponse.status}`);
		}

		return NextResponse.json({
			success: true,
			price: priceInEuros,
			currency: cheapestListing.node.price.totalPrice.currency,
			availableTickets: availableListings.length,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("[Cron] Error fetching prices:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
