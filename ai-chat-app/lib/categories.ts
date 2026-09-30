// Konfigurasi kategori model, 100% dari Environment Variables.
// ATURAN OTOMATIS: kategori N hanya aktif/tampil kalau CATEGORY_N_MODEL terisi
// (kategori 1 fallback ke CHAT_MODEL). Base URL & API key per kategori opsional;
// kalau kosong memakai CHAT_API_BASE_URL / CHAT_API_KEY.

export type Tier = 1 | 2 | 3;

export interface CategoryConfig {
  tier: Tier;
  name: string;
  model: string;
  visionModel?: string;
  baseUrl?: string;
  apiKey?: string;
  paid: boolean;
  price: number; // rupiah
  tokenLimit: number;
}

const DEFAULTS: Record<Tier, { name: string; model: string; price: number; limit: number }> = {
  1: { name: 'Nova AI Kategori glm-5.3', model: 'glm-5.3', price: 0, limit: 0 },
  2: { name: 'Nova AI Kategori glm-5.3-flash', model: 'glm-5.3-flash', price: 5000, limit: 4_000_000 },
  3: { name: 'Nova AI Kategori glm-5.3-flashx-mod', model: 'glm-5.3-flashx-mod', price: 8000, limit: 8_000_000 },
};

export function getCategory(tier: Tier): CategoryConfig | null {
  const e = process.env;
  const model =
    e[`CATEGORY_${tier}_MODEL`] || (tier === 1 ? e.CHAT_MODEL : '') || '';
  if (!model) return null;
  const d = DEFAULTS[tier];
  return {
    tier,
    name: e[`CATEGORY_${tier}_NAME`] || d.name,
    model,
    visionModel: e[`CATEGORY_${tier}_VISION_MODEL`] || e.CHAT_VISION_MODEL || undefined,
    baseUrl: e[`CATEGORY_${tier}_API_BASE_URL`] || e.CHAT_API_BASE_URL,
    apiKey: e[`CATEGORY_${tier}_API_KEY`] || e.CHAT_API_KEY,
    paid: tier !== 1,
    price: tier === 1 ? 0 : Number(e[`CATEGORY_${tier}_PRICE`] || d.price),
    tokenLimit: tier === 1 ? 0 : Number(e[`CATEGORY_${tier}_TOKEN_LIMIT`] || d.limit),
  };
}

export function getAllCategories(): CategoryConfig[] {
  return ([1, 2, 3] as Tier[]).map(getCategory).filter(Boolean) as CategoryConfig[];
}

export function parseTier(v: unknown): Tier {
  const n = Number(v);
  return n === 2 || n === 3 ? n : 1;
}
