'use client';

import { useState } from 'react';
import { downloadTextFile } from '@/lib/downloadFile';

export default function CodeBlock({
  lang,
  filename,
  code,
}: {
  lang: string;
  filename: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // abaikan kalau clipboard API tidak tersedia
    }
  }

  return (
    <div className="code-block">
      <div className="code-lang">
        <span>{filename}</span>
        <div className="code-actions">
          <button onClick={handleCopy} title="Salin kode">
            {copied ? '✓ Tersalin' : '📋 Salin'}
          </button>
          <button onClick={() => downloadTextFile(filename, code)} title="Download file ini">
            ⬇️ Download
          </button>
        </div>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
