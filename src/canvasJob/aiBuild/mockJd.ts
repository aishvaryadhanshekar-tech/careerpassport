import mockProductDesignerJd from "../../demo/mock-senior-product-designer-jd.md?raw";

export type JdReadResult = { markdown: string; mocked: boolean; error?: string };

/** Matches the deep Senior Product Designer dataset: Bengaluru, hybrid 3 days, 6–9 years, ₹38–55L. */
export const MOCK_PRODUCT_DESIGNER_JD: string = mockProductDesignerJd;

const MOCK_EXTENSIONS = ['pdf', 'doc', 'docx'];
const TEXT_EXTENSIONS = ['txt', 'md', 'markdown'];

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
}

function isHeadingLine(line: string): boolean {
  if (line.length > 70) return false;
  if (/^[A-Z][A-Za-z0-9 &/'()-]*:$/.test(line)) return true;
  return /[A-Z]/.test(line) && !/[a-z]/.test(line);
}

function toMarkdown(text: string, promote: boolean): string {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').map(line => line.replace(/\s+$/, ''));
  const converted = lines.map(line => {
    if (!promote) return line;
    const trimmed = line.trim();
    if (!trimmed) return '';
    const bullet = trimmed.match(/^[-*•]\s+(.*)$/);
    if (bullet) return `- ${bullet[1]}`;
    if (isHeadingLine(trimmed)) return `## ${trimmed.replace(/:$/, '')}`;
    return line;
  });
  return converted.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export async function readDocumentText(file: File): Promise<JdReadResult> {
  const extension = extensionOf(file.name);
  if (MOCK_EXTENSIONS.includes(extension)) {
    return { markdown: MOCK_PRODUCT_DESIGNER_JD.trim(), mocked: true };
  }
  if (!TEXT_EXTENSIONS.includes(extension)) {
    return { markdown: '', mocked: false, error: `Could not read ${file.name} — unsupported file type.` };
  }
  try {
    const text = await file.text();
    // Only .txt gets heading/bullet promotion; .md files are already authored as markdown.
    const promote = extension === 'txt' && !/^#{1,6}\s/m.test(text);
    return { markdown: toMarkdown(text, promote), mocked: false };
  } catch {
    return { markdown: '', mocked: false, error: `Could not read ${file.name}.` };
  }
}

export async function readDocuments(files: File[]): Promise<JdReadResult> {
  const results = await Promise.all(files.map(readDocumentText));
  const markdown = results.map(result => result.markdown).filter(Boolean).join('\n\n---\n\n');
  const errors = results.map(result => result.error).filter((message): message is string => Boolean(message));
  const mocked = results.some(result => result.mocked);
  return errors.length ? { markdown, mocked, error: errors.join('; ') } : { markdown, mocked };
}

/** Puts an uploaded JD's markdown after whatever is already in the composer. */
export function withDocumentText(prompt: string, markdown: string): string {
  const typed = prompt.trim();
  return typed ? `${typed}\n\n${markdown}` : markdown;
}

/** Takes an uploaded JD back out of the composer; text the person has since edited is left alone. */
export function withoutDocumentText(prompt: string, markdown: string): string {
  const inserted = markdown.trim();
  if (!inserted || !prompt.includes(inserted)) return prompt;
  return prompt.replace(inserted, '').replace(/\n{3,}/g, '\n\n').trim();
}
