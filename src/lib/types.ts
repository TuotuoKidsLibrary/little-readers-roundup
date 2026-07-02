export type ScriptType = "Simplified" | "Traditional";
export type AgeRange = "0-2" | "3-5" | "6+";
export type BookStatus = "available" | "reserved" | "for_sale" | "donation" | "private";
export type RequestStatus = "pending" | "accepted" | "declined" | "completed";

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

export interface BookRequest {
  id: string;
  book_id: string;
  book_title: string;
  requester_id: string;
  requester_name: string;
  owner_id: string;
  method: string;
  note: string | null;
  status: RequestStatus;
  created_at: string;
}

export interface Message {
  id: string;
  request_id: string;
  sender_id: string;
  recipient_id: string;
  text: string;
  created_at: string;
}

export interface Thread {
  id: string;
  book_title: string;
  other_user_name: string;
  other_user_id: string;
  last_message: string;
  last_message_at: string;
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
  avatar_url?: string;
}
