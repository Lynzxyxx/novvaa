import { NextResponse } from 'next/server';
import { getUidFromCookies } from '@/lib/session';
import { getSubscriber } from '@/lib/subscribers';
import { getCategory } from '@/lib/categories';

export async function GET() {
  const uid = getUidFromCookies();
  if (!uid) return NextResponse.json({ loggedIn: false, tier: 1 });

  const sub = await getSubscriber(uid);
  if (!sub) return NextResponse.json({ loggedIn: false, tier: 1 });

  const category = getCategory(sub.tier);
  return NextResponse.json({
    loggedIn: true,
    email: sub.email,
    tier: sub.tier,
    categoryName: category?.name,
    tokenLimit: sub.tokenLimit,
    tokenUsed: sub.tokenUsed,
    tokenRemaining: Math.max(0, sub.tokenLimit - sub.tokenUsed),
  });
}
