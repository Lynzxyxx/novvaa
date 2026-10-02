# Nova AI - Android (Gelembung Chat)

Ini project **Android native terpisah** (Kotlin), bukan bagian dari PWA/Next.js
di folder utama. Isinya: app sederhana (WebView ke web app Nova AI di Vercel)
+ fitur gelembung mengambang yang bisa scan layar.

## Kenapa ini project terpisah?

Fitur gelembung-di-atas-aplikasi-lain + scan layar **tidak bisa** dibuat
sebagai PWA (website dibungkus APK) -- itu butuh izin sistem Android
(`SYSTEM_ALERT_WINDOW`, `MediaProjection`) yang hanya bisa diminta oleh
aplikasi native. Backend-nya (API chat, Environment Variables di Vercel)
tetap sama persis dengan project Next.js di folder utama -- app Android ini
cuma memanggil API itu lewat internet, tidak menduplikasi logic apa pun.

## Cara kerja fitur gelembung (ringkas)

1. Buka app -> tombol **"Aktifkan Gelembung Chat"** -> Android minta izin
   "Tampil di atas aplikasi lain" (sekali saja, lewat Settings sistem).
2. Gelembung bulat muncul, bisa diseret ke mana saja, posisinya diingat.
3. Tap gelembung -> muncul 2 tombol: **Scan Layar** dan **Tutup**.
4. **Tutup** = gelembung hilang total & service berhenti (bukan cuma
   disembunyikan -- sesuai yang kamu minta, fitur "samarkan" sudah dihapus).
5. **Scan Layar** -> Android menampilkan dialog izin screen-capture bawaan
   sistem (wajib muncul tiap sesi, tidak bisa dilewati/disembunyikan -- ini
   aturan Android sendiri, bukan pilihan kode ini). Begitu diizinkan, SATU
   screenshot otomatis diambil saat itu juga, tanpa langkah manual lain.
6. Selama proses (screenshot -> OCR -> tanya ke AI), gelembung menampilkan
   cincin loading berputar.
7. Hasilnya muncul lewat badge kecil ✉️ di pojok gelembung. Tap badge itu
   untuk membaca jawaban ringkas (diterjemahkan kalau teksnya bahasa asing,
   atau dijelaskan singkat kalau bukan).

## Yang WAJIB diubah sebelum build

Buka `app/build.gradle.kts`, cari baris ini di `defaultConfig`:

```kotlin
buildConfigField("String", "WEB_APP_URL", "\"https://nova-ai-kamu.vercel.app\"")
buildConfigField("String", "API_BASE_URL", "\"https://nova-ai-kamu.vercel.app\"")
```

Ganti `https://nova-ai-kamu.vercel.app` dengan domain Vercel kamu yang
sebenarnya (dua-duanya domain yang sama, tidak perlu beda). Setelah ini
diganti dan di-build ulang, APK-nya otomatis tersambung ke backend itu --
kalau kamu ubah Environment Variables di Vercel (ganti API key AI, dll),
APK yang sudah ter-install **otomatis ikut berubah** juga tanpa perlu
build ulang, karena semua logic AI memang jalan di server Vercel, APK ini
cuma mengirim teks hasil scan ke sana.

## Cara build

Project ini **belum saya compile jadi .apk** -- environment saya tidak
punya Android SDK/Gradle. Begini cara kamu build sendiri (gratis, sekali
install):

1. Install **Android Studio** (https://developer.android.com/studio).
2. Buka Android Studio -> **Open** -> pilih folder `android/` ini.
3. Android Studio otomatis mengunduh Gradle wrapper, SDK yang dibutuhkan,
   dan dependency (ML Kit, dll) saat pertama kali membuka project --
   tunggu sampai proses "Gradle Sync" selesai (perlu internet).
4. Edit `WEB_APP_URL` / `API_BASE_URL` seperti di atas.
5. Klik **Run ▶** (ke HP/emulator lewat USB debugging) untuk tes, atau
   **Build -> Generate Signed Bundle / APK** untuk hasil `.apk` yang bisa
   dibagikan/di-install manual.

## Batasan & hal yang perlu kamu tahu

- **Belum pernah dikompilasi** oleh saya -- ada kemungkinan kecil perlu
  perbaikan minor (versi dependency, dsb) saat build pertama kali di
  Android Studio kamu. Kalau ada error build, kirim pesan errornya ke saya,
  saya bantu perbaiki.
- **Scan Layar cuma menangkap SATU momen** (screenshot sekali saat tombol
  ditekan), bukan merekam terus-menerus -- sesuai desain yang kamu minta
  (tombol scan, bukan otomatis real-time tanpa henti). Ini juga membuat
  notifikasi "sedang merekam layar" dari Android hanya muncul sebentar,
  bukan terus-menerus menyala.
- **OCR (ML Kit)** jalan di HP langsung (gratis, tanpa API key, model
  bahasa Latin bawaan). Kalau nanti butuh baca bahasa dengan aksara lain
  (Mandarin, Jepang, Korea, dll), perlu ganti ke model ML Kit yang sesuai
  di `BubbleService.kt`.
- Minimum Android **8.0 (API 26)** ke atas.
- Izin yang diminta ke pengguna: "Tampil di atas aplikasi lain" (sekali),
  notifikasi (sekali), dan izin screen-capture (setiap sesi scan, ini
  perilaku wajib Android, bukan bisa diatur app).
