'use client';

import { useState, useRef, useEffect } from 'react';
import { getCookie, setCookie } from '@/lib/cookies';
import { ChatMessage, ChatMode, Conversation } from '@/lib/types';
import { useInstallPrompt } from '@/lib/useInstallPrompt';
import MessageContent from '@/components/MessageContent';
import SubscriptionPanel from '@/components/SubscriptionPanel';

const COOKIE_KEY = 'nova_conversations';
const COOKIE_MAX_BYTES = 3500; // aman di bawah batas ~4KB browser

function newConversation(mode: ChatMode = 'chat'): Conversation {
  return { id: crypto.randomUUID(), title: mode === 'image' ? 'Obrolan gambar baru' : 'Obrolan baru', messages: [] };
}

function loadConversations(): Conversation[] {
  const raw = getCookie(COOKIE_KEY);
  if (!raw) return [newConversation()];
  try {
    const parsed = JSON.parse(raw) as Conversation[];
    return parsed.length ? parsed : [newConversation()];
  } catch {
    return [newConversation()];
  }
}

function persistConversations(list: Conversation[]): { saved: Conversation[]; trimmed: boolean } {
  let working = [...list];
  let trimmed = false;
  while (working.length > 1 && encodeURIComponent(JSON.stringify(working)).length > COOKIE_MAX_BYTES) {
    working = working.slice(0, -1);
    trimmed = true;
  }
  setCookie(COOKIE_KEY, JSON.stringify(working));
  return { saved: working, trimmed };
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PaperclipIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}
function DownloadAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M12 8v6M9 11l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 19h2" strokeLinecap="round" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" strokeLinecap="round" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ImageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('chat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [ready, setReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showInstallInfo, setShowInstallInfo] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ dataUrl: string; name: string } | null>(null);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { canInstall, installed, isIOS, promptInstall } = useInstallPrompt();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loaded = loadConversations();
    setConversations(loaded);
    setActiveId(loaded[0].id);
    setReady(true);
    if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const active = conversations.find((c) => c.id === activeId) || conversations[0];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [active?.messages.length, loading]);

  function commit(updated: Conversation[]) {
    const { saved, trimmed } = persistConversations(updated);
    setConversations(saved);
    if (trimmed) {
      setNotice('Beberapa percakapan lama dihapus otomatis karena batas ukuran cookie tercapai.');
      setTimeout(() => setNotice(''), 4000);
    }
    if (!saved.find((c) => c.id === activeId)) setActiveId(saved[0].id);
  }

  function updateActive(messages: ChatMessage[], title?: string) {
    const updated = conversations.map((c) =>
      c.id === active.id ? { ...c, messages, title: title ?? c.title } : c
    );
    commit(updated);
  }

  async function handlePickImage(file: File | undefined) {
    setImageError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('File yang dipilih bukan gambar.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setImageError('Ukuran gambar maksimal 4MB.');
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setAttachedImage({ dataUrl, name: file.name });
  }

  async function handleSend() {
    if ((!input.trim() && !attachedImage) || loading || !active) return;
    setError('');
    const promptText = input.trim();
    const pendingImage = attachedImage;

    // Gambar TIDAK ikut disimpan ke cookie (supaya tidak melebihi batas
    // ukuran cookie) -- hanya ditandai teksnya saja di riwayat.
    const storedContent = pendingImage
      ? `${promptText || '(Tolong analisis gambar ini)'}\n\n📎 Gambar dilampirkan: ${pendingImage.name}`
      : promptText;

    const userMsg: ChatMessage = { role: 'user', content: storedContent, mode };
    const newMessages = [...active.messages, userMsg];
    const title = active.messages.length === 0 ? (promptText || 'Analisis gambar').slice(0, 30) : undefined;
    updateActive(newMessages, title);
    setInput('');
    setAttachedImage(null);
    setLoading(true);

    try {
      if (mode === 'image') {
        const res = await fetch('/api/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: promptText }),
        });
        const data = await res.json();
        if (!res.ok) setError(data.error || 'Gagal membuat gambar.');
        else updateActive([...newMessages, { role: 'assistant', content: data.imageUrl, mode: 'image' }]);
      } else {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              ...newMessages.filter((m) => m.mode !== 'image').slice(0, -1).map(({ role, content }) => ({ role, content })),
              { role: 'user', content: promptText || '(Tolong analisis gambar ini)' },
            ],
            image: pendingImage?.dataUrl,
          }),
        });
        const data = await res.json();
        if (!res.ok) setError(data.error || 'Terjadi kesalahan.');
        else updateActive([...newMessages, { role: 'assistant', content: data.reply, mode: 'chat' }]);
      }
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  }

  function handleNewChat(startMode: ChatMode = 'chat') {
    const c = newConversation(startMode);
    commit([c, ...conversations]);
    setActiveId(c.id);
    setMode(startMode);
    setShowPlusMenu(false);
    if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false);
  }

  function handleDelete(id: string) {
    const updated = conversations.filter((c) => c.id !== id);
    commit(updated.length ? updated : [newConversation()]);
  }

  function handleClearAll() {
    const fresh = [newConversation()];
    commit(fresh);
    setActiveId(fresh[0].id);
    setShowSettings(false);
  }

  const visibleConversations = searchTerm.trim()
    ? conversations.filter((c) => c.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : conversations;

  if (!ready || !active) {
    return <div className="min-h-screen flex items-center justify-center bg-white text-gray-400">Memuat...</div>;
  }

  return (
    <div className="flex h-screen bg-white text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? 'w-72' : 'w-0'} shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden transition-all duration-200`}
      >
        <div className="p-3 flex items-center gap-1">
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-200 text-gray-600" title="Tutup sidebar">
            <MenuIcon />
          </button>
          <button
            onClick={() => setShowSearch((s) => !s)}
            className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 ml-auto"
            title="Cari percakapan"
          >
            <SearchIcon />
          </button>
        </div>

        {showSearch && (
          <div className="px-3 pb-2">
            <input
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari percakapan..."
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-gray-500"
            />
          </div>
        )}

        <div className="px-2 space-y-0.5">
          <button
            onClick={() => handleNewChat('chat')}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-gray-200 transition text-left"
          >
            <EditIcon /> Obrolan baru
          </button>
          <button
            onClick={() => handleNewChat('image')}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-gray-200 transition text-left"
          >
            <ImageIcon /> Gambar
          </button>

          <div className="relative">
            <button
              onClick={() => (canInstall ? promptInstall() : setShowInstallInfo((s) => !s))}
              disabled={installed}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition text-left ${
                installed ? 'text-green-600 cursor-default' : 'hover:bg-gray-200'
              }`}
            >
              <DownloadAppIcon /> {installed ? 'Aplikasi Terpasang ✓' : 'Download Aplikasi'}
            </button>

            {showInstallInfo && !installed && !canInstall && (
              <div className="absolute top-11 left-2 right-2 bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs text-gray-600 z-20">
                {isIOS ? (
                  <p>
                    Di iPhone/iPad: buka menu <b>Share</b> (ikon kotak panah ke atas) di Safari, lalu pilih{' '}
                    <b>"Add to Home Screen"</b>.
                  </p>
                ) : (
                  <p>
                    Buka menu (⋮) di browser kamu, lalu pilih <b>"Install app"</b> atau{' '}
                    <b>"Add to Home Screen"</b>. Kalau opsi itu tidak muncul, coba buka website ini lewat
                    Chrome.
                  </p>
                )}
                <button
                  onClick={() => setShowInstallInfo(false)}
                  className="mt-2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 mt-3 space-y-0.5">
          {visibleConversations.length > 0 && (
            <p className="px-3 pb-1 text-xs font-medium text-gray-400">Riwayat</p>
          )}
          {visibleConversations.map((c) => (
            <div
              key={c.id}
              className={`group flex items-center rounded-lg text-sm transition ${
                c.id === active.id ? 'bg-gray-200' : 'hover:bg-gray-200/70'
              }`}
            >
              <button
                onClick={() => {
                  setActiveId(c.id);
                  if (c.messages[0]?.mode === 'image') setMode('image');
                  else setMode('chat');
                }}
                className="flex-1 text-left truncate px-3 py-2.5"
              >
                {c.title}
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                className="hidden group-hover:block pr-3 text-gray-400 hover:text-red-500"
                title="Hapus percakapan"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="p-2 border-t border-gray-200 relative">
          <button
            onClick={() => {
              setShowSubscription((s) => !s);
              setShowSettings(false);
            }}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-gray-200 transition text-left"
          >
            💎 Langganan
          </button>
          {showSubscription && <SubscriptionPanel onClose={() => setShowSubscription(false)} />}

          <button
            onClick={() => {
              setShowSettings((s) => !s);
              setShowSubscription(false);
            }}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-gray-200 transition text-left"
          >
            <SettingsIcon /> Pengaturan
          </button>

          {showSettings && (
            <div className="absolute bottom-14 left-2 right-2 bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
              <p className="text-gray-500 text-xs mb-3">
                Aplikasi personal — tidak ada akun/login. Riwayat chat tersimpan di cookie browser ini saja.
              </p>

              <button
                onClick={handleClearAll}
                className="w-full text-left text-red-500 hover:bg-red-50 rounded-lg px-2 py-1.5"
              >
                Hapus semua riwayat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 flex items-center px-3 gap-2 border-b border-gray-100">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
              <MenuIcon />
            </button>
          )}
          <div className="flex items-center gap-1 text-[17px] font-semibold text-gray-800">
            Nova AI
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 mt-0.5">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {active.messages.length === 0 && (
              <div className="text-center mt-[18vh]">
                <h2 className="text-[28px] font-semibold text-gray-800">
                  {mode === 'image' ? 'Gambar apa yang ingin dibuat?' : 'Apa yang sedang Anda pikirkan hari ini?'}
                </h2>
              </div>
            )}

            {active.messages.map((m, i) => (
              <div key={i} className={`flex mb-6 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'user' ? (
                  <div className="max-w-[85%] rounded-3xl bg-gray-100 px-4 py-2.5 prose-chat">
                    {m.mode === 'image' ? <span>{m.content}</span> : <MessageContent content={m.content} />}
                  </div>
                ) : (
                  <div className="max-w-[92%] prose-chat text-gray-800 leading-relaxed">
                    {m.mode === 'image' ? (
                      <img src={m.content} alt="Gambar hasil AI" className="rounded-2xl max-w-full border border-gray-200" />
                    ) : (
                      <MessageContent content={m.content} />
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start mb-6">
                <div className="flex gap-1 py-2">
                  <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}

            {error && <div className="text-center text-sm text-red-500 mb-4">{error}</div>}
            {notice && <div className="text-center text-xs text-amber-600 mb-4">{notice}</div>}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="px-4 pb-5">
          <div className="max-w-3xl mx-auto">
            {imageError && <div className="text-xs text-red-500 mb-1.5 px-1">{imageError}</div>}

            {attachedImage && (
              <div className="flex items-center gap-2 mb-2 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 w-fit">
                <img src={attachedImage.dataUrl} alt="preview" className="h-10 w-10 object-cover rounded-lg" />
                <span className="text-xs text-gray-600 max-w-[140px] truncate">{attachedImage.name}</span>
                <button
                  onClick={() => setAttachedImage(null)}
                  className="text-gray-400 hover:text-red-500 h-5 w-5 flex items-center justify-center"
                  title="Hapus lampiran"
                >
                  <XIcon />
                </button>
              </div>
            )}

            <div className="relative flex items-end gap-2 rounded-[28px] border border-gray-300 shadow-sm bg-white px-3 py-2">
              <div className="relative">
                <button
                  onClick={() => setShowPlusMenu((s) => !s)}
                  className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600"
                  title="Mode"
                >
                  <PlusIcon />
                </button>
                {showPlusMenu && (
                  <div className="absolute bottom-12 left-0 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-48 text-sm z-10">
                    <button
                      onClick={() => {
                        setMode('chat');
                        setShowPlusMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 ${mode === 'chat' ? 'text-black font-medium' : 'text-gray-600'}`}
                    >
                      💬 Chat / Coding
                    </button>
                    <button
                      onClick={() => {
                        setMode('image');
                        setShowPlusMenu(false);
                        setAttachedImage(null);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 ${mode === 'image' ? 'text-black font-medium' : 'text-gray-600'}`}
                    >
                      🎨 Buat Gambar
                    </button>
                  </div>
                )}
              </div>

              {mode === 'chat' && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      handlePickImage(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 shrink-0"
                    title="Upload gambar untuk dianalisis"
                  >
                    <PaperclipIcon />
                  </button>
                </>
              )}

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder={
                  mode === 'image'
                    ? 'Deskripsikan gambar yang mau dibuat...'
                    : attachedImage
                    ? 'Tanyakan sesuatu tentang gambar ini (opsional)...'
                    : 'Tanyakan apa saja'
                }
                className="flex-1 resize-none bg-transparent outline-none text-[15px] py-2 max-h-40 placeholder:text-gray-400"
              />

              <button
                onClick={handleSend}
                disabled={loading || (!input.trim() && !attachedImage)}
                className={`h-9 w-9 flex items-center justify-center rounded-full transition shrink-0 ${
                  input.trim() || attachedImage ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-300'
                }`}
              >
                <SendIcon />
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
              Nova AI bisa saja membuat kesalahan. Periksa kembali informasi penting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
