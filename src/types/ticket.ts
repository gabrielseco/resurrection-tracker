export type TicketType = "4-day" | "4-day-vip";

export interface TicketPrice {
  id: string;
  date: string; // ISO date string
  ticketType: TicketType;
  price: number;
  notes?: string;
}

export interface TicketData {
  prices: TicketPrice[];
}

export interface ListingCount {
  id: string;
  date: string; // ISO date string
  ticketType: TicketType;
  totalTickets: number;   // sum of individual ticket quantities
  totalListings: number;  // number of listing cards
}

export interface ListingData {
  listings: ListingCount[];
}
