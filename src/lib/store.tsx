import { createContext, useContext, useState, type ReactNode } from "react";
import { useEffect } from "react";
import { supabase } from "./supabase";
import type {
  Book,
  BookRequest,
  BookStatus,
  Message,
  Thread,
  UserProfile,
} from "./types";

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
  requests: BookRequest[];
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (input: SignupInput) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  addBook: (b: Omit<Book, "id" | "owner_id" | "owner_name" | "cover_hue"> & { cover_hue?: number }) => Promise<void>;
  setBookStatus: (id: string, status: BookStatus) => Promise<void>;
  requestBook: (book: Book, method: string, note: string) => Promise<{ error: string | null }>;
  sendMessage: (requestId: string, text: string) => Promise<{ error: string | null }>;
  fetchMessagesForThread: (requestId: string) => Promise<Message[]>;
  updateRequestStatus: (requestId: string, status: BookRequest["status"]) => Promise<{ error: string | null }>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  toggleSaveBook: (id: string) => void;
  fetchBookMetadata: (isbn: string) => Promise<{ title: string; author: string } | null>;
}

const Ctx = createContext<StoreCtx | null>(null);

async function loadCatalog(): Promise<Book[]> {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((b: any) => ({
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
    cover_url: b.cover_url || undefined,
  }));
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [savedBookIds, setSavedBookIds] = useState<string[]>(() => loadGuestSavedBooks());
  const [user, setUser] = useState<UserProfile>(guestUser);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(GUEST_SAVED_KEY, JSON.stringify(savedBookIds));
    } catch { /* ignore */ }
  }, [savedBookIds]);

  useEffect(() => {
    loadCatalog().then(setBooks);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        setIsAuthenticated(true);
        fetchAndSetProfile(session.user.id, session.user.email || "");
        fetchRequestsAndMessages(session.user.id);
      }
    });
  }, []);

  // Poll for new messages every 15s when logged in
  useEffect(() => {
    if (!isAuthenticated || user.id === "guest") return;
    const interval = setInterval(() => fetchRequestsAndMessages(user.id), 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user.id]);

  async function fetchAndSetProfile(userId: string, email: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    setUser({
      id: userId,
      name: data?.name || email.split("@")[0],
      membership_status: "Verified Library Member",
      deposit_balance: 0,
      wallet_balance: 0,
      neighborhood_location: data?.neighborhood_location || "",
      zip_code: data?.zip_code || "",
    });
  }

  async function fetchRequestsAndMessages(userId: string) {
    const { data: reqData } = await supabase
      .from("requests")
      .select("*")
      .or(`requester_id.eq.${userId},owner_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (reqData) setRequests(reqData as BookRequest[]);

    const { data: msgData } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: true });

    if (msgData) setMessages(msgData as Message[]);
  }

  const login: StoreCtx["login"] = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    if (data.user) {
      setIsAuthenticated(true);
      await fetchAndSetProfile(data.user.id, email);
      await fetchRequestsAndMessages(data.user.id);
    }
    return { error: null };
  };

  const signup: StoreCtx["signup"] = async ({ name, email, password, neighborhood, zip }) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    if (data.user) {
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
        deposit_balance: 0,
        wallet_balance: 0,
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
    setRequests([]);
    setMessages([]);
  };

  const addBook: StoreCtx["addBook"] = async (b) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const coverHue = b.cover_hue ?? Math.floor(Math.random() * 360);

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
      setBooks(await loadCatalog());
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

  const updateProfile: StoreCtx["updateProfile"] = async (patch) => {
    if (user.id === "guest") return;

    const { error } = await supabase
      .from("profiles")
      .update({
        name: patch.name,
        neighborhood_location: patch.neighborhood_location,
        zip_code: patch.zip_code,
      })
      .eq("id", user.id);

    if (!error) {
      setUser((prev) => ({ ...prev, ...patch }));
    } else {
      console.error("Error updating database profile info:", error);
    }
  };

  const fetchBookMetadata = async (isbn: string): Promise<{ title: string; author: string } | null> => {
    const cleanIsbn = isbn.replace(/[- ]/g, "").trim();
    if (!cleanIsbn) return null;

    try {
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
    } catch (e) { /* fallback hook */ }

    try {
      const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`;
      const gbRes = await fetch(gbUrl);
      if (gbRes.ok) {
        const gbData = await gbRes.json();
        if (gbData && gbData.items && gbData.items.length > 0) {
          const volumeInfo = gbData.items[0].volumeInfo;
          return {
            title: volumeInfo.title || "Unknown Book",
            author: volumeInfo.authors?.[0] || "Unknown Author",
          };
        }
      }
    } catch (e) { console.error(e); }

    return null;
  };

  const toggleSaveBook = (id: string) => {
    setSavedBookIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const requestBook: StoreCtx["requestBook"] = async (book, method, note) => {
    if (user.id === "guest") return { error: "Please log in to request a book." };

    const { error } = await supabase.from("requests").insert([
      {
        book_id: book.id,
        book_title: book.title,
        requester_id: user.id,
        requester_name: user.name,
        owner_id: book.owner_id,
        method,
        note: note || null,
        status: "pending",
      },
    ]);

    if (error) {
      console.error("Error creating request:", error);
      return { error: error.message };
    }

    await setBookStatus(book.id, "reserved");
    await fetchRequestsAndMessages(user.id);
    return { error: null };
  };

  const sendMessage: StoreCtx["sendMessage"] = async (requestId, text) => {
    if (user.id === "guest") return { error: "Please log in to send messages." };

    const request = requests.find((r) => r.id === requestId);
    if (!request) return { error: "Conversation not found." };

    const recipientId = request.requester_id === user.id ? request.owner_id : request.requester_id;

    const { error } = await supabase.from("messages").insert([
      {
        request_id: requestId,
        sender_id: user.id,
        recipient_id: recipientId,
        text,
      },
    ]);

    if (error) {
      console.error("Error sending message:", error);
      return { error: error.message };
    }

    await fetchRequestsAndMessages(user.id);
    return { error: null };
  };

  const updateRequestStatus: StoreCtx["updateRequestStatus"] = async (requestId, status) => {
    const { error } = await supabase
      .from("requests")
      .update({ status })
      .eq("id", requestId);

    if (error) return { error: error.message };

    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status } : r))
    );

    if (status === "declined") {
      const req = requests.find((r) => r.id === requestId);
      if (req) await setBookStatus(req.book_id, "available");
    }

    return { error: null };
  };

  const fetchMessagesForThread = async (requestId: string): Promise<Message[]> => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });

    return (data as Message[]) || [];
  };

  const threads: Thread[] = requests.map((r) => {
    const isOwner = r.owner_id === user.id;
    const threadMessages = messages.filter((m) => m.request_id === r.id);
    const last = threadMessages[threadMessages.length - 1];
    return {
      id: r.id,
      book_title: r.book_title,
      other_user_name: isOwner ? r.requester_name : "Book Owner",
      other_user_id: isOwner ? r.requester_id : r.owner_id,
      last_message: last ? last.text : `Requested via ${r.method}${r.note ? `: "${r.note}"` : ""}`,
      last_message_at: last ? last.created_at : r.created_at,
    };
  });

  return (
    <Ctx.Provider
      value={{
        user,
        books,
        savedBookIds,
        threads,
        messages,
        requests,
        isAuthenticated,
        login,
        signup,
        logout,
        addBook,
        setBookStatus,
        requestBook,
        sendMessage,
        fetchMessagesForThread,
        updateRequestStatus,
        updateProfile,
        toggleSaveBook,
        fetchBookMetadata,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("StoreProvider missing");
  return v;
}
