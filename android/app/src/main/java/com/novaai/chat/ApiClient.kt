package com.novaai.chat

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

object ApiClient {

    // Kirim teks hasil OCR ke backend Vercel yang sama persis dipakai web
    // app (endpoint /api/chat). Minta jawaban singkat karena ditampilkan
    // di panel kecil gelembung, bukan karena disembunyikan dari siapa pun.
    suspend fun askNova(ocrText: String): String = withContext(Dispatchers.IO) {
        val url = URL("${BuildConfig.API_BASE_URL}/api/chat")
        val conn = url.openConnection() as HttpURLConnection
        try {
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.doOutput = true
            conn.connectTimeout = 15000
            conn.readTimeout = 30000

            val prompt = """
                Teks berikut diambil dari hasil scan layar HP pengguna:
                ---
                $ocrText
                ---
                Kalau teks ini bahasa asing, terjemahkan ke Bahasa Indonesia.
                Kalau ini sebuah pertanyaan/soal, jawab singkat (1-3 kalimat saja,
                tanpa penjelasan panjang) karena akan ditampilkan di panel kecil.
                Kalau teksnya tidak jelas/kosong, bilang begitu secara singkat.
            """.trimIndent()

            val messages = JSONArray().put(
                JSONObject().put("role", "user").put("content", prompt)
            )
            val body = JSONObject().put("messages", messages)

            conn.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }

            val code = conn.responseCode
            val stream = if (code in 200..299) conn.inputStream else conn.errorStream
            val text = stream.bufferedReader().use { it.readText() }
            val json = JSONObject(text)

            if (code in 200..299) {
                json.optString("reply", "Tidak ada jawaban dari AI.")
            } else {
                "Gagal: ${json.optString("error", "terjadi kesalahan ($code)")}"
            }
        } catch (e: Exception) {
            "Gagal terhubung ke server: ${e.message}"
        } finally {
            conn.disconnect()
        }
    }
}
