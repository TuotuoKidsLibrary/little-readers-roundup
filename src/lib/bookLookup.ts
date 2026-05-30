import type { AgeRange, ScriptType } from "./types";

export interface LookedUpBook {
  title: string;
  author: string;
  script_type: ScriptType;
  age_range: AgeRange;
  cover_hue: number;
}

// Mock catalog mimicking a Douban / external Chinese book API.
const catalog: Record<string, LookedUpBook> = {
  "9787020042494": { title: "小王子", author: "圣埃克苏佩里", script_type: "Simplified", age_range: "6+", cover_hue: 18 },
  "9787539732220": { title: "猜猜我有多爱你", author: "山姆·麦克布雷尼", script_type: "Simplified", age_range: "0-2", cover_hue: 38 },
  "9789573208709": { title: "好餓的毛毛蟲", author: "艾瑞·卡爾", script_type: "Traditional", age_range: "0-2", cover_hue: 62 },
  "9787543463530": { title: "我爸爸", author: "安东尼·布朗", script_type: "Simplified", age_range: "3-5", cover_hue: 28 },
  "9787539733814": { title: "彩虹色的花", author: "麦克·格雷涅茨", script_type: "Simplified", age_range: "3-5", cover_hue: 320 },
};

const fallbackTitles = ["神奇校车", "蚯蚓的日记", "活了一百万次的猫", "花婆婆", "鼠小弟系列"];
const fallbackAuthors = ["佚名", "新雅出版", "信谊编辑部", "亲子工坊"];

/**
 * Simulated client-side service that mimics an on-demand Edge Function
 * pulling book metadata from a Chinese database (e.g. Douban / OpenLibrary).
 */
export async function lookupIsbn(isbn: string): Promise<LookedUpBook> {
  // simulate network latency
  await new Promise((r) => setTimeout(r, 700));
  const known = catalog[isbn];
  if (known) return known;
  const seed = isbn.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const ages: AgeRange[] = ["0-2", "3-5", "6+"];
  return {
    title: fallbackTitles[seed % fallbackTitles.length],
    author: fallbackAuthors[seed % fallbackAuthors.length],
    script_type: seed % 2 === 0 ? "Simplified" : "Traditional",
    age_range: ages[seed % ages.length],
    cover_hue: seed % 360,
  };
}