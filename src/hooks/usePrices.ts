import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TicketData, TicketPrice, ListingData } from "@/types/ticket";
import { fetchPrices, addPrice, deletePrice, fetchListings } from "@/lib/storage";

const PRICES_KEY = ["prices"];

export function usePrices() {
  return useQuery<TicketData>({
    queryKey: PRICES_KEY,
    queryFn: fetchPrices,
  });
}

export function useAddPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (price: TicketPrice) => addPrice(price),
    onSuccess: (data) => {
      queryClient.setQueryData(PRICES_KEY, data);
    },
  });
}

export function useDeletePrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePrice(id),
    onSuccess: (data) => {
      queryClient.setQueryData(PRICES_KEY, data);
    },
  });
}

export function useListings() {
  return useQuery<ListingData>({
    queryKey: ["listings"],
    queryFn: fetchListings,
  });
}
