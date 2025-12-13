import { put, head, del, list } from "@vercel/blob";
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
  // Delete existing blob if it exists
  try {
    const { blobs } = await list({ prefix: BLOB_FILENAME });
    for (const blob of blobs) {
      await del(blob.url);
    }
  } catch (error) {
    // Ignore if blob doesn't exist
    console.log("No existing blob to delete");
  }

  // Create new blob
  await put(BLOB_FILENAME, JSON.stringify(data, null, 2), {
    access: "public",
    contentType: "application/json",
  });
}

// GET - Fetch all prices
export async function GET() {
  try {
    // Check if Blob token is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not configured");
      return NextResponse.json(
        { error: "Almacenamiento de Blob no configurado. Por favor, agregue almacenamiento de Blob en el panel de Vercel." },
        { status: 500 }
      );
    }

    const data = await getData();
    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching prices:", errorMessage, error);
    return NextResponse.json(
      { error: `Error al obtener precios: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// POST - Add a new price
export async function POST(request: Request) {
  try {
    // Check if Blob token is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not configured");
      return NextResponse.json(
        { error: "Almacenamiento de Blob no configurado. Por favor, agregue almacenamiento de Blob en el panel de Vercel." },
        { status: 500 }
      );
    }

    const newPrice: TicketPrice = await request.json();

    // Get existing data
    const data = await getData();

    // Normalize dates to YYYY-MM-DD for comparison
    const newDate = new Date(newPrice.date).toISOString().split("T")[0];

    // Check if a price already exists for this date and ticket type
    const existingIndex = data.prices.findIndex((p) => {
      const existingDate = new Date(p.date).toISOString().split("T")[0];
      return existingDate === newDate && p.ticketType === newPrice.ticketType;
    });

    if (existingIndex !== -1) {
      // Update existing entry instead of creating duplicate
      data.prices[existingIndex] = {
        ...newPrice,
        id: data.prices[existingIndex].id, // Keep the original ID
      };
      console.log(`Updated existing price entry for ${newDate} (${newPrice.ticketType})`);
    } else {
      // Add new price
      data.prices.push(newPrice);
      console.log(`Added new price entry for ${newDate} (${newPrice.ticketType})`);
    }

    // Save back to Blob
    await saveData(data);

    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error adding price:", errorMessage, error);
    return NextResponse.json(
      { error: `Error al añadir precio: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// DELETE - Remove a price by id
export async function DELETE(request: Request) {
  try {
    // Check if Blob token is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not configured");
      return NextResponse.json(
        { error: "Almacenamiento de Blob no configurado. Por favor, agregue almacenamiento de Blob en el panel de Vercel." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Se requiere ID" }, { status: 400 });
    }

    // Get existing data
    const data = await getData();

    // Remove price
    data.prices = data.prices.filter((p) => p.id !== id);

    // Save back to Blob
    await saveData(data);

    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error deleting price:", errorMessage, error);
    return NextResponse.json(
      { error: `Error al eliminar precio: ${errorMessage}` },
      { status: 500 }
    );
  }
}
