import { Redis } from "@upstash/redis";
import type { ListingData, ListingCount } from "@/types/ticket";
import { NextResponse } from "next/server";

const REDIS_KEY = "listings";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function getData(): Promise<ListingData> {
  try {
    const data = await redis.get<ListingData>(REDIS_KEY);
    if (data) return data;
  } catch {
    console.log("No existing listing data found, starting fresh");
  }
  return { listings: [] };
}

async function saveData(data: ListingData): Promise<void> {
  await redis.set(REDIS_KEY, data);
}

function isConfigured() {
  return process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
}

export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Redis no configurado." }, { status: 500 });
  }
  try {
    const data = await getData();
    return NextResponse.json(data);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Error al obtener listings: ${msg}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Redis no configurado." }, { status: 500 });
  }
  try {
    const newEntry: ListingCount = await request.json();
    const data = await getData();

    const newDate = new Date(newEntry.date).toISOString().split("T")[0];

    const existingIndex = data.listings.findIndex((l) => {
      const existingDate = new Date(l.date).toISOString().split("T")[0];
      return existingDate === newDate && l.ticketType === newEntry.ticketType;
    });

    if (existingIndex !== -1) {
      // Always overwrite with latest snapshot for today
      data.listings[existingIndex] = {
        ...newEntry,
        id: data.listings[existingIndex].id,
      };
      console.log(`Updated listing count for ${newDate} (${newEntry.ticketType}): ${newEntry.totalTickets} tickets in ${newEntry.totalListings} listings`);
      await saveData(data);
      return NextResponse.json({ success: true, action: "updated", data });
    } else {
      data.listings.push(newEntry);
      console.log(`Added listing count for ${newDate} (${newEntry.ticketType}): ${newEntry.totalTickets} tickets in ${newEntry.totalListings} listings`);
      await saveData(data);
      return NextResponse.json({ success: true, action: "added", data });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Error al añadir listing: ${msg}` }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Redis no configurado." }, { status: 500 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Se requiere ID" }, { status: 400 });

    const data = await getData();
    data.listings = data.listings.filter((l) => l.id !== id);
    await saveData(data);
    return NextResponse.json(data);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Error al eliminar listing: ${msg}` }, { status: 500 });
  }
}
