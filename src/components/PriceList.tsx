"use client";

import type { TicketPrice } from "@/types/ticket";
import { formatEURPrice } from "@/lib/formatPrice";

interface PriceListProps {
  prices: TicketPrice[];
  onDeletePrice: (id: string) => void;
}

export function PriceList({ prices, onDeletePrice }: PriceListProps) {
  const sortedPrices = [...prices].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (sortedPrices.length === 0) {
    return (
      <div className="rounded-lg border border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">
          Sin entradas de precio aún. Agrega tu primera entrada arriba.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Entradas de Precio ({sortedPrices.length})
      </h3>
      <div className="space-y-2">
        {sortedPrices.map((price) => (
          <div
            key={price.id}
            className="flex items-center justify-between rounded-lg border border-gray-300 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatEURPrice(price.price)}
                </span>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    price.ticketType === "4-day"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                  }`}
                >
                  {price.ticketType === "4-day" ? "4 Días" : "4 Días VIP"}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(price.date).toLocaleDateString("es-ES", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              {price.notes && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {price.notes}
                </p>
              )}
            </div>
            {process.env.NODE_ENV !== "production" && (
              <button
                type="button"
                onClick={() => onDeletePrice(price.id)}
                className="ml-4 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                title="Eliminar entrada"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
