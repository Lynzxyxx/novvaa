import { NextResponse } from 'next/server';
import { checkInvoiceStatus } from '@/lib/qris';
import { getOrder, markOrderPaid } from '@/lib/orders';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    if (!orderId) return NextResponse.json({ error: 'orderId wajib diisi.' }, { status: 400 });

    const order = await getOrder(orderId);
    if (!order) return NextResponse.json({ error: 'Pesanan tidak ditemukan.' }, { status: 404 });

    if (order.status === 'paid') {
      return NextResponse.json({ status: 'paid', order });
    }

    const status = await checkInvoiceStatus(orderId);
    if (status === 'paid') {
      await markOrderPaid(orderId);
    }
    return NextResponse.json({ status, order: { ...order, status } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Gagal mengecek status pembayaran.' }, { status: 500 });
  }
}
