import { kv } from "@vercel/kv";
import type { TicketData, TicketPrice } from "@/types/ticket";
import { NextResponse } from "next/server";

const STORAGE_KEY = "resurrection-prices";

// GET - Fetch all prices
export async function GET() {
  try {
    const data = await kv.get<TicketData>(STORAGE_KEY);
    return NextResponse.json(data || { prices: [] });
  } catch (error) {
    console.error("Error fetching prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    );
  }
}

// POST - Add a new price
export async function POST(request: Request) {
  try {
    const newPrice: TicketPrice = await request.json();

    // Get existing data
    const data = (await kv.get<TicketData>(STORAGE_KEY)) || { prices: [] };

    // Add new price
    data.prices.push(newPrice);

    // Save back to KV
    await kv.set(STORAGE_KEY, data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error adding price:", error);
    return NextResponse.json(
      { error: "Failed to add price" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a price by id
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Get existing data
    const data = (await kv.get<TicketData>(STORAGE_KEY)) || { prices: [] };

    // Remove price
    data.prices = data.prices.filter((p) => p.id !== id);

    // Save back to KV
    await kv.set(STORAGE_KEY, data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error deleting price:", error);
    return NextResponse.json(
      { error: "Failed to delete price" },
      { status: 500 }
    );
  }
}
