"use client";

import { PriceForm } from "@/components/PriceForm";
import { PriceChart } from "@/components/PriceChart";
import { PriceAnalytics } from "@/components/PriceAnalytics";
import { PriceList } from "@/components/PriceList";
import { ListingsChart } from "@/components/ListingsChart";
import { usePrices, useAddPrice, useDeletePrice, useListings } from "@/hooks/usePrices";
import type { TicketPrice } from "@/types/ticket";

export default function Home() {
  const { data, isLoading, error } = usePrices();
  const { data: listingsData } = useListings();
  const addPriceMutation = useAddPrice();
  const deletePriceMutation = useDeletePrice();

  function handleAddPrice(price: TicketPrice) {
    addPriceMutation.mutate(price);
  }

  function handleDeletePrice(id: string) {
    deletePriceMutation.mutate(id);
  }

  const showError =
    error || addPriceMutation.error || deletePriceMutation.error;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Holdeo de entradas de Resurrection
          </h1>
        </header>

        {showError && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-400">
            Error al procesar la solicitud. Por favor, inténtelo de nuevo.
          </div>
        )}

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-gray-600 dark:text-gray-400">Cargando...</div>
          </div>
        ) : (
          <div className="space-y-8">
            {process.env.NODE_ENV !== "production" && (
              <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Añadir Nuevo Precio
                </h2>
                <PriceForm onAddPrice={handleAddPrice} />
              </div>
            )}

            <ListingsChart listings={listingsData?.listings || []} />

            <PriceChart prices={data?.prices || []} />

            <PriceAnalytics prices={data?.prices || []} />

            <PriceList
              prices={data?.prices || []}
              onDeletePrice={handleDeletePrice}
            />
          </div>
        )}
      </div>
    </div>
  );
}
