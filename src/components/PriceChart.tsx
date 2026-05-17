"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { TicketPrice } from "@/types/ticket";

interface PriceChartProps {
  prices: TicketPrice[];
}

export function PriceChart({ prices }: PriceChartProps) {
  const sortedPrices = [...prices].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const fourDayPrices = sortedPrices.filter((p) => p.ticketType === "4-day");
  const fourDayVipPrices = sortedPrices.filter(
    (p) => p.ticketType === "4-day-vip"
  );

  const allDates = new Set([
    ...fourDayPrices.map((p) => p.date),
    ...fourDayVipPrices.map((p) => p.date),
  ]);

  const chartData = Array.from(allDates)
    .sort()
    .map((date) => {
      const fourDay = fourDayPrices.find((p) => p.date === date);
      const fourDayVip = fourDayVipPrices.find((p) => p.date === date);

      return {
        date: new Date(date).toLocaleDateString("es-ES", {
          month: "short",
          day: "numeric",
        }),
        "4-day": fourDay?.price,
        "4-day-vip": fourDayVip?.price,
      };
    });

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">
          Sin datos de precio aún. Agrega algunas entradas para ver el gráfico.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-300 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        Historial de Precios
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            label={{ value: "Precio (€)", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              border: "1px solid #ccc",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="4-day"
            stroke="#3b82f6"
            name="Abono de 4 Días"
            strokeWidth={2}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="4-day-vip"
            stroke="#8b5cf6"
            name="Abono VIP de 4 Días"
            strokeWidth={2}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
