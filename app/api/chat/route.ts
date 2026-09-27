import { NextResponse } from 'next/server';
import { ChatMessage } from '@/lib/types';

export async function POST(req: Request) {
  const { messages, image } = (await req.json()) as { messages: ChatMessage[]; image?: string };
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Pesan tidak valid.' }, { status: 400 });
  }

  const apiKey = process.env.CHAT_API_KEY;
  const baseUrl = process.env.CHAT_API_BASE_URL;
  const textModel = process.env.CHAT_MODEL || 'qwen-plus';
  const visionModel = process.env.CHAT_VISION_MODEL || textModel;

  if (!apiKey || !baseUrl) {
    return NextResponse.json(
      { error: 'Server belum dikonfigurasi: isi CHAT_API_KEY & CHAT_API_BASE_URL di Environment Variables.' },
      { status: 500 }
    );
  }

  const assistantName = process.env.ASSISTANT_NAME || 'Nova AI';
  const creatorAnswer =
    process.env.CREATOR_ANSWER ||
    'Aku dikembangkan dan dirancang oleh seseorang bernama Gilang Ramadhan 👨‍💻🚀 Gilang Ramadhan adalah orang yang berada di balik proses pembuatan, pengembangan, dan penyempurnaan sistemku. 🧠⚙️ Mulai dari konsep, desain, hingga berbagai fitur yang membuatku dapat berinteraksi dan membantu pengguna, semuanya merupakan bagian dari proses pengembangan yang dilakukan oleh Gilang Ramadhan. 💻🔥 Jadi, kalau kamu bertanya siapa pembuatku, jawabannya adalah Gilang Ramadhan. 👨‍💻✨ Beliau adalah developer dan creator yang mengembangkan sistemku agar aku dapat menjadi asisten virtual yang bisa membantu, menjawab pertanyaan, dan berinteraksi dengan pengguna. 🤖💬 Senang bisa diperkenalkan sebagai karya dari Gilang Ramadhan! 🚀😊';
  const nameAnswer =
    process.env.NAME_ANSWER || `Nama saya ${assistantName}, siap membantu kamu.`;

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';

  // Jawaban identitas langsung dari env, konsisten tanpa perlu panggil AI
  // (dilewati kalau ada gambar terlampir, karena fokusnya menganalisis gambar)
  if (!image) {
    if (
      /siapa.*(pembuat|pencipta|developer|yang buat|yang membuat)/i.test(lastUserMessage) ||
      /who\s*(made|created|built)\s*you/i.test(lastUserMessage)
    ) {
      return NextResponse.json({ reply: creatorAnswer });
    }
    if (
      /siapa\s*(nama\s*)?(kamu|anda|mu)/i.test(lastUserMessage) ||
      /what.?s?\s*your\s*name/i.test(lastUserMessage) ||
      /who\s*are\s*you/i.test(lastUserMessage)
    ) {
      return NextResponse.json({ reply: nameAnswer });
    }
  }

  const systemPrompt = `Kamu adalah ${assistantName}, asisten AI serba bisa: bisa mengobrol santai, menjawab pertanyaan, membantu menulis, MENULIS DAN MEMPERBAIKI KODE PROGRAM, menganalisis gambar yang diunggah pengguna, dan tugas lainnya. Jawab dengan jelas dan terstruktur.

ATURAN PENULISAN KODE (WAJIB DIIKUTI):
- Semua kode program ditulis dalam blok kode markdown \`\`\`bahasa ... \`\`\`.
- Kalau pengguna minta project/kode dengan LEBIH DARI SATU FILE, atau minta hasil dalam bentuk "zip"/"file lengkap"/"download", tulis SETIAP file dengan format PERSIS seperti ini (penanda nama file wajib ada tepat sebelum blok kode):
**FILE: nama-file-atau-path.ext**
\`\`\`bahasa
...isi kode...
\`\`\`
- Ulangi pola itu untuk setiap file. Sistem akan otomatis membuatkan tombol download untuk tiap file dan tombol "download semua sebagai ZIP" kalau filenya lebih dari satu. Jangan gabungkan banyak file jadi satu blok kode.
- Kalau cuma satu file/snippet kecil, penanda **FILE: ...** boleh dipakai atau tidak, sistem tetap otomatis kasih tombol download.

Jika ditanya siapa pembuatmu, jawab: "${creatorAnswer}". Jika ditanya siapa namamu, jawab: "${nameAnswer}".`;

  const historyMessages = messages.map(({ role, content }) => ({ role, content }));

  // Kalau ada gambar terlampir, ubah pesan user TERAKHIR jadi format multimodal
  // (format umum ala OpenAI: content berisi array text + image_url).
  if (image && historyMessages.length > 0) {
    const lastIdx = historyMessages.length - 1;
    const lastMsg = historyMessages[lastIdx];
    if (lastMsg.role === 'user') {
      (historyMessages as any)[lastIdx] = {
        role: 'user',
        content: [
          { type: 'text', text: lastMsg.content || 'Tolong analisis gambar ini.' },
          { type: 'image_url', image_url: { url: image } },
        ],
      };
    }
  }

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: image ? visionModel : textModel,
        messages: [{ role: 'system', content: systemPrompt }, ...historyMessages],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      const hint = image
        ? ' Kemungkinan model/provider yang dipakai tidak mendukung analisis gambar (vision) — cek apakah perlu isi CHAT_VISION_MODEL dengan model khusus vision dari provider kamu.'
        : '';
      return NextResponse.json(
        { error: `AI API error (${res.status}): ${errText.slice(0, 300)}${hint}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const reply =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      'Maaf, tidak ada respon dari AI.';

    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json(
      { error: `Gagal menghubungi AI API: ${e?.message || 'unknown error'}` },
      { status: 502 }
    );
  }
}
