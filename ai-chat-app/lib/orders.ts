import { getRTDB } from './firebaseAdmin';
import { Tier } from './categories';

export interface Order {
  orderId: string;
  tier: Tier;
  amount: number;
  status: 'pending' | 'paid' | 'expired';
  paymentUrl?: string;
  qrImageUrl?: string;
  createdAt: string;
  paidAt?: string;
}

export async function saveOrder(order: Order) {
  await getRTDB().ref(`orders/${order.orderId}`).set(order);
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const snap = await getRTDB().ref(`orders/${orderId}`).get();
  return snap.exists() ? (snap.val() as Order) : null;
}

export async function markOrderPaid(orderId: string) {
  await getRTDB().ref(`orders/${orderId}`).update({ status: 'paid', paidAt: new Date().toISOString() });
}
