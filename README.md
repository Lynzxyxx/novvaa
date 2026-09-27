# Nova AI Chat (versi personal, tanpa login)

Website chat AI mirip ChatGPT, dibangun dengan Next.js 14 + Tailwind CSS. Dibuat sesederhana mungkin untuk **pemakaian pribadi**:

- **Tanpa login** — begitu dibuka, langsung bisa chat (anonim/otomatis).
- **Tanpa database & tanpa Firebase** — riwayat percakapan tersimpan di **cookie browser** kamu sendiri.
- **Tanpa limit** — tidak ada pembatasan jumlah pesan sama sekali.
- Mode **💬 Chat / Coding** — ngobrol biasa, tanya-jawab, atau minta bantuan menulis & memperbaiki kode program (hasil kode otomatis tampil dalam blok kode gelap seperti ChatGPT).
- Mode **🎨 Buat Gambar** — kirim deskripsi, AI akan generate gambar (butuh provider yang mendukung endpoint `/images/generations` — lihat catatan di bawah).
- **📎 Upload gambar untuk dianalisis** — lampirkan foto/screenshot, AI membaca & menjelaskan isinya (butuh provider yang mendukung vision — lihat catatan di bawah).
- **Auto-download kode jadi file/ZIP** — kalau AI menulis kode (satu file atau banyak file/project), setiap blok kode otomatis dapat tombol download, dan kalau lebih dari satu file, ada tombol "Download semua sebagai ZIP".
- API key **tidak ditulis di kode** — disimpan lewat Environment Variables, aman untuk deploy ke Vercel.

## 1. Jalankan di lokal

```bash
npm install
cp .env.example .env.local
# isi .env.local sesuai kebutuhan
npm run dev
```

Buka http://localhost:3000 — langsung masuk ke halaman chat, tidak ada halaman login.

## 2. Environment Variables

Isi ini di **Vercel → Project Settings → Environment Variables**:

| Variable | Wajib? | Keterangan |
|---|---|---|
| `CHAT_API_BASE_URL` | Ya | Base URL API AI kamu, contoh: `https://bandelbanget.xyz/v1` |
| `CHAT_API_KEY` | Ya | API key dari provider AI kamu |
| `CHAT_MODEL` | Ya | Nama model untuk chat/coding, contoh `qwen-plus` |
| `CHAT_IMAGE_MODEL` | Opsional | Nama model khusus untuk generate gambar, kalau providernya beda model. Kosongkan kalau tidak tahu / provider tidak mendukung fitur gambar |
| `CHAT_VISION_MODEL` | Opsional | Nama model khusus untuk menganalisis gambar yang diupload, kalau providernya butuh model vision terpisah (contoh: `qwen-vl-plus`). Kosongkan untuk pakai `CHAT_MODEL` yang sama |
| `ASSISTANT_NAME` | Opsional | Nama AI, default "Nova AI" |
| `CREATOR_ANSWER` | Opsional | Jawaban saat ditanya "siapa pembuatmu?" |
| `NAME_ANSWER` | Opsional | Jawaban saat ditanya "siapa namamu?" |

Karena tidak ada panel admin lagi (sesuai permintaan tanpa login), untuk mengganti nama AI / jawaban identitas, tinggal **edit value environment variable** di atas lalu redeploy — tidak perlu login ke mana-mana.

## 3. Deploy ke Vercel

1. Push folder ini ke repository GitHub kamu.
2. Buka https://vercel.com/new, import repo tersebut.
3. Isi semua Environment Variables di atas saat proses import.
4. Klik **Deploy**. Selesai — tidak perlu setting NEXTAUTH, Google OAuth, atau Firebase apa pun.

## 4. Install sebagai App di HP (PWA) & bikin APK asli

Project ini sudah dilengkapi **PWA** (Progressive Web App) — setelah di-deploy ke Vercel (harus HTTPS), buka websitenya lewat Chrome di Android, lalu:
- Buka menu ⋮ di Chrome → **"Add to Home Screen" / "Install app"**, atau
- Klik tombol **📲 Install App** di menu Pengaturan dalam aplikasi ini.

Setelah itu ikonnya muncul di layar HP dan kebuka seperti aplikasi biasa (tanpa address bar), lengkap dengan ikon "N" gradient yang sudah saya siapkan di `public/icons/`.

**Soal APK asli (.apk yang bisa di-download & di-install manual):**
Saya jujur soal ini — untuk bikin file `.apk` sungguhan (bukan cuma "Add to Home Screen"), dibutuhkan proses build dengan Android SDK/Gradle yang **tidak bisa saya jalankan di sini**. Tapi ini gampang kamu lakukan sendiri, gratis, tanpa install apa pun, karena project ini sudah PWA-ready:

1. Deploy dulu project ini ke Vercel (lihat langkah di atas), catat URL-nya, misal `https://nova-ai-kamu.vercel.app`.
2. Buka **https://www.pwabuilder.com** (situs resmi bikinan Microsoft, gratis).
3. Masukkan URL Vercel kamu, klik **Start**.
4. PWABuilder otomatis mendeteksi `manifest.json` & `sw.js` yang sudah ada di project ini, lalu kasih skor "Android package".
5. Klik **Package for Store** → pilih **Android** → download. Hasilnya file `.apk` (atau `.aab`) asli yang bisa langsung kamu install di HP (aktifkan dulu "Install dari sumber tidak dikenal" di pengaturan Android).

File APK dari PWABuilder itu pada dasarnya adalah "pembungkus" yang menjalankan website kamu secara native — jadi tetap butuh internet untuk memanggil AI API-nya, sama seperti versi webnya.

## 5. Soal fitur "Upload Gambar untuk Dianalisis"

Klik ikon 📎 di sebelah kolom chat (hanya muncul di mode Chat/Coding, maksimal 4MB per gambar) untuk melampirkan foto/screenshot. Saat dikirim, sistem memanggil AI dengan format pesan multimodal standar (`image_url` berisi gambar dalam bentuk base64) ke endpoint yang sama, `{CHAT_API_BASE_URL}/chat/completions`.

Ini **bergantung pada provider AI kamu** — model teks biasa belum tentu bisa "melihat" gambar. Kalau providernya menolak, akan muncul pesan error yang menyebutkan kemungkinan perlu diisi `CHAT_VISION_MODEL` dengan model vision khusus. Cek dokumentasi provider kamu untuk tahu nama model vision yang didukung.

**Catatan penting:** karena riwayat chat disimpan di cookie (kapasitasnya kecil, lihat bagian 6), gambar yang kamu upload **tidak ikut tersimpan permanen** — hanya dipakai sekali saat itu untuk dianalisis AI. Yang tersimpan di riwayat hanyalah teks jawabannya dan catatan kecil "📎 Gambar dilampirkan: nama-file.jpg".

## 6. Soal fitur "Download kode jadi file/ZIP otomatis"

Setiap kali AI menulis kode dalam jawabannya, blok kode itu otomatis dapat header berisi nama file + tombol **📋 Salin** dan **⬇️ Download**. Kalau dalam satu jawaban ada lebih dari satu blok kode (misalnya AI bikin beberapa file untuk satu project), otomatis muncul juga tombol **📦 Download semua sebagai ZIP**.

Cara kerjanya: system prompt sudah menginstruksikan AI supaya menulis penanda nama file (format `**FILE: nama.ext**`) tepat sebelum tiap blok kode saat diminta bikin project/banyak file/hasil dalam bentuk zip. Sistem lalu membaca penanda itu untuk memberi nama file yang tepat dan mengelompokkannya ke dalam satu ZIP.

Ini **best-effort** — tergantung seberapa patuh model AI kamu mengikuti format tersebut. Sebagai jaring pengaman, **setiap blok kode tetap dapat tombol download sendiri-sendiri** meskipun AI tidak memakai penanda nama file (nama file-nya ditebak otomatis dari bahasa pemrogramannya, misalnya `code-1.js`, `code-2.py`, dst).

## 7. Soal fitur "Buat Gambar"

Fitur ini memanggil endpoint `POST {CHAT_API_BASE_URL}/images/generations` (format standar ala OpenAI: `{ model, prompt, n, size }`, respon berisi `data[0].url` atau `data[0].b64_json`). Ini **bergantung pada provider AI kamu** — kalau provider di `CHAT_API_BASE_URL` tidak menyediakan endpoint ini, tombol "Buat Gambar" akan menampilkan pesan error yang jelas, bukan crash diam-diam. Cek dokumentasi provider kamu untuk tahu apakah fitur ini didukung dan model apa yang harus diisi di `CHAT_IMAGE_MODEL`.

## 8. Soal penyimpanan riwayat chat (cookie) — baca ini

Semua riwayat percakapan disimpan di **cookie browser**, bukan di server. Konsekuensinya:
- Riwayat **hanya ada di browser/perangkat itu saja** — buka dari HP lain, riwayatnya kosong.
- Clear cookies / mode incognito = riwayat hilang.
- Cookie browser punya batas ukuran (sekitar 4KB). Aplikasi ini otomatis **membuang percakapan paling lama** kalau ukurannya sudah mepet batas, dan akan menampilkan pemberitahuan kuning di layar saat itu terjadi. Ini konsekuensi dari memilih cookie sebagai tempat penyimpanan (sesuai permintaan) — kalau ke depannya kamu butuh riwayat yang jauh lebih panjang/permanen, opsinya adalah pindah ke `localStorage` (kapasitas jauh lebih besar, tapi tetap hanya di browser itu) atau ke database asli.
- Tidak ada isu privasi lintas-user karena memang tidak ada sistem akun sama sekali — semua orang yang buka website ini punya riwayat masing-masing tersimpan di cookie browser mereka sendiri.

## 9. Struktur folder

```
app/
  page.tsx        -> halaman chat utama (langsung tampil, tanpa login)
  api/
    chat/route.ts   -> teruskan pesan (+ gambar opsional) ke AI API (mode Chat/Coding)
    image/route.ts  -> teruskan prompt ke AI API (mode Buat Gambar)
  sw-register.tsx -> daftarkan service worker (untuk PWA)
components/
  MessageContent.tsx -> render teks + blok kode dari satu pesan, + tombol ZIP
  CodeBlock.tsx       -> satu blok kode dengan tombol salin & download
lib/
  cookies.ts         -> helper baca/tulis cookie
  markdown.ts        -> render markdown ringan (teks, bukan blok kode)
  parseMessage.ts    -> pisahkan teks & blok kode dari jawaban AI
  downloadFile.ts     -> helper download 1 file / ZIP di browser
  types.ts           -> tipe data
  useInstallPrompt.ts -> hook tombol "Install App"
public/
  manifest.json -> konfigurasi PWA (nama, ikon, warna)
  sw.js         -> service worker (syarat wajib supaya PWA bisa di-install)
  icons/        -> ikon aplikasi (192px, 512px, apple-touch-icon)
```
