import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "zh";

const STORAGE_KEY = "app_lang_v1";

const dict = {
  // Brand & nav
  slogan: { en: "Our Shared Chinese Children's Library", zh: "我们大家的中文绘本馆" },
  nav_library: { en: "Community Library", zh: "社群书库" },
  nav_shelf: { en: "My Shelf", zh: "我的书架" },
  nav_account: { en: "Account", zh: "个人中心" },
  // Buttons / inputs
  contribute: { en: "Contribute", zh: "分享绘本" },
  contribute_plus: { en: "+ Contribute", zh: "+ 分享绘本" },
  search_placeholder: {
    en: "Search titles, authors, or filter by book status...",
    zh: "搜索书名、作者或按图书状态筛选...",
  },
  scan_isbn: { en: "Scan ISBN Barcode", zh: "扫描ISBN条形码" },
  log_in: { en: "Log In", zh: "登录" },
  log_out: { en: "Log out", zh: "退出登录" },
  // Statuses
  status_lend: { en: "Lend", zh: "借阅" },
  status_sell: { en: "Sell", zh: "出售" },
  status_donate: { en: "Donate", zh: "捐赠" },
  status_private: { en: "Private", zh: "私有" },
  // Home subtitle
  home_subtitle: {
    en: "Books contributed by families across the club. Tap any book to view the book status and arrange a meetup, porch pickup, or Media Mail.",
    zh: "绘本馆会员家庭分享的图书。点击任意图书查阅图书状态并安排自提、面交或邮寄。",
  },
  // Shelf
  shelf_guest_banner: {
    en: "You are viewing a temporary shelf. Become a member to permanently save your books, track reading requests, and safely share with other families!",
    zh: "您正在查看临时书架。加入成为会员以保存您的图书、追踪借阅请求，并与其他家庭分享！",
  },
  shelf_empty: {
    en: "You haven't contributed any books yet — tap + Contribute to add one.",
    zh: "您还没有分享过任何图书 — 点击 + 分享绘本 来添加吧。",
  },
  create_account: { en: "Create Account", zh: "创建账户" },
  // Account
  account_guest_name: { en: "Guest", zh: "访客" },
  account_signup_callout: {
    en: "Right now, your contributions are stored safely on this device only. Sign up today to start managing your children's Chinese books and sharing books with the community!",
    zh: "目前您的图书仅安全保存在此设备上。立即注册，开始管理您孩子的中文绘本并与社群成员分享吧！",
  },
} as const;

export type TKey = keyof typeof dict;

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (k: TKey) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored === "en" || stored === "zh") setLangState(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, l);
      } catch {
        /* ignore */
      }
    }
  };

  const toggle = () => setLang(lang === "en" ? "zh" : "en");
  const t = (k: TKey) => dict[k][lang];

  return <Ctx.Provider value={{ lang, setLang, toggle, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("I18nProvider missing");
  return v;
}