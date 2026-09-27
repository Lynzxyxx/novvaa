export interface TextSegment {
  type: 'text';
  content: string;
}
export interface CodeSegment {
  type: 'code';
  lang: string;
  filename: string;
  code: string;
}
export type MessageSegment = TextSegment | CodeSegment;

const EXT_MAP: Record<string, string> = {
  javascript: 'js', js: 'js', typescript: 'ts', ts: 'ts', jsx: 'jsx', tsx: 'tsx',
  python: 'py', py: 'py', html: 'html', css: 'css', scss: 'scss', json: 'json',
  java: 'java', c: 'c', cpp: 'cpp', 'c++': 'cpp', csharp: 'cs', 'c#': 'cs',
  go: 'go', golang: 'go', php: 'php', sql: 'sql', bash: 'sh', sh: 'sh',
  shell: 'sh', yaml: 'yml', yml: 'yml', markdown: 'md', md: 'md',
  text: 'txt', plaintext: 'txt', xml: 'xml', ruby: 'rb', rust: 'rs',
  kotlin: 'kt', swift: 'swift', dart: 'dart', dockerfile: 'Dockerfile',
};

function guessExt(lang: string) {
  const l = (lang || '').toLowerCase().trim();
  return EXT_MAP[l] || (l ? l : 'txt');
}

// Kalau AI menulis penanda **FILE: nama.ext** tepat sebelum blok kode,
// nama file itu dipakai. Kalau tidak ada, nama file ditebak otomatis.
const CODE_RE = /(?:\*\*FILE:\s*([^\n*]+?)\*\*\s*\n?)?```(\w*)\n?([\s\S]*?)```/g;

export function parseMessage(raw: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  let lastIndex = 0;
  let codeCount = 0;
  CODE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = CODE_RE.exec(raw))) {
    if (m.index > lastIndex) {
      segments.push({ type: 'text', content: raw.slice(lastIndex, m.index) });
    }
    codeCount += 1;
    const lang = m[2] || '';
    const filename = m[1]?.trim() || `code-${codeCount}.${guessExt(lang)}`;
    segments.push({ type: 'code', lang, filename, code: m[3].replace(/\n$/, '') });
    lastIndex = CODE_RE.lastIndex;
  }
  if (lastIndex < raw.length) {
    segments.push({ type: 'text', content: raw.slice(lastIndex) });
  }
  return segments;
}
