import bcrypt from 'bcryptjs';
import { getRTDB } from './firebaseAdmin';
import { Tier } from './categories';

export interface Subscriber {
  uid: string;
  email: string;
  passwordHash: string;
  tier: Tier;
  tokenLimit: number;
  tokenUsed: number;
  orderId: string;
  createdAt: string;
}

function emailKey(email: string) {
  // Key Firebase RTDB tidak boleh mengandung ". # $ [ ]"
  return email.trim().toLowerCase().replace(/[.#$\[\]]/g, '_');
}

export async function findSubscriberByEmail(email: string): Promise<Subscriber | null> {
  const snap = await getRTDB().ref(`subscribers/${emailKey(email)}`).get();
  return snap.exists() ? (snap.val() as Subscriber) : null;
}

export async function getSubscriber(uid: string): Promise<Subscriber | null> {
  const snap = await getRTDB().ref(`subscribers/${uid}`).get();
  return snap.exists() ? (snap.val() as Subscriber) : null;
}

export async function createSubscriber(params: {
  email: string;
  password: string;
  tier: Tier;
  tokenLimit: number;
  orderId: string;
}): Promise<Subscriber> {
  const uid = emailKey(params.email);
  const existing = await getSubscriber(uid);
  if (existing) throw new Error('Email ini sudah terdaftar. Silakan login.');

  const passwordHash = await bcrypt.hash(params.password, 10);
  const subscriber: Subscriber = {
    uid,
    email: params.email,
    passwordHash,
    tier: params.tier,
    tokenLimit: params.tokenLimit,
    tokenUsed: 0,
    orderId: params.orderId,
    createdAt: new Date().toISOString(),
  };
  await getRTDB().ref(`subscribers/${uid}`).set(subscriber);
  return subscriber;
}

export async function verifyLogin(email: string, password: string): Promise<Subscriber | null> {
  const sub = await findSubscriberByEmail(email);
  if (!sub) return null;
  const ok = await bcrypt.compare(password, sub.passwordHash);
  return ok ? sub : null;
}

// Tambah token terpakai. Mengembalikan sisa token setelah dikurangi, atau
// null kalau limitnya sudah habis (dan tidak jadi menambah -- caller wajib
// cek dulu sisa limit sebelum memanggil AI API).
export async function addTokenUsage(uid: string, tokens: number): Promise<Subscriber | null> {
  const ref = getRTDB().ref(`subscribers/${uid}`);
  const result = await ref.transaction((current: Subscriber | null) => {
    if (!current) return current;
    current.tokenUsed = (current.tokenUsed || 0) + tokens;
    return current;
  });
  return result.committed ? (result.snapshot.val() as Subscriber) : null;
}
