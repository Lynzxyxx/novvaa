import { NextResponse } from 'next/server';
import { getUidFromCookies } from '@/lib/session';
import { getSubscriber } from '@/lib/subscribers';

// Endpoint khusus tombol "Cek Limit" -- selalu ambil data terbaru dari Firebase.
export async function GET() {
  const uid = getUidFromCookies();
  if (!uid) {
    return NextResponse.json({ error: 'Kamu belum login sebagai pelanggan berlangganan.' }, { status: 401 });
  }
  const sub = await getSubscriber(uid);
  if (!sub) return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });

  return NextResponse.json({
    tier: sub.tier,
    tokenLimit: sub.tokenLimit,
    tokenUsed: sub.tokenUsed,
    tokenRemaining: Math.max(0, sub.tokenLimit - sub.tokenUsed),
  });
}
