import { cn } from "@/lib/format";

/**
 * Minimal, dependency-free Markdown renderer for doc/meeting-notes content.
 * Supports headings, bold/italic/inline-code, links, images, bullet/numbered/
 * task lists, fenced code blocks, blockquotes, pipe tables, and horizontal
 * rules. Not a full CommonMark implementation, but covers committee docs.
 */

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  // Order matters: inline code first (so markup inside it stays literal), then
  // images (before links, so the leading `!` isn't dropped), links, bold, italic.
  const tokens = text.split(
    /(`[^`]+`|!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g,
  );
  return tokens.filter(Boolean).map((tok, i) => {
    const key = `${keyBase}-${i}`;
    if (tok.startsWith("`") && tok.endsWith("`")) {
      return (
        <code key={key} className="rounded bg-elevated px-1 py-0.5 font-mono text-[0.85em]">
          {tok.slice(1, -1)}
        </code>
      );
    }
    const image = tok.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={key}
          src={image[2]}
          alt={image[1]}
          className="my-2 max-w-full rounded-md border border-border"
        />
      );
    }
    const link = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a key={key} href={link[2]} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2">
          {link[1]}
        </a>
      );
    }
    if (tok.startsWith("**") && tok.endsWith("**")) {
      return <strong key={key}>{tok.slice(2, -2)}</strong>;
    }
    if (tok.startsWith("*") && tok.endsWith("*")) {
      return <em key={key}>{tok.slice(1, -1)}</em>;
    }
    return <span key={key}>{tok}</span>;
  });
}

type ListItem = { text: string; checked?: boolean };

function isTableSeparator(line: string): boolean {
  const t = line.trim();
  if (!t.includes("|")) return false;
  const cells = t.replace(/^\||\|$/g, "").split("|");
  return cells.length >= 2 && cells.every((c) => /^\s*:?-+:?\s*$/.test(c));
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}

function alignClass(sep: string): string {
  const s = sep.trim();
  const left = s.startsWith(":");
  const right = s.endsWith(":");
  if (left && right) return "text-center";
  if (right) return "text-right";
  return "text-left";
}

function parseBlocks(lines: string[], keyPrefix: string): React.ReactNode[] {
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: ListItem[] } | null = null;
  let para: string[] = [];
  const key = () => `${keyPrefix}-${blocks.length}`;

  const flushPara = () => {
    if (para.length) {
      blocks.push(
        <p key={key()} className="text-sm leading-relaxed text-foreground/90">
          {renderInline(para.join(" "), key())}
        </p>,
      );
      para = [];
    }
  };

  const flushList = () => {
    if (!list) return;
    const k = key();
    const isTask = list.items.some((it) => it.checked !== undefined);
    const items = list.items.map((it, idx) =>
      it.checked !== undefined ? (
        <li key={idx} className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={it.checked}
            readOnly
            className="mt-0.5 size-3.5 shrink-0 accent-[var(--color-accent)]"
          />
          <span className={cn(it.checked && "text-muted line-through")}>
            {renderInline(it.text, `${k}-${idx}`)}
          </span>
        </li>
      ) : (
        <li key={idx}>{renderInline(it.text, `${k}-${idx}`)}</li>
      ),
    );
    if (list.ordered) {
      blocks.push(
        <ol key={k} className="ml-5 list-decimal space-y-1 text-sm text-foreground/90">{items}</ol>,
      );
    } else if (isTask) {
      blocks.push(
        <ul key={k} className="space-y-1 text-sm text-foreground/90">{items}</ul>,
      );
    } else {
      blocks.push(
        <ul key={k} className="ml-5 list-disc space-y-1 text-sm text-foreground/90">{items}</ul>,
      );
    }
    list = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();

    // Fenced code block: ``` or ```lang … ```
    const fence = line.match(/^```\s*(\S*)\s*$/);
    if (fence) {
      flushPara();
      flushList();
      const lang = fence[1];
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) {
        code.push(lines[i]);
        i++;
      }
      blocks.push(
        <pre key={key()} className="overflow-x-auto rounded-md border border-border bg-elevated p-3">
          {lang && (
            <div className="mb-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-muted/70">
              {lang}
            </div>
          )}
          <code className="font-mono text-[0.8rem] leading-relaxed text-foreground/90">
            {code.join("\n")}
          </code>
        </pre>,
      );
      continue; // for-loop's i++ steps past the closing fence
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushPara();
      flushList();
      blocks.push(<hr key={key()} className="border-border" />);
      continue;
    }

    // Pipe table: a header row immediately followed by a separator row.
    if (line.includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      flushPara();
      flushList();
      const header = splitRow(line);
      const aligns = splitRow(lines[i + 1]).map(alignClass);
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && lines[j].trim() !== "" && lines[j].includes("|")) {
        rows.push(splitRow(lines[j]));
        j++;
      }
      const k = key();
      blocks.push(
        <div key={k} className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                {header.map((c, ci) => (
                  <th key={ci} className={cn("px-3 py-2 font-medium", aligns[ci] ?? "text-left")}>
                    {renderInline(c, `${k}-th-${ci}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="border-b border-border/60">
                  {row.map((c, ci) => (
                    <td key={ci} className={cn("px-3 py-2 text-foreground/90", aligns[ci] ?? "text-left")}>
                      {renderInline(c, `${k}-td-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      i = j - 1; // continue → for-loop i++ lands on the first non-table line
      continue;
    }

    // Blockquote: one or more consecutive `>` lines, rendered recursively.
    if (line.startsWith(">")) {
      flushPara();
      flushList();
      const quote: string[] = [];
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith(">")) {
        quote.push(lines[j].trim().replace(/^>\s?/, ""));
        j++;
      }
      blocks.push(
        <blockquote
          key={key()}
          className="space-y-2 border-l-2 border-accent/40 pl-4 text-foreground/80"
        >
          {parseBlocks(quote, `${key()}-q`)}
        </blockquote>,
      );
      i = j - 1;
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    const bullet = line.match(/^[-*]\s+(.*)$/);
    const numbered = line.match(/^\d+\.\s+(.*)$/);

    if (heading) {
      flushPara();
      flushList();
      const level = heading[1].length;
      const sizes = [
        "text-lg font-semibold",
        "text-base font-semibold",
        "text-sm font-semibold",
        "text-sm font-medium",
      ];
      blocks.push(
        <p key={key()} className={cn("font-title mt-2", sizes[level - 1])}>
          {renderInline(heading[2], key())}
        </p>,
      );
    } else if (bullet) {
      flushPara();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      const task = bullet[1].match(/^\[([ xX])\]\s+(.*)$/);
      if (task) {
        list.items.push({ text: task[2], checked: task[1].toLowerCase() === "x" });
      } else {
        list.items.push({ text: bullet[1] });
      }
    } else if (numbered) {
      flushPara();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push({ text: numbered[1] });
    } else if (line.trim() === "") {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();

  return blocks;
}

export function Markdown({ content, className }: { content: string; className?: string }) {
  const lines = (content ?? "").replace(/\r\n/g, "\n").split("\n");
  return <div className={cn("space-y-3", className)}>{parseBlocks(lines, "b")}</div>;
}
