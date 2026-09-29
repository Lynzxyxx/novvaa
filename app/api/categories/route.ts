import { NextResponse } from 'next/server';
import { getAllCategories } from '@/lib/categories';

// Publik: daftar kategori model yang aktif (tanpa data sensitif)
export async function GET() {
  const categories = getAllCategories().map((c) => ({
    tier: c.tier,
    name: c.name,
    paid: c.paid,
    price: c.price,
    tokenLimit: c.tokenLimit,
  }));
  return NextResponse.json({ categories });
}
