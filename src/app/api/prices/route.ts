import { put, head } from "@vercel/blob";
import type { TicketData, TicketPrice } from "@/types/ticket";
import { NextResponse } from "next/server";

const BLOB_FILENAME = "prices.json";

// Helper function to get existing data
async function getData(): Promise<TicketData> {
  try {
    const blob = await head(BLOB_FILENAME);
    if (blob) {
      const response = await fetch(blob.url);
      return await response.json();
    }
  } catch (error) {
    console.log("No existing data found, starting fresh");
  }
  return { prices: [] };
}

// Helper function to save data
async function saveData(data: TicketData): Promise<void> {
  await put(BLOB_FILENAME, JSON.stringify(data, null, 2), {
    access: "public",
    contentType: "application/json",
  });
}

// GET - Fetch all prices
export async function GET() {
  try {
    const data = await getData();
    return NextResponse.json(data);
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
    const data = await getData();

    // Add new price
    data.prices.push(newPrice);

    // Save back to Blob
    await saveData(data);

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
    const data = await getData();

    // Remove price
    data.prices = data.prices.filter((p) => p.id !== id);

    // Save back to Blob
    await saveData(data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error deleting price:", error);
    return NextResponse.json(
      { error: "Failed to delete price" },
      { status: 500 }
    );
  }
}
