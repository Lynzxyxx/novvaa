'use client';

import { parseMessage } from '@/lib/parseMessage';
import { renderMarkdown } from '@/lib/markdown';
import { downloadAsZip } from '@/lib/downloadFile';
import CodeBlock from './CodeBlock';

export default function MessageContent({ content }: { content: string }) {
  const segments = parseMessage(content);
  const codeSegments = segments.filter((s) => s.type === 'code') as Extract<
    ReturnType<typeof parseMessage>[number],
    { type: 'code' }
  >[];

  return (
    <div>
      {segments.map((seg, i) =>
        seg.type === 'text' ? (
          seg.content.trim() ? (
            <div key={i} dangerouslySetInnerHTML={{ __html: renderMarkdown(seg.content) }} />
          ) : null
        ) : (
          <CodeBlock key={i} lang={seg.lang} filename={seg.filename} code={seg.code} />
        )
      )}

      {codeSegments.length > 1 && (
        <button
          onClick={() => downloadAsZip(codeSegments, 'project')}
          className="mt-2 inline-flex items-center gap-2 text-xs font-medium rounded-full border border-gray-300 px-3 py-1.5 hover:bg-gray-100"
        >
          📦 Download semua sebagai ZIP ({codeSegments.length} file)
        </button>
      )}
    </div>
  );
}
