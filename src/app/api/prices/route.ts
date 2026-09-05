import { NextResponse } from "next/server";

// Thin server-side proxy to the resurrection-api Elixir backend, which now
// owns the data (previously stored directly in Upstash Redis by this app).
// Keeping these routes means the frontend (storage.ts, usePrices.ts,
// components) needs no changes at all.
const API_URL =
  process.env.RESURRECTION_API_URL || "https://resurrection-api.fly.dev";
const API_KEY = process.env.RESURRECTION_API_KEY;

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/api/prices`, {
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching prices:", errorMessage, error);
    return NextResponse.json(
      { error: `Error al obtener precios: ${errorMessage}` },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!API_KEY) {
      console.error("RESURRECTION_API_KEY is not configured");
      return NextResponse.json(
        { error: "API no configurada. Falta RESURRECTION_API_KEY." },
        { status: 500 },
      );
    }

    const body = await request.text();
    const response = await fetch(`${API_URL}/api/prices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body,
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error adding price:", errorMessage, error);
    return NextResponse.json(
      { error: `Error al añadir precio: ${errorMessage}` },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    if (!API_KEY) {
      console.error("RESURRECTION_API_KEY is not configured");
      return NextResponse.json(
        { error: "API no configurada. Falta RESURRECTION_API_KEY." },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Se requiere ID" }, { status: 400 });
    }

    const response = await fetch(
      `${API_URL}/api/prices?id=${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${API_KEY}` },
      },
    );

    if (response.status === 204) {
      const refreshed = await fetch(`${API_URL}/api/prices`, {
        cache: "no-store",
      });
      return NextResponse.json(await refreshed.json());
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error deleting price:", errorMessage, error);
    return NextResponse.json(
      { error: `Error al eliminar precio: ${errorMessage}` },
      { status: 500 },
    );
  }
}
