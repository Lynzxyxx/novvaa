import { NextResponse } from 'next/server';
import { verifyLogin } from '@/lib/subscribers';
import { createSessionCookie } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi.' }, { status: 400 });
    }
    const sub = await verifyLogin(email, password);
    if (!sub) {
      return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
    }
    const cookie = createSessionCookie(sub.uid);
    const res = NextResponse.json({
      ok: true,
      email: sub.email,
      tier: sub.tier,
      tokenLimit: sub.tokenLimit,
      tokenUsed: sub.tokenUsed,
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
    return NextResponse.json({ error: e?.message || 'Gagal login.' }, { status: 500 });
  }
}
