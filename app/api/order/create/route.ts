import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getCategory, parseTier } from '@/lib/categories';
import { createInvoice } from '@/lib/qris';
import { saveOrder } from '@/lib/orders';

export async function POST(req: Request) {
  try {
    const { tier } = await req.json();
    const t = parseTier(tier);
    if (t === 1) {
      return NextResponse.json({ error: 'Kategori 1 gratis, tidak perlu pesanan.' }, { status: 400 });
    }
    const category = getCategory(t);
    if (!category) {
      return NextResponse.json({ error: 'Kategori ini belum dikonfigurasi di server.' }, { status: 500 });
    }

    const orderId = randomUUID();
    const invoice = await createInvoice(category.price, orderId);

    await saveOrder({
      orderId,
      tier: t,
      amount: category.price,
      status: 'pending',
      qrString: invoice.qrString,
      qrImageUrl: invoice.qrImageUrl,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      orderId,
      tier: t,
      amount: category.price,
      qrString: invoice.qrString,
      qrImageUrl: invoice.qrImageUrl,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Gagal membuat pesanan QRIS.' }, { status: 500 });
  }
}
