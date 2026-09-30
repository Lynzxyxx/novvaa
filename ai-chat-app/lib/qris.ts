/**
 * Adapter pembayaran QRIS via api.buatqris.site
 * (diverifikasi dari dokumentasi resmi di https://buatqris.site/#docs)
 *
 * Satu endpoint saja: POST https://api.buatqris.site
 * Content-Type: application/x-www-form-urlencoded
 * Dibedakan lewat parameter "action": api_create_qris / api_check_status
 */

const BASE_URL = process.env.BUATQRIS_BASE_URL || 'https://api.buatqris.site';
const ACCOUNT_ID = process.env.BUATQRIS_ACCOUNT_ID;
const SECRET_TOKEN = process.env.BUATQRIS_SECRET_TOKEN;

function assertConfigured() {
  if (!ACCOUNT_ID || !SECRET_TOKEN) {
    throw new Error(
      'QRIS belum dikonfigurasi: isi BUATQRIS_ACCOUNT_ID & BUATQRIS_SECRET_TOKEN di Environment Variables.'
    );
  }
}

async function callApi(params: Record<string, string>) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.message || `BuatQris error (${res.status})`);
  }
  return data.data;
}

export interface CreateInvoiceResult {
  transactionId: string;
  qrUrl?: string;
  qrisImageBase64?: string;
  paymentUrl?: string;
  amount: number;
  totalAmount: number;
  status: string;
}

export async function createInvoice(amount: number, description: string): Promise<CreateInvoiceResult> {
  assertConfigured();
  const data = await callApi({
    action: 'api_create_qris',
    account_id: ACCOUNT_ID!,
    secret_token: SECRET_TOKEN!,
    amount: String(amount),
    description,
  });

  return {
    transactionId: data.transaction_id,
    qrUrl: data.qr_url,
    qrisImageBase64: data.qris_image,
    paymentUrl: data.payment_url,
    amount: data.amount,
    totalAmount: data.total_amount,
    status: data.status,
  };
}

export async function checkInvoiceStatus(transactionId: string): Promise<'pending' | 'paid' | 'expired'> {
  assertConfigured();
  const data = await callApi({
    action: 'api_check_status',
    account_id: ACCOUNT_ID!,
    secret_token: SECRET_TOKEN!,
    transaction_id: transactionId,
  });

  const status = (data.status || '').toLowerCase();
  if (status === 'success') return 'paid';
  if (status === 'expired' || status === 'failed') return 'expired';
  return 'pending';
}
