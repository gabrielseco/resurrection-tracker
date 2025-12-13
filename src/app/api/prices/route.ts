import { Redis } from "@upstash/redis";
import type { TicketData, TicketPrice } from "@/types/ticket";
import { NextResponse } from "next/server";

const REDIS_KEY = "prices";

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Helper function to get existing data
async function getData(): Promise<TicketData> {
  try {
    const data = await redis.get<TicketData>(REDIS_KEY);
    if (data) {
      return data;
    }
  } catch (error) {
    console.log("No existing data found, starting fresh");
  }
  return { prices: [] };
}

// Helper function to save data
async function saveData(data: TicketData): Promise<void> {
  // Simple set - no delete needed, instant update!
  await redis.set(REDIS_KEY, data);
}

// GET - Fetch all prices
export async function GET() {
  try {
    // Check if Redis is configured
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.error("Upstash Redis is not configured");
      return NextResponse.json(
        { error: "Redis no configurado. Por favor, agregue las credenciales de Upstash Redis." },
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
    // Check if Redis is configured
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.error("Upstash Redis is not configured");
      return NextResponse.json(
        { error: "Redis no configurado. Por favor, agregue las credenciales de Upstash Redis." },
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

    // Save back to Redis
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
    // Check if Redis is configured
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.error("Upstash Redis is not configured");
      return NextResponse.json(
        { error: "Redis no configurado. Por favor, agregue las credenciales de Upstash Redis." },
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

    // Save back to Redis
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
