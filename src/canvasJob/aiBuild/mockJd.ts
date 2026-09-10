export type JdReadResult = { markdown: string; mocked: boolean; error?: string };

export const MOCK_PRODUCT_DESIGNER_JD = `# Senior Product Designer

**Location:** Bangalore · Hybrid
**Experience:** 5–8 years
**Compensation:** 35–50L (INR)
**Type:** Full-time · B2B SaaS product company

## About the role

We are looking for a Senior Product Designer to own end-to-end design for one of
our core B2B SaaS surfaces. You will work out of Bangalore on a hybrid schedule,
sitting close to product and engineering, and you will be accountable for the
quality of what ships — not just the mockups that precede it.

This is a senior individual contributor role. You will set the bar for craft on
your surface, bring clarity to ambiguous problems, and help shape how the wider
design team works.

## What you'll do

- Own discovery through delivery for a core product area, from problem framing to shipped release.
- Turn messy, ambiguous customer problems into clear product bets backed by real user evidence.
- Design flows, interaction models and interface states that hold up under real enterprise usage.
- Partner day to day with product managers and engineers to make scope, sequencing and trade-off calls.
- Prototype at the right fidelity to answer the open question quickly.
- Contribute patterns and components back to the design system so the work compounds.
- Run critique and give sharp, specific feedback that raises the quality of the whole team's output.

## What we're looking for

- 5–8 years designing digital products, with meaningful time on B2B or SaaS software.
- Strong product thinking — you can explain why a design exists, not just how it looks.
- A portfolio of shipped work with your specific contribution and the outcome made clear.
- Depth in interaction design: states, edge cases, empty and error conditions, and complex data density.
- Proven cross-functional collaboration with product and engineering partners.
- Comfort working in Figma with systems, components and tokens.

## Nice to have

- Experience with workflow, admin or data-heavy enterprise tools.
- Familiarity with accessibility standards and how to build them into a process.
- Front-end literacy — enough to prototype in code or hold a real conversation about feasibility.
- Experience mentoring designers or helping establish design practice at a growing company.

## Interview process

- Intro conversation with the hiring manager (30 minutes).
- Portfolio walkthrough — two projects, in depth (60 minutes).
- Take-home-free product design exercise with the team (90 minutes).
- Cross-functional conversation with product and engineering partners.
- Closing conversation with the design leader.
`;

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
    return { markdown: MOCK_PRODUCT_DESIGNER_JD, mocked: true };
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
