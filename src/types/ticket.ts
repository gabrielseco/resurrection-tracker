export type TicketType = "4-day" | "4-day-vip";

export interface TicketPrice {
  // The API assigns a numeric id on insert; a placeholder string id is used
  // client-side only when submitting a new price (see PriceForm), and is
  // discarded/ignored server-side.
  id: string | number;
  date: string; // ISO date string
  ticketType: TicketType;
  price: number;
  notes?: string;
}

export interface TicketData {
  prices: TicketPrice[];
}

export interface ListingCount {
  id: string | number;
  date: string; // ISO date string
  ticketType: TicketType;
  totalTickets: number;   // sum of individual ticket quantities
  totalListings: number;  // number of listing cards
}

export interface ListingData {
  listings: ListingCount[];
}
