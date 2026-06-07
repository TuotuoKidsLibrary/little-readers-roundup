import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "zh";

const STORAGE_KEY = "app_lang_v1";

const dict = {
  brand_name: { en: "Tuotuo Kids Library", zh: "妥妥绘本馆" },
  slogan: { en: "Grow Our Library, Raise Bilingual Children", zh: "共创中文绘本馆 培养双语儿童" },
  nav_library: { en: "Community Library", zh: "社群书库" },
  nav_shelf: { en: "My Shelf", zh: "我的书架" },
  nav_account: { en: "Account", zh: "个人中心" },
  contribute: { en: "Contribute", zh: "分享绘本" },
  contribute_plus: { en: "+ Contribute", zh: "+ 分享绘本" },
  search_placeholder: {
    en: "Search titles, authors, or filter by book status...",
    zh: "搜索书名、作者或按图书状态筛选...",
  },
  scan_isbn: { en: "Scan ISBN Barcode", zh: "扫描ISBN条形码" },
  log_in: { en: "Log In", zh: "登录" },
  log_out: { en: "Log Out", zh: "退出登录" },
  status_lend: { en: "Lend", zh: "借阅" },
  status_sell: { en: "Sell", zh: "出售" },
  status_donate: { en: "Donate", zh: "捐赠" },
  status_private: { en: "Private", zh: "私有" },
  home_subtitle: {
    en: "Books contributed by families across the club. Tap any book to view the book status and arrange a meetup, porch pickup, or Media Mail.",
    zh: "绘本馆会员家庭分享的图书。点击任意图书查阅图书状态并安排自提、面交或邮寄。",
  },
  shelf_guest_banner: {
    en: "You are viewing a temporary shelf. Become a member to permanently save your books, track reading requests, and safely share with other families!",
    zh: "您正在查看临时书架。成为会员以保存您的图书、追踪借阅请求，并与其他家庭分享！",
  },
  shelf_empty: {
    en: "You haven't contributed any books yet — tap + Contribute to add one.",
    zh: "您还没有分享过任何图书 — 点击 + 分享绘本 来添加吧。",
  },
  create_account: { en: "Create Account", zh: "创建账户" },
  shelf_title: { en: "My Shelf & Activity", zh: "我的书架和分享情况" },
  shelf_subtitle: {
    en: "Manage your books, conversations, and exchange history.",
    zh: "管理您的图书、对话和分享历史。",
  },
  tab_contrib: { en: "Contributions", zh: "我的图书" },
  tab_msg: { en: "Messages", zh: "信息" },
  tab_history: { en: "History", zh: "历史" },
  total_contributed: { en: "Total Contributed", zh: "总共分享的图书册数" },
  active_loans: { en: "Active Loans", zh: "正在借阅的册数" },
  no_exchanges: { en: "No exchanges yet.", zh: "暂无分享记录。" },
  no_conversations: { en: "No conversations yet.", zh: "暂无对话。" },
  pick_conversation: { en: "Pick a conversation to start chatting.", zh: "选择一个对话开始聊天。" },
  send_message_placeholder: { en: "Send a message…", zh: "发送消息…" },
  account_title: { en: "Account & Membership", zh: "账号和会员信息" },
  account_guest_name: { en: "Guest", zh: "访客" },
  account_guest_subtitle: { en: "Books saved on this device only", zh: "图书仅保存在此设备上" },
  account_member_since: { en: "Member since May 2025", zh: "2025年5月加入" },
  account_signup_callout: {
    en: "Right now, your contributions are stored safely on this device only. Sign up today to start managing your children's Chinese books and sharing books with the community!",
    zh: "目前您的图书仅保存在此设备上。立即注册，开始管理您孩子的中文绘本并与社群分享图书吧！",
  },
  unlock_perks: { en: "Unlock Full Membership Perks!", zh: "解锁会员功能！" },
  convert_account: { en: "Become a Member", zh: "成为会员" },
  login_title: { en: "Welcome to Tuotuo Kids Library", zh: "欢迎来到妥妥绘本馆" },
  login_description: { en: "Log in or create a free account to join the community", zh: "登录 or 创建账户加入我们的社群" },
  edit: { en: "Edit", zh: "编辑" },
  neighborhood_label: { en: "Neighborhood / Community Name", zh: "所在社区" },
  zip_label: { en: "Zip Code", zh: "邮政编码" },
  neighborhood_hint: {
    en: "Used to help local parents calculate meetup distances for exchanges.",
    zh: "用于帮助附近家长计算面交距离。",
  },
  membership_badge: { en: "Membership", zh: "会员" },
  membership_blurb: {
    en: "You're in free testing mode — unlimited borrows and listings while we pilot the club.",
    zh: "您正在使用免费试用版 — 试运营期间可无限借阅和上架。",
  },
  upgrade: { en: "Upgrade", zh: "升级" },
  wallet_title: { en: "Digital Wallet & Deposits", zh: "数字钱包和押金" },
  refundable_deposit: { en: "Refundable Security Deposit", zh: "可退还押金" },
  deposit_hint: { en: "Held while you have active loans.", zh: "借阅期间冻结。" },
  wallet_balance: { en: "Wallet Balance", zh: "钱包余额" },
  wallet_hint: { en: "Earnings from sold books.", zh: "出售绘本的收益。" },
  billing: { en: "Billing", zh: "账单" },
  card_number: { en: "Card number", zh: "卡号" },
  expiry: { en: "Expiry", zh: "有效期" },
  cvc: { en: "CVC", zh: "安全码" },
  save_payment: { en: "Save payment method", zh: "保存支付方式" },
  login_tab: { en: "Login", zh: "登录" },
  signup_tab: { en: "Sign Up", zh: "注册" },
  create_account_long: { en: "Create an Account", zh: "创建账户" },
  name: { en: "Name", zh: "姓名" },
  email: { en: "Email Address", zh: "电子邮箱" },
  password: { en: "Password", zh: "密码" },
  neighborhood: { en: "Neighborhood", zh: "所在社区" },
  zip: { en: "Zip Code", zh: "邮政编码" },
  create_my_account: { en: "Create my account", zh: "创建账户" },
  welcome_back: { en: "Welcome back!", zh: "欢迎回来！" },
  contribute_title: { en: "Contribute a book", zh: "分享一本绘本" },
  contribute_subtitle: {
    en: "Start by scanning or entering the ISBN, then pick how to share it.",
    zh: "先扫描或输入 ISBN，然后选择分享方式。",
  },
  book_title: { en: "Book Title", zh: "书名" },
  author: { en: "Author", zh: "作者" },
  title_zh_placeholder: { en: "Title (中文)", zh: "书名（中文）" },
  isbn_number: { en: "ISBN Number", zh: "ISBN 条形码编号" },
  manual_entry: { en: "Or enter 13-digit ISBN manually", zh: "或手动输入 13 位 ISBN" },
  lookup_book: { en: "Look up book", zh: "查询绘本" },
  searching_db: { en: "Searching public library databases...", zh: "正在查询公共图书数据库..." },
  isbn_not_found: {
    en: "This special edition isn't in the global public registry yet! Help us document it by filling in the details below to add it to our community shelf.",
    zh: "此版本尚未录入全球公共书库！欢迎手动填写下方信息，协助我们完善社群书架。",
  },
  pulled_from_cache: {
    en: "Found in our community library — confirm details below.",
    zh: "来自社群书库 — 请在下方确认信息。",
  },
  pulled_from_ol: {
    en: "Pulled from Open Library — confirm details below.",
    zh: "数据来自 Open Library — 请在下方确认信息。",
  },
  select_sharing_option: { en: "Select Sharing Option", zh: "选择分享方式" },
  confirm_book_details: { en: "Confirm book details", zh: "确认绘本信息" },
  confirm_add_book: { en: "Confirm & Add Book", zh: "确认并添加绘本" },
  save_to_private_shelf: { en: "Save to my shelf", zh: "保存到我的书架" },
  cancel: { en: "Cancel", zh: "取消" },
  asking_price: { en: "Asking price ($)", zh: "售价（$）" },
  donation_note: {
    en: "Donated books go to the central Library — please coordinate drop-off at the Admin Hub.",
    zh: "捐赠的绘本将归入中央绘本馆 — 请与管理中心协调送达事宜。",
  },
  private_note: {
    en: "Keep track of your personal collection privately—you can easily toggle this to public when your kids outgrow it!",
    zh: "私密保存您的个人藏书 — 等孩子长大后可一键切换为公开分享！",
  },
  script_type: { en: "Script Type", zh: "中文字体" },
  select_script_type: { en: "Select Script Type", zh: "选择字体" },
  script_simplified: { en: "Simplified Chinese", zh: "简体" },
  script_traditional: { en: "Traditional Chinese", zh: "繁体" },
  age_range: { en: "Age Range", zh: "适用年龄" },
  select_age_range: { en: "Select Age Range", zh: "选择年龄段" },
  age_0_2: { en: "0-2 Years Old", zh: "0-2 岁" },
  age_3_5: { en: "3-5 Years Old", zh: "3-5 岁" },
  age_6_plus: { en: "6+ Years Old", zh: "6 岁以上" },
  lend_sub: { en: "Share with another family — they return when done.", zh: "与其他家庭分享 — 阅读后归还。" },
  sell_sub: { en: "Set an asking price; buyer pays you directly.", zh: "设定售价，买家直接付款给您。" },
  donate_sub: { en: "Goes into the central Library collection.", zh: "捐入中央绘本馆收藏。" },
  private_sub: { en: "Only visible to you on your My Contributions tab.", zh: "仅在您的个人书架可见。" },
  our_story_title: { en: "Our Story & Mission", zh: "我们的初衷" },
  our_story_body: {
    en: "As parents raising bilingual children, we know firsthand how difficult and expensive it can be to source high-quality, physical Chinese children's books locally. Often, beautiful books sit isolated on individual family shelves once read.\n\nDo you wish that you had easier access to Chinese children's books, just like a local library provides for English children's books? Do you wish that you could easily rehome the Chinese children's books you've perhaps lugged all the way across the ocean, which your kids have now outgrown and are left collecting dust?\n\nWe built this club to change that. By safely sharing our home libraries, we aren't just recycling stories. Together, we can build a thriving community that keeps our heritage language alive and raises confident, bilingual children.",
    zh: "作为培养双语儿童的父母，我们深知在国内以外的地方获取高质量、纸质中文绘本有多么困难且昂贵。很多时候，优秀的绘本在被自家孩子读完后，就只能孤零零地躺在书架上。\n\n您是否也希望像使用本地英文图书馆那样，能够轻而易举地借阅到丰富的儿童绘本？您是否也曾为了给孩子带书，不远万里把一箱箱中文绘本跨洋背过来，而现在孩子长大了，这些书只能在角落里落灰，您希望能为它们找到一个温暖的新家？\n\n我们创建这个绘本馆正是为了改变这一现状。通过分享我们各自的家庭藏书，我们不仅是在让故事流动起来——更是在共同打造一个属于我们大家的中文绘本网络。齐心协力，我们可以建立一个充满活力的社群，让汉语文化生生不息，共同培养自信的双语儿童。",
  },
  book_details_title: { en: "Book Details", zh: "绘本详情" },
  exchange_subtitle: { en: "Review and arrange this exchange.", zh: "查阅并安排此次分享。" },
  shared_by: { en: "Shared by", zh: "分享者" },
  save_for_later: { en: "Save for Later", zh: "稍后阅读" },
  fulfillment_title: { en: "Fulfillment Details", zh: "取书方式" },
  fulfillment_desc: { en: "Choose how you'd like to receive this book.", zh: "选择您方便的取书渠道。" },
  message_to_owner: { en: "Message to Owner", zh: "给书主的留言" },
  message_hint: { en: "(Optional details, preferred times, etc.)", zh: "（可选：方便的取书时间等）" },
  message_placeholder: { en: "Hey! Saturdays after 10am work best for me…", zh: "您好！我周六上午10点之后方便自提…" },
  btn_back: { en: "Back", zh: "返回" },
  btn_submit: { en: "Submit Request", zh: "确认提交" },
  btn_reserved: { en: "Currently Reserved", zh: "已被预约" },
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
