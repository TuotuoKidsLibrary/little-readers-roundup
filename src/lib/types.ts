export type ScriptType = "Simplified" | "Traditional" | "Bilingual";
export type AgeRange = "0-2" | "3-5" | "6+";
export type BookStatus = "available" | "reserved" | "for_sale" | "donation" | "private";

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  script_type: ScriptType;
  age_range: AgeRange;
  price?: number;
  status: BookStatus;
  owner_id: string;
  owner_name: string;
  cover_hue: number;
  cover_url?: string;
}

export interface Message {
  id: string;
  thread_id: string;
  from: string;
  to: string;
  text: string;
  at: string;
}

export interface Thread {
  id: string;
  with_name: string;
  book_title: string;
}

export interface ActivityRecord {
  id: string;
  type: "borrow" | "buy" | "lend" | "donate" | "sell";
  book_title: string;
  at: string;
  method?: string;
  status: string;
}

export interface UserProfile {
  id: string;
  name: string;
  membership_status: string;
  deposit_balance: number;
  wallet_balance: number;
  neighborhood_location: string;
  zip_code: string;
}