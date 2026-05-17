"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ListingCount } from "@/types/ticket";

interface ListingsChartProps {
  listings: ListingCount[];
}

export function ListingsChart({ listings }: ListingsChartProps) {
  const fourDay = listings.filter((l) => l.ticketType === "4-day");

  // Group by month, take the last entry of each month as the snapshot
  const byMonth = new Map<string, number>();
  for (const l of [...fourDay].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())) {
    const month = new Date(l.date).toLocaleDateString("es-ES", { year: "numeric", month: "short" });
    byMonth.set(month, l.totalTickets);
  }

  const chartData = Array.from(byMonth.entries()).map(([month, tickets]) => ({ month, tickets }));

  const latest = fourDay.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">Sin datos de entradas disponibles aún.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-300 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Entradas disponibles en TicketSwap
        </h3>
        {latest && (
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {latest.totalTickets} entradas
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", border: "1px solid #ccc" }}
            formatter={(value: number) => [`${value} entradas`, "Disponibles"]}
          />
          <Bar dataKey="tickets" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
