"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatEURPrice } from "@/lib/formatPrice";
import {
  calculatePercentageDifference,
  getCheapestPriceByMonth,
  getLowestPriceAllTime,
  getLowestPriceInLast30Days,
  getTodayLastPrice,
} from "@/lib/priceAnalytics";
import type { TicketPrice } from "@/types/ticket";

interface PriceAnalyticsProps {
  prices: TicketPrice[];
}

export function PriceAnalytics({ prices }: PriceAnalyticsProps) {
  if (prices.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">
          Sin datos de precio aún. Agrega algunas entradas para ver el análisis.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-300 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Análisis de Precios
      </h2>

      <div className="grid gap-6">
        {/* 4-day ticket analytics */}
        <TicketAnalyticsColumn prices={prices} ticketType="4-day" />
      </div>
    </div>
  );
}

interface TicketAnalyticsColumnProps {
  prices: TicketPrice[];
  ticketType: "4-day" | "4-day-vip";
}

function TicketAnalyticsColumn({
  prices,
  ticketType,
}: TicketAnalyticsColumnProps) {
  const lowestAllTime = getLowestPriceAllTime(prices, ticketType);
  const lowest30Days = getLowestPriceInLast30Days(prices, ticketType);
  const currentPrice = getTodayLastPrice(prices, ticketType);
  const monthlyPrices = getCheapestPriceByMonth(prices, ticketType);

  const percentageDiff =
    currentPrice !== null && lowestAllTime !== null
      ? calculatePercentageDifference(currentPrice, lowestAllTime)
      : null;

  const ticketLabel =
    ticketType === "4-day" ? "Abono de 4 Días" : "Abono VIP de 4 Días";
  const barColor = ticketType === "4-day" ? "#3b82f6" : "#8b5cf6";

  // Check if we have any data for this ticket type
  const hasData = prices.some((p) => p.ticketType === ticketType);

  if (!hasData) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {ticketLabel}
        </h3>
        <div className="flex h-48 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sin datos disponibles
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {ticketLabel}
      </h3>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Lowest price all time */}
        <StatCard
          label="Precio Más Bajo (Histórico)"
          value={lowestAllTime !== null ? formatEURPrice(lowestAllTime) : "N/A"}
        />

        {/* Lowest price in 30 days */}
        <StatCard
          label="Precio Más Bajo (30 Días)"
          value={lowest30Days !== null ? formatEURPrice(lowest30Days) : "N/A"}
        />

        {/* Current price */}
        <StatCard
          label="Precio Actual"
          value={currentPrice !== null ? formatEURPrice(currentPrice) : "N/A"}
        />

        {/* Percentage difference */}
        {percentageDiff !== null && (
          <StatCard
            label="Diferencia Porcentual"
            value={`${percentageDiff > 0 ? "+" : ""}${percentageDiff.toFixed(1)}%`}
            valueColor={
              percentageDiff > 0
                ? "text-red-600 dark:text-red-400"
                : percentageDiff < 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-900 dark:text-gray-100"
            }
          />
        )}
      </div>

      {/* Monthly minimum prices chart */}
      {monthlyPrices.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Precio Mínimo por Mes
          </h4>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyPrices} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="monthLabel"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                label={{
                  value: "Precio (€)",
                  angle: -90,
                  position: "insideLeft",
                }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  border: "1px solid #ccc",
                }}
                formatter={(value: number) => formatEURPrice(value)}
              />
              <Bar dataKey="price" fill={barColor} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  valueColor?: string;
}

function StatCard({ label, value, valueColor }: StatCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-bold ${valueColor || "text-gray-900 dark:text-gray-100"}`}
      >
        {value}
      </p>
    </div>
  );
}
