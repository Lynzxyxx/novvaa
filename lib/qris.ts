/**
 * Adapter pembayaran QRIS via api.buatqris.site.
 *
 * PENTING -- BACA INI: saya tidak berhasil mengakses dokumentasi resmi
 * api.buatqris.site (percobaan fetch mengembalikan error), jadi bentuk
 * request/response di bawah ini adalah desain umum ala provider QRIS
 * kebanyakan (base URL + account id + secret token, endpoint create-invoice
 * & check-status). KEMUNGKINAN BESAR path endpoint atau nama field-nya
 * perlu disesuaikan dengan dokumentasi asli dari api.buatqris.site.
 * Semua hal yang mungkin perlu diubah ada di SATU file ini saja supaya
 * gampang disesuaikan -- kalau kamu punya dokumentasinya, kirim ke saya
 * dan saya sesuaikan persis.
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

export interface CreateInvoiceResult {
  referenceId: string;
  qrString?: string;
  qrImageUrl?: string;
  raw: any;
}

export async function createInvoice(amount: number, referenceId: string): Promise<CreateInvoiceResult> {
  assertConfigured();
  const res = await fetch(`${BASE_URL.replace(/\/$/, '')}/create-invoice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SECRET_TOKEN}`,
    },
    body: JSON.stringify({
      account_id: ACCOUNT_ID,
      amount,
      reference_id: referenceId,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Gagal membuat QRIS (${res.status}): ${JSON.stringify(data).slice(0, 300)}`);
  }

  return {
    referenceId,
    qrString: data.qr_string || data.qrString || data.data?.qr_string,
    qrImageUrl: data.qr_image_url || data.qrImageUrl || data.data?.qr_image_url,
    raw: data,
  };
}

export async function checkInvoiceStatus(referenceId: string): Promise<'pending' | 'paid' | 'expired'> {
  assertConfigured();
  const res = await fetch(
    `${BASE_URL.replace(/\/$/, '')}/check-status?account_id=${encodeURIComponent(ACCOUNT_ID!)}&reference_id=${encodeURIComponent(referenceId)}`,
    { headers: { Authorization: `Bearer ${SECRET_TOKEN}` }, cache: 'no-store' }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Gagal cek status QRIS (${res.status}): ${JSON.stringify(data).slice(0, 300)}`);
  }
  const status = (data.status || data.data?.status || '').toLowerCase();
  if (['paid', 'success', 'settlement', 'sukses'].includes(status)) return 'paid';
  if (['expired', 'expire', 'kadaluarsa'].includes(status)) return 'expired';
  return 'pending';
}
