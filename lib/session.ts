import crypto from 'crypto';
import { cookies } from 'next/headers';

// Session sederhana pakai cookie ter-tanda-tangan (HMAC), tanpa NextAuth.
// Isinya cuma uid subscriber. Dipakai supaya pelanggan berlangganan tetap
// "login" tanpa perlu sistem auth penuh.

const COOKIE_NAME = 'nova_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 hari

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET belum diisi di Environment Variables.');
  return s;
}

function sign(uid: string, exp: number) {
  const payload = `${uid}.${exp}`;
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verify(token: string): string | null {
  try {
    const [uid, expStr, sig] = token.split('.');
    const exp = Number(expStr);
    if (!uid || !exp || !sig) return null;
    if (Date.now() > exp) return null;
    const expected = crypto.createHmac('sha256', secret()).update(`${uid}.${exp}`).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return uid;
  } catch {
    return null;
  }
}

export function createSessionCookie(uid: string) {
  const exp = Date.now() + MAX_AGE * 1000;
  return { name: COOKIE_NAME, value: sign(uid, exp), maxAge: MAX_AGE };
}

export function getUidFromCookies(): string | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verify(token);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
