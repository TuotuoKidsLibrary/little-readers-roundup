import { createContext, useContext, useState, type ReactNode } from "react";
import { useEffect } from "react";
import type {
  ActivityRecord,
  Book,
  BookStatus,
  Message,
  Thread,
  UserProfile,
} from "./types";

const CURRENT_USER_ID = "current_user";
const GUEST_OWNER_ID = "guest_user";
const GUEST_BOOKS_KEY = "guest_books_v1";
const GUEST_PROFILE_KEY = "guest_profile_v1";
const GUEST_SAVED_KEY = "guest_saved_books_v1";

function loadGuestBooks(): Book[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_BOOKS_KEY);
    return raw ? (JSON.parse(raw) as Book[]) : [];
  } catch {
    return [];
  }
}

function loadGuestProfile(): { neighborhood_location: string; zip_code: string } {
  if (typeof window === "undefined") return { neighborhood_location: "", zip_code: "" };
  try {
    const raw = window.localStorage.getItem(GUEST_PROFILE_KEY);
    return raw ? JSON.parse(raw) : { neighborhood_location: "", zip_code: "" };
  } catch {
    return { neighborhood_location: "", zip_code: "" };
  }
}

function loadGuestSavedBooks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_SAVED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

const seedBooks: Book[] = [
  { id: "b1", title: "小王子", author: "圣埃克苏佩里", isbn: "9787020042494", script_type: "Simplified", age_range: "6+", status: "available", owner_id: "u_mei", owner_name: "Mei L.", cover_hue: 18 },
  { id: "b2", title: "猜猜我有多爱你", author: "山姆·麦克布雷尼", isbn: "9787539732220", script_type: "Simplified", age_range: "0-2", status: "available", owner_id: "u_jia", owner_name: "Jia W.", cover_hue: 38 },
  { id: "b3", title: "好餓的毛毛蟲", author: "艾瑞·卡爾", isbn: "9789573208709", script_type: "Traditional", age_range: "0-2", status: "for_sale", price: 6, owner_id: CURRENT_USER_ID, owner_name: "You", cover_hue: 62 },
  { id: "b4", title: "三毛流浪记", author: "张乐平", isbn: "9787532497034", script_type: "Simplified", age_range: "6+", status: "donation", owner_id: "platform_admin", owner_name: "Library Collection", cover_hue: 8 },
  { id: "b5", title: "我爸爸", author: "安东尼·布朗", isbn: "9787543463530", script_type: "Simplified", age_range: "3-5", status: "available", owner_id: CURRENT_USER_ID, owner_name: "You", cover_hue: 28 },
  { id: "b6", title: "彩虹色的花", author: "麦克·格雷涅茨", isbn: "9787539733814", script_type: "Simplified", age_range: "3-5", status: "reserved", owner_id: "u_ling", owner_name: "Ling H.", cover_hue: 320 },
  { id: "b7", title: "團圓", author: "余麗瓊", isbn: "9789862113325", script_type: "Traditional", age_range: "3-5", status: "for_sale", price: 8, owner_id: "u_chen", owner_name: "Chen Y.", cover_hue: 12 },
  { id: "b8", title: "西游记 (儿童版)", author: "吴承恩", isbn: "9787020127962", script_type: "Simplified", age_range: "6+", status: "donation", owner_id: "platform_admin", owner_name: "Library Collection", cover_hue: 48 },
];

const seedThreads: Thread[] = [
  { id: "t1", with_name: "Mei L.", book_title: "小王子" },
  { id: "t2", with_name: "Jia W.", book_title: "猜猜我有多爱你" },
];

const seedMessages: Message[] = [
  { id: "m1", thread_id: "t1", from: "u_mei", to: CURRENT_USER_ID, text: "Hi! Saw you requested 小王子 — happy to lend it 😊", at: "Tue 9:14 AM" },
  { id: "m2", thread_id: "t1", from: CURRENT_USER_ID, to: "u_mei", text: "Hey! I can meet at the park this Saturday for the book exchange.", at: "Tue 9:22 AM" },
  { id: "m3", thread_id: "t1", from: "u_mei", to: CURRENT_USER_ID, text: "Perfect — 10am at the playground bench works for us.", at: "Tue 9:30 AM" },
  { id: "m4", thread_id: "t2", from: "u_jia", to: CURRENT_USER_ID, text: "USPS Media Mail is great, I'll ship Monday!", at: "Mon 4:01 PM" },
];

const seedActivity: ActivityRecord[] = [
  { id: "a1", type: "lend", book_title: "我爸爸", at: "May 12", status: "Active loan", method: "Personal Meetup" },
  { id: "a2", type: "borrow", book_title: "彩虹色的花", at: "Apr 28", status: "Returned", method: "Porch Pickup" },
  { id: "a3", type: "buy", book_title: "團圓", at: "Apr 02", status: "Completed", method: "USPS Media Mail" },
];

const seedUser: UserProfile = {
  id: CURRENT_USER_ID,
  name: "Wei Chen",
  membership_status: "Free Tier Testing Mode",
  deposit_balance: 50.0,
  wallet_balance: 0.0,
  neighborhood_location: "",
  zip_code: "",
};

const guestUser: UserProfile = {
  id: "guest",
  name: "Guest Visitor (Temporary Account)",
  membership_status: "Free Tier Testing Mode",
  deposit_balance: 0,
  wallet_balance: 0,
  neighborhood_location: "",
  zip_code: "",
};

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  neighborhood: string;
  zip: string;
}

interface StoreCtx {
  user: UserProfile;
  books: Book[];
  savedBookIds: string[];
  threads: Thread[];
  messages: Message[];
  activity: ActivityRecord[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => void;
  signup: (input: SignupInput) => void;
  logout: () => void;
  addBook: (b: Omit<Book, "id" | "owner_id" | "owner_name" | "cover_hue"> & { cover_hue?: number; ownerOverride?: string }) => void;
  setBookStatus: (id: string, status: BookStatus) => void;
  requestBook: (book: Book, method: string, note: string) => void;
  sendMessage: (thread_id: string, text: string) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  toggleSaveBook: (id: string) => void;
  fetchBookMetadata: (isbn: string) => Promise<{ title: string; author: string } | null>;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>(() => {
    const guestBooks = loadGuestBooks();
    return [...guestBooks, ...seedBooks];
  });
  const [savedBookIds, setSavedBookIds] = useState<string[]>(() => loadGuestSavedBooks());
  const [threads, setThreads] = useState<Thread[]>(seedThreads);
  const [messages, setMessages] = useState<Message[]>(seedMessages);
  const [activity, setActivity] = useState<ActivityRecord[]>(seedActivity);
  const [user, setUser] = useState<UserProfile>(() => {
    const gp = loadGuestProfile();
    return { ...guestUser, ...gp };
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isAuthenticated) return;
    const guestBooks = books.filter((b) => b.owner_id === GUEST_OWNER_ID);
    try {
      window.localStorage.setItem(GUEST_BOOKS_KEY, JSON.stringify(guestBooks));
    } catch {
      /* ignore */
    }
  }, [books, isAuthenticated]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(GUEST_SAVED_KEY, JSON.stringify(savedBookIds));
    } catch {
      /* ignore */
    }
  }, [savedBookIds]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isAuthenticated) return;
    try {
      window.localStorage.setItem(
        GUEST_PROFILE_KEY,
        JSON.stringify({
          neighborhood_location: user.neighborhood_location,
          zip_code: user.zip_code,
        }),
      );
    } catch {
      /* ignore */
    }
  }, [user.neighborhood_location, user.zip_code, isAuthenticated]);

  const fetchBookMetadata = async (isbn: string): Promise<{ title: string; author: string } | null> => {
    const cleanIsbn = isbn.replace(/[- ]/g, "").trim();
    if (!cleanIsbn) return null;

    try {
      // 1. Try Open Library First
      const olUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`;
      const olRes = await fetch(olUrl);
      if (olRes.ok) {
        const olData = await olRes.json();
        const bookKey = `ISBN:${cleanIsbn}`;
        if (olData && olData[bookKey]) {
          const bookInfo = olData[bookKey];
          return {
            title: bookInfo.title || "Unknown Book",
            author: bookInfo.authors?.[0]?.name || "Unknown Author",
          };
        }
      }
    } catch (e) {
      console.warn("Open Library failed or timed out, trying fallback...", e);
    }

    try {
      // 2. Fallback to Google Books API (Comprehensive for Chinese/Bilingual context)
      const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`;
      const gbRes = await fetch(gbUrl);
      if (gbRes.ok) {
        const gbData = await gbRes.json();
        if (gbData && gbData.items && gbData.items.length > 0) {
          const volumeInfo = gbData.items[0].volumeInfo;
          return {
            title: volumeInfo.title || "Unknown Book",
            author: volumeInfo.authors?.[0] || volumeInfo.authors?.join(", ") || "Unknown Author",
          };
        }
      }
    } catch (e) {
      console.error("Google Books fallback failed:", e);
    }

    return null;
  };

  const toggleSaveBook = (id: string) => {
    setSavedBookIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addBook: StoreCtx["addBook"] = (b) => {
    const isDonation = b.status === "donation";
    const id = "b" + Math.random().toString(36).slice(2, 8);
    const owner_id = isDonation
      ? "platform_admin"
      : isAuthenticated
        ? CURRENT_USER_ID
        : GUEST_OWNER_ID;
    const owner_name = isDonation ? "Library Collection" : "You";
    setBooks((prev) => [
      { ...b, id, owner_id, owner_name, cover_hue: b.cover_hue ?? Math.floor(Math.random() * 360) },
      ...prev,
    ]);
  };

  const setBookStatus: StoreCtx["setBookStatus"] = (id, status) => {
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  };

  const requestBook: StoreCtx["requestBook"] = (book, method, note) => {
    setBooks((prev) => prev.map((b) => (b.id === book.id ? { ...b, status: "reserved" } : b)));
    const thread_id = "t" + Math.random().toString(36).slice(2, 7);
    setThreads((prev) => [{ id: thread_id, with_name: book.owner_name, book_title: book.title }, ...prev]);
    const text = note?.trim()
      ? `Hi! I'd like to ${book.status === "for_sale" ? "buy" : "borrow"} "${book.title}" via ${method}. ${note}`
      : `Hi! I'd like to ${book.status === "for_sale" ? "buy" : "borrow"} "${book.title}" via ${method}.`;
    setMessages((prev) => [
      ...prev,
      { id: "m" + Math.random().toString(36).slice(2, 7), thread_id, from: CURRENT_USER_ID, to: book.owner_id, text, at: "Just now" },
    ]);
    setActivity((prev) => [
      {
        id: "a" + Math.random().toString(36).slice(2, 7),
        type: book.status === "for_sale" ? "buy" : "borrow",
        book_title: book.title,
        at: "Just now",
        status: "Pending pickup",
        method,
      },
      ...prev,
    ]);
  };

  const sendMessage: StoreCtx["sendMessage"] = (thread_id, text) => {
    if (!text.trim()) return;
    const thread = threads.find((t) => t.id === thread_id);
    setMessages((prev) => [
      ...prev,
      { id: "m" + Math.random().toString(36).slice(2, 7), thread_id, from: CURRENT_USER_ID, to: thread?.with_name ?? "", text: text.trim(), at: "Just now" },
    ]);
  };

  const updateProfile: StoreCtx["updateProfile"] = (patch) => {
    setUser((prev) => ({ ...prev, ...patch }));
  };

  const mergeGuestBooks = () => {
    setBooks((prev) =>
      prev.map((b) =>
        b.owner_id === GUEST_OWNER_ID
          ? { ...b, owner_id: CURRENT_USER_ID, owner_name: "You" }
          : b,
      ),
    );
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(GUEST_BOOKS_KEY);
        window.localStorage.removeItem(GUEST_PROFILE_KEY);
      } catch {
        /* ignore */
      }
    }
  };

  const login: StoreCtx["login"] = (email) => {
    setUser({
      ...seedUser,
      neighborhood_location: user.neighborhood_location || seedUser.neighborhood_location,
      zip_code: user.zip_code || seedUser.zip_code,
    });
    setIsAuthenticated(true);
    mergeGuestBooks();
    void email;
  };

  const signup: StoreCtx["signup"] = ({ name, neighborhood, zip }) => {
    setUser({
      ...seedUser,
      name: name || seedUser.name,
      neighborhood_location: neighborhood || user.neighborhood_location,
      zip_code: zip || user.zip_code,
    });
    setIsAuthenticated(true);
    mergeGuestBooks();
  };

  const logout: StoreCtx["logout"] = () => {
    setUser(guestUser);
    setIsAuthenticated(false);
    setSavedBookIds([]);
  };

  return (
    <Ctx.Provider value={{ user, books, savedBookIds, threads, messages, activity, isAuthenticated, login, signup, logout, addBook, setBookStatus, requestBook, sendMessage, updateProfile, toggleSaveBook, fetchBookMetadata }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("StoreProvider missing");
  return v;
}

export { CURRENT_USER_ID };
