import { NextResponse } from 'next/server';
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

    const invoice = await createInvoice(category.price, `Langganan ${category.name}`);
    // orderId kita = transaction_id dari BuatQris, supaya cek status tinggal
    // pakai ID yang sama tanpa perlu tabel mapping tambahan.
    const orderId = invoice.transactionId;

    await saveOrder({
      orderId,
      tier: t,
      amount: category.price,
      status: 'pending',
      qrImageUrl: invoice.qrUrl,
      paymentUrl: invoice.paymentUrl,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      orderId,
      tier: t,
      amount: category.price,
      qrImageUrl: invoice.qrUrl,
      paymentUrl: invoice.paymentUrl,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Gagal membuat pesanan QRIS.' }, { status: 500 });
  }
}
