"use client";

import {
  BarChart,
  Bar,
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
  const fourDay = listings.filter((l) => l.ticketType === "4-day");
  const sorted = [...fourDay].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Monthly bar chart: last snapshot of each month
  const byMonth = new Map<string, number>();
  for (const l of sorted) {
    const month = new Date(l.date).toLocaleDateString("es-ES", { year: "numeric", month: "short" });
    byMonth.set(month, l.totalTickets);
  }
  const monthlyData = Array.from(byMonth.entries()).map(([month, tickets]) => ({ month, tickets }));

  // Daily line chart
  const dailyData = sorted.map((l) => ({
    date: new Date(l.date).toLocaleDateString("es-ES", { month: "short", day: "numeric" }),
    tickets: l.totalTickets,
  }));

  const latest = sorted[sorted.length - 1];

  if (monthlyData.length === 0) {
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
          <span className="text-base font-semibold text-blue-600 dark:text-blue-400">
            {latest.totalTickets} entradas
          </span>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Histórico diario</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", border: "1px solid #ccc" }}
                formatter={(value: number) => [`${value} entradas`, "Disponibles"]}
              />
              <Line type="monotone" dataKey="tickets" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Por mes</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", border: "1px solid #ccc" }}
                formatter={(value: number) => [`${value} entradas`, "Disponibles"]}
              />
              <Bar dataKey="tickets" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
