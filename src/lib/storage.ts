import type { TicketData, TicketPrice } from "@/types/ticket";

// Fetch all prices from the API
export async function fetchPrices(): Promise<TicketData> {
  const response = await fetch("/api/prices", {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch prices");
  }
  return response.json();
}

// Add a new price via the API
export async function addPrice(price: TicketPrice): Promise<TicketData> {
  const response = await fetch("/api/prices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(price),
  });
  if (!response.ok) {
    throw new Error("Failed to add price");
  }
  return response.json();
}

// Delete a price via the API
export async function deletePrice(id: string): Promise<TicketData> {
  const response = await fetch(`/api/prices?id=${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete price");
  }
  return response.json();
}

// Export data to JSON
export async function exportToJSON(): Promise<string> {
  const data = await fetchPrices();
  return JSON.stringify(data, null, 2);
}
