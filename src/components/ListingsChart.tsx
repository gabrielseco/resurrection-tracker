"use client";

import {
  LineChart,
  Line,
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
  const chartData = listings
    .filter((l) => l.ticketType === "4-day")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((l) => ({
      date: new Date(l.date).toLocaleDateString("es-ES", {
        month: "short",
        day: "numeric",
      }),
      tickets: l.totalTickets,
    }));

  const latest = chartData[chartData.length - 1];

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
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Entradas disponibles en TicketSwap
        </h3>
        {latest && (
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {latest.tickets} entradas
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis label={{ value: "Entradas", angle: -90, position: "insideLeft" }} />
          <Tooltip
            contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.9)", border: "1px solid #ccc" }}
            formatter={(value: number) => [`${value} entradas`, "Disponibles"]}
          />
          <Line
            type="monotone"
            dataKey="tickets"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
