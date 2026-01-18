import type { TicketPrice, TicketType } from "@/types/ticket";

export interface MonthlyPrice {
  month: string; // YYYY-MM
  monthLabel: string; // Spanish formatted
  price: number;
}

/**
 * Get the lowest price for a specific ticket type of all time
 */
export function getLowestPriceAllTime(
  prices: TicketPrice[],
  ticketType: TicketType,
): number | null {
  const pricesForType = prices.filter(
    (price) => price.ticketType === ticketType,
  );

  if (pricesForType.length === 0) {
    return null;
  }

  return Math.min(...pricesForType.map((p) => p.price));
}

/**
 * Get the lowest price for a specific ticket type in the last 30 days
 */
export function getLowestPriceInLast30Days(
  prices: TicketPrice[],
  ticketType: TicketType,
): number | null {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentPrices = prices.filter((price) => {
    const priceDate = new Date(price.date);
    return price.ticketType === ticketType && priceDate >= thirtyDaysAgo;
  });

  if (recentPrices.length === 0) {
    return null;
  }

  return Math.min(...recentPrices.map((p) => p.price));
}

/**
 * Get the most recent price for today for a specific ticket type
 */
export function getTodayLastPrice(
  prices: TicketPrice[],
  ticketType: TicketType,
): number | null {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const todayPrices = prices
    .filter((price) => {
      const priceDate = price.date.split("T")[0];
      return price.ticketType === ticketType && priceDate === todayStr;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (todayPrices.length === 0) {
    // If no prices for today, get the most recent price
    const allPricesForType = prices
      .filter((price) => price.ticketType === ticketType)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return allPricesForType.length > 0 ? allPricesForType[0].price : null;
  }

  return todayPrices[0].price;
}

/**
 * Calculate percentage difference between two prices
 * Returns positive if current is higher, negative if lower
 */
export function calculatePercentageDifference(
  currentPrice: number,
  comparisonPrice: number,
): number {
  if (comparisonPrice === 0) {
    return 0;
  }
  return ((currentPrice - comparisonPrice) / comparisonPrice) * 100;
}

/**
 * Get cheapest price by month for a specific ticket type
 */
export function getCheapestPriceByMonth(
  prices: TicketPrice[],
  ticketType: TicketType,
): MonthlyPrice[] {
  const pricesForType = prices.filter(
    (price) => price.ticketType === ticketType,
  );

  if (pricesForType.length === 0) {
    return [];
  }

  // Group by month (YYYY-MM)
  const pricesByMonth = new Map<string, number[]>();

  pricesForType.forEach((price) => {
    const date = new Date(price.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!pricesByMonth.has(monthKey)) {
      pricesByMonth.set(monthKey, []);
    }
    pricesByMonth.get(monthKey)?.push(price.price);
  });

  // Find minimum for each month and format
  const monthlyPrices: MonthlyPrice[] = Array.from(pricesByMonth.entries())
    .map(([monthKey, pricesInMonth]) => {
      const [year, month] = monthKey.split("-");
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);

      const monthLabel = date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
      });

      return {
        month: monthKey,
        monthLabel,
        price: Math.min(...pricesInMonth),
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  return monthlyPrices;
}
