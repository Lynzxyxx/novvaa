'use client';

import { useEffect, useState } from 'react';

interface Category {
  tier: 1 | 2 | 3;
  name: string;
  paid: boolean;
  price: number;
  tokenLimit: number;
}

interface Me {
  loggedIn: boolean;
  tier: 1 | 2 | 3;
  email?: string;
  categoryName?: string;
  tokenLimit?: number;
  tokenUsed?: number;
  tokenRemaining?: number;
}

function formatRupiah(n: number) {
  return `Rp${n.toLocaleString('id-ID')}`;
}
function formatToken(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} juta token`;
  return `${n.toLocaleString('id-ID')} token`;
}

type View = 'list' | 'pay' | 'register' | 'login';

export default function SubscriptionPanel({ onClose }: { onClose: () => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [view, setView] = useState<View>('list');
  const [selectedTier, setSelectedTier] = useState<2 | 3 | null>(null);
  const [order, setOrder] = useState<{ orderId: string; qrImageUrl?: string; qrString?: string; amount: number } | null>(null);
  const [orderStatus, setOrderStatus] = useState<'pending' | 'paid' | 'expired'>('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [checkingLimit, setCheckingLimit] = useState(false);

  async function loadAll() {
    const [catRes, meRes] = await Promise.all([fetch('/api/categories'), fetch('/api/me')]);
    const catData = await catRes.json();
    const meData = await meRes.json();
    setCategories(catData.categories || []);
    setMe(meData);
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (view !== 'pay' || !order || orderStatus === 'paid') return;
    const t = setInterval(checkStatus, 4000);
    return () => clearInterval(t);
  }, [view, order, orderStatus]);

  async function startOrder(tier: 2 | 3) {
    setError('');
    setLoading(true);
    setSelectedTier(tier);
    try {
      const res = await fetch('/api/order/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal membuat pesanan QRIS.');
      } else {
        setOrder(data);
        setOrderStatus('pending');
        setView('pay');
      }
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  }

  async function checkStatus() {
    if (!order) return;
    try {
      const res = await fetch(`/api/order/status?orderId=${order.orderId}`);
      const data = await res.json();
      if (res.ok) {
        setOrderStatus(data.status);
        if (data.status === 'paid') setView('register');
      }
    } catch {
      // diamkan, coba lagi di polling berikutnya
    }
  }

  async function handleRegister() {
    if (!order) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.orderId, email: regEmail, password: regPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal membuat akun.');
      } else {
        await loadAll();
        setView('list');
        setOrder(null);
      }
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal login.');
      } else {
        await loadAll();
        setView('list');
      }
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    await loadAll();
  }

  async function handleCekLimit() {
    setCheckingLimit(true);
    setError('');
    try {
      const res = await fetch('/api/me/limit');
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Gagal cek limit.');
      else
        setMe((prev) =>
          prev ? { ...prev, tokenLimit: data.tokenLimit, tokenUsed: data.tokenUsed, tokenRemaining: data.tokenRemaining } : prev
        );
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setCheckingLimit(false);
    }
  }

  return (
    <div className="absolute bottom-14 left-2 right-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-sm z-30 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">💎 Langganan</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs">
          Tutup
        </button>
      </div>

      {error && <div className="text-xs text-red-500 mb-2">{error}</div>}

      {view === 'list' && me && (
        <>
          {me.loggedIn ? (
            <div className="mb-3 bg-gray-50 rounded-lg p-2.5">
              <p className="text-xs text-gray-500">Login sebagai</p>
              <p className="font-medium text-gray-800 truncate">{me.email}</p>
              <p className="text-xs text-gray-500 mt-1">{me.categoryName}</p>
              {typeof me.tokenRemaining === 'number' && (
                <p className="text-xs text-gray-600 mt-1">
                  Sisa: <b>{me.tokenRemaining.toLocaleString('id-ID')}</b> / {me.tokenLimit?.toLocaleString('id-ID')} token
                </p>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleCekLimit}
                  disabled={checkingLimit}
                  className="text-xs rounded-full border border-gray-300 px-3 py-1 hover:bg-gray-100"
                >
                  {checkingLimit ? 'Mengecek...' : 'Cek Limit'}
                </button>
                <button onClick={handleLogout} className="text-xs text-red-500 hover:underline px-1">
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-3 flex items-center justify-between bg-gray-50 rounded-lg p-2.5">
              <span className="text-xs text-gray-500">Kategori gratis aktif</span>
              <button onClick={() => setView('login')} className="text-xs text-accent-600 font-medium hover:underline">
                Sudah punya akun? Login
              </button>
            </div>
          )}

          <div className="space-y-2">
            {categories.map((c) => (
              <div key={c.tier} className="border border-gray-200 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800 text-[13px]">{c.name}</span>
                  {!c.paid ? (
                    <span className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Gratis</span>
                  ) : me?.loggedIn && me.tier === c.tier ? (
                    <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Aktif</span>
                  ) : (
                    <span className="text-[11px] font-semibold text-gray-700">{formatRupiah(c.price)}</span>
                  )}
                </div>
                {c.paid && (
                  <p className="text-xs text-gray-400 mt-1">Limit {formatToken(c.tokenLimit)}</p>
                )}
                {c.paid && !(me?.loggedIn && me.tier === c.tier) && (
                  <button
                    onClick={() => startOrder(c.tier as 2 | 3)}
                    disabled={loading}
                    className="mt-2 w-full text-xs bg-black text-white rounded-lg py-1.5 hover:bg-gray-800 disabled:opacity-50"
                  >
                    {loading && selectedTier === c.tier ? 'Membuat QRIS...' : 'Berlangganan'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {view === 'pay' && order && (
        <div>
          <p className="text-xs text-gray-500 mb-2">
            Scan QRIS di bawah untuk bayar <b>{formatRupiah(order.amount)}</b>.
          </p>
          {order.qrImageUrl ? (
            <img src={order.qrImageUrl} alt="QRIS" className="w-full rounded-lg border border-gray-200" />
          ) : order.qrString ? (
            <div className="text-[11px] break-all bg-gray-50 rounded-lg p-2 font-mono">{order.qrString}</div>
          ) : (
            <p className="text-xs text-gray-400">QR tidak tersedia dari provider.</p>
          )}

          <p className="text-xs text-center mt-2">
            Status:{' '}
            <span className={orderStatus === 'paid' ? 'text-green-600 font-medium' : 'text-amber-600'}>
              {orderStatus === 'paid' ? 'Sudah dibayar ✓' : 'Menunggu pembayaran...'}
            </span>
          </p>

          <div className="flex gap-2 mt-3">
            <button
              onClick={checkStatus}
              className="flex-1 text-xs rounded-lg border border-gray-300 py-2 hover:bg-gray-50"
            >
              Sudah bayar / Cek status
            </button>
            <button onClick={() => setView('list')} className="text-xs text-gray-400 px-2">
              Batal
            </button>
          </div>
        </div>
      )}

      {view === 'register' && (
        <div>
          <p className="text-xs text-green-600 mb-2">Pembayaran diterima ✓ Buat akun untuk mulai memakai kategori ini.</p>
          <input
            type="email"
            placeholder="Email"
            value={regEmail}
            onChange={(e) => setRegEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-2 outline-none focus:border-gray-500"
          />
          <input
            type="password"
            placeholder="Password (min. 6 karakter)"
            value={regPassword}
            onChange={(e) => setRegPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-2 outline-none focus:border-gray-500"
          />
          <button
            onClick={handleRegister}
            disabled={loading || !regEmail || regPassword.length < 6}
            className="w-full bg-black text-white rounded-lg py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Membuat akun...' : 'Buat Akun & Mulai Pakai'}
          </button>
        </div>
      )}

      {view === 'login' && (
        <div>
          <input
            type="email"
            placeholder="Email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-2 outline-none focus:border-gray-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-2 outline-none focus:border-gray-500"
          />
          <button
            onClick={handleLogin}
            disabled={loading || !loginEmail || !loginPassword}
            className="w-full bg-black text-white rounded-lg py-2 text-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Login...' : 'Login'}
          </button>
          <button onClick={() => setView('list')} className="w-full text-xs text-gray-400 mt-2">
            ← Kembali
          </button>
        </div>
      )}
    </div>
  );
}
