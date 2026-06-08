import { createContext, useContext, useState, type ReactNode } from "react";
import { useEffect } from "react";
import { supabase } from "./supabase";
import type {
  ActivityRecord,
  Book,
  BookStatus,
  Message,
  Thread,
  UserProfile,
} from "./types";

const CURRENT_USER_ID = "current_user";
const GUEST_SAVED_KEY = "guest_saved_books_v1";

function loadGuestSavedBooks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_SAVED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

// Keep the initial fallback mock data array safe for platform demonstrations
const seedBooks: Book[] = [
  { id: "b1", title: "小王子", author: "圣埃克苏佩里", isbn: "9787020042494", script_type: "Simplified", age_range: "6+", status: "available", owner_id: "u_mei", owner_name: "Mei L.", cover_hue: 18 },
  { id: "b2", title: "猜猜我有多爱你", author: "山姆·麦克布雷尼", isbn: "9787539732220", script_type: "Simplified", age_range: "0-2", status: "available", owner_id: "u_jia", owner_name: "Jia W.", cover_hue: 38 },
  { id: "b3", title: "好餓的毛毛虫", author: "艾瑞·卡爾", isbn: "9787533455323", script_type: "Traditional", age_range: "0-2", status: "for_sale", price: 6, owner_id: CURRENT_USER_ID, owner_name: "You", cover_hue: 62 },
  { id: "b4", title: "三毛流浪记", author: "张乐平", isbn: "9787532497034", script_type: "Simplified", age_range: "6+", status: "donation", owner_id: "platform_admin", owner_name: "Library Collection", cover_hue: 8 },
  { id: "b5", title: "我爸爸", author: "安东尼·布朗", isbn: "9787543463530", script_type: "Simplified", age_range: "3-5", status: "available", owner_id: CURRENT_USER_ID, owner_name: "You", cover_hue: 28 },
];

const guestUser: UserProfile = {
  id: "guest",
  name: "Guest Visitor",
  membership_status: "Free Tier",
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
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (input: SignupInput) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  addBook: (b: Omit<Book, "id" | "owner_id" | "owner_name" | "cover_hue"> & { cover_hue?: number }) => Promise<void>;
  setBookStatus: (id: string, status: BookStatus) => Promise<void>;
  requestBook: (book: Book, method: string, note: string) => void;
  sendMessage: (thread_id: string, text: string) => void;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  toggleSaveBook: (id: string) => void;
  fetchBookMetadata: (isbn: string) => Promise<{ title: string; author: string } | null>;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>(seedBooks);
  const [savedBookIds, setSavedBookIds] = useState<string[]>(() => loadGuestSavedBooks());
  const [user, setUser] = useState<UserProfile>(guestUser);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Stubs for messaging layouts
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activity, setActivity] = useState<ActivityRecord[]>([]);

  // Sync saved favorites to local browser space
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(GUEST_SAVED_KEY, JSON.stringify(savedBookIds));
    } catch { /* ignore */ }
  }, [savedBookIds]);

  // 🔄 Real-time synchronizer hook: Automatically polls database records on startup
  useEffect(() => {
    async function syncCatalog() {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Map postgres field layout structures into frontend type parameters
        const dbBooks: Book[] = data.map((b: any) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          isbn: b.isbn,
          script_type: b.script_type,
          age_range: b.age_range,
          status: b.status,
          owner_id: b.owner_id,
          owner_name: b.owner_name || "Community Member",
          cover_hue: b.cover_hue,
        }));
        setBooks([...dbBooks, ...seedBooks]);
      }
    }

    // Check if user is already securely logged in on browser session refresh
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        setIsAuthenticated(true);
        fetchAndSetProfile(session.user.id, session.user.email || "");
      }
    });

    syncCatalog();
  }, [isAuthenticated]);

  async function fetchAndSetProfile(userId: string, email: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setUser({
        id: userId,
        name: data.name || email.split("@")[0],
        membership_status: "Verified Library Member",
        deposit_balance: 50.0,
        wallet_balance: 0.0,
        neighborhood_location: data.neighborhood_location || "",
        zip_code: data.zip_code || "",
      });
    }
  }

  const login: StoreCtx["login"] = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    
    if (data.user) {
      setIsAuthenticated(true);
      await fetchAndSetProfile(data.user.id, email);
    }
    return { error: null };
  };

  const signup: StoreCtx["signup"] = async ({ name, email, password, neighborhood, zip }) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    if (data.user) {
      // Create their public data row record profile inside the SQL tables
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: data.user.id,
          name: name,
          neighborhood_location: neighborhood,
          zip_code: zip,
        },
      ]);

      if (profileError) console.error("Error creating public profile row:", profileError);

      setIsAuthenticated(true);
      setUser({
        id: data.user.id,
        name: name,
        membership_status: "Verified Library Member",
        deposit_balance: 50.0,
        wallet_balance: 0.0,
        neighborhood_location: neighborhood,
        zip_code: zip,
      });
    }
    return { error: null };
  };

  const logout: StoreCtx["logout"] = async () => {
    await supabase.auth.signOut();
    setUser(guestUser);
    setIsAuthenticated(false);
    setSavedBookIds([]);
  };

  const addBook: StoreCtx["addBook"] = async (b) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const coverHue = b.cover_hue ?? Math.floor(Math.random() * 360);

    // Save directly to Supabase using exact lowercase field types
    const { error } = await supabase.from("books").insert([
      {
        title: b.title,
        author: b.author,
        isbn: b.isbn ? b.isbn.replace(/[- ]/g, "").trim() : null,
        script_type: b.script_type,
        age_range: b.age_range,
        status: b.status,
        owner_id: session.user.id,
        owner_name: user.name || "Community Member",
        cover_hue: coverHue,
      },
    ]);

    if (error) {
      console.error("Database book insertion error:", error);
    } else {
      // Clean, instant state refresh: pull the newly updated catalog from the cloud
      const { data } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        const dbBooks: Book[] = data.map((row: any) => ({
          id: row.id,
          title: row.title,
          author: row.author,
          isbn: row.isbn,
          script_type: row.script_type,
          age_range: row.age_range,
          status: row.status,
          owner_id: row.owner_id,
          owner_name: row.owner_name || "Community Member",
          cover_hue: row.cover_hue,
        }));
        setBooks([...dbBooks, ...seedBooks]);
      }
    }
  };

  const setBookStatus: StoreCtx["setBookStatus"] = async (id, status) => {
    const { error } = await supabase
      .from("books")
      .update({ status })
      .eq("id", id);

    if (!error) {
      setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    }
  };

  const fetchBookMetadata = async (isbn: string): Promise<{ title: string; author: string } | null> => {
    const cleanIsbn =
