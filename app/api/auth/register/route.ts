import { NextResponse } from 'next/server';
import { getOrder } from '@/lib/orders';
import { getCategory } from '@/lib/categories';
import { createSubscriber } from '@/lib/subscribers';
import { createSessionCookie } from '@/lib/session';

// Dipanggil dari layar "Buat Akun" SETELAH pesanan QRIS berstatus paid.
export async function POST(req: Request) {
  try {
    const { orderId, email, password } = await req.json();
    if (!orderId || !email || !password) {
      return NextResponse.json({ error: 'orderId, email, dan password wajib diisi.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter.' }, { status: 400 });
    }

    const order = await getOrder(orderId);
    if (!order) return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    if (order.status !== 'paid') {
      return NextResponse.json({ error: 'Pesanan ini belum terbayar. Selesaikan pembayaran dulu.' }, { status: 402 });
    }

    const category = getCategory(order.tier);
    if (!category) {
      return NextResponse.json({ error: 'Kategori pesanan ini tidak valid.' }, { status: 500 });
    }

    const subscriber = await createSubscriber({
      email,
      password,
      tier: order.tier,
      tokenLimit: category.tokenLimit,
      orderId,
    });

    const cookie = createSessionCookie(subscriber.uid);
    const res = NextResponse.json({
      ok: true,
      email: subscriber.email,
      tier: subscriber.tier,
      tokenLimit: subscriber.tokenLimit,
    });
    res.cookies.set(cookie.name, cookie.value, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: cookie.maxAge,
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Gagal membuat akun.' }, { status: 500 });
  }
}
