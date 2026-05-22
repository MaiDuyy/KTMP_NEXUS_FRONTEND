"use client";

import React from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, ExternalLink, Hash, Info, List } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WikiImage } from "./WikiImage";

function wikiUrlTransform(url: string): string {
  if (url.startsWith("image://")) return url;
  if (/^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(url)) return url;
  return "";
}

export function preprocessWikilinks(md: string, allPages?: { title: string; slug: string }[]): string {
  if (!allPages || allPages.length === 0) {
    return md
      .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "[$2](/wiki/$1)")
      .replace(/\[\[([^\]]+)\]\]/g, "[$1](/wiki/$1)");
  }

  const titleToSlug = new Map<string, string>();
  const slugToSlug = new Map<string, string>();
  const normalizedTitleToSlug = new Map<string, string>();

  const removeAccents = (str: string) => 
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  for (const p of allPages) {
    const lowerTitle = p.title.toLowerCase();
    const lowerSlug = p.slug.toLowerCase();
    titleToSlug.set(lowerTitle, p.slug);
    slugToSlug.set(lowerSlug, p.slug);
    normalizedTitleToSlug.set(removeAccents(lowerTitle), p.slug);
    normalizedTitleToSlug.set(removeAccents(lowerSlug), p.slug);
  }

  const getResolvedSlug = (target: string) => {
    const norm = target.trim().toLowerCase();
    
    // 1. Direct match on slug or title
    if (slugToSlug.has(norm)) return slugToSlug.get(norm);
    if (titleToSlug.has(norm)) return titleToSlug.get(norm);

    // 2. Direct match with accents removed (for flexible Vietnamese typing)
    const normNoAccents = removeAccents(norm);
    if (normalizedTitleToSlug.has(normNoAccents)) return normalizedTitleToSlug.get(normNoAccents);

    // 3. Match after standard slugification
    const slugified = norm.replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
    if (slugToSlug.has(slugified)) return slugToSlug.get(slugified);

    // 4. English plural fallback (e.g. "containers" -> "container")
    if (norm.endsWith("s")) {
      const singular = norm.slice(0, -1);
      if (slugToSlug.has(singular)) return slugToSlug.get(singular);
      if (titleToSlug.has(singular)) return titleToSlug.get(singular);
      if (normalizedTitleToSlug.has(removeAccents(singular))) return normalizedTitleToSlug.get(removeAccents(singular));
      
      const slugifiedSingular = slugified.slice(0, -1);
      if (slugToSlug.has(slugifiedSingular)) return slugToSlug.get(slugifiedSingular);
    }
    if (norm.endsWith("es")) {
      const singular = norm.slice(0, -2);
      if (slugToSlug.has(singular)) return slugToSlug.get(singular);
      if (titleToSlug.has(singular)) return titleToSlug.get(singular);
      if (normalizedTitleToSlug.has(removeAccents(singular))) return normalizedTitleToSlug.get(removeAccents(singular));
      
      const slugifiedSingular = slugified.slice(0, -2);
      if (slugToSlug.has(slugifiedSingular)) return slugToSlug.get(slugifiedSingular);
    }

    return target; // fallback
  };

  // Replace [[target|label]]
  let processed = md.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (match, target, label) => {
    const resolved = getResolvedSlug(target);
    return `[${label}](/wiki/${resolved})`;
  });

  // Replace [[target]]
  processed = processed.replace(/\[\[([^\]]+)\]\]/g, (match, target) => {
    const resolved = getResolvedSlug(target);
    return `[${target}](/wiki/${resolved})`;
  });

  return processed;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-border"
      title="Sao chép mã"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function extractHeadings(md: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];
  const lines = md.split("\n");
  for (const line of lines) {
    const match = line.match(/^(#{2,4})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      headings.push({ id, text, level });
    }
  }
  return headings;
}

export function WikiContent({
  markdown,
  onWikiLinkClick,
  linkSuffix = "",
  allPages,
}: {
  markdown: string;
  onWikiLinkClick?: (slug: string) => void;
  linkSuffix?: string;
  allPages?: { title: string; slug: string }[];
}) {
  const processed = React.useMemo(() => preprocessWikilinks(markdown, allPages), [markdown, allPages]);
  const headings = React.useMemo(() => extractHeadings(markdown), [markdown]);
  const [activeHeading, setActiveHeading] = React.useState<string | null>(null);

  // Intersection observer for active heading tracking
  React.useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.5 }
    );
    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [headings]);

  return (
    <div className="relative flex flex-col gap-6">
      {/* Table of Contents — only show when enough headings */}
      {headings.length >= 3 && (
        <div className="rounded-xl border border-border bg-card p-2.5 shadow-sm">
          <p className="text-xs font-mono font-extrabold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b pb-1.5">
            <List className="w-4 h-4 text-primary" />
            Mục lục tài liệu
          </p>
          <nav className="flex flex-col gap-1">
            {headings.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                className={`text-xs py-1 hover:underline transition-colors ${
                  activeHeading === h.id
                    ? "text-primary font-bold"
                    : "text-muted-foreground"
                }`}
                style={{ paddingLeft: (h.level - 2) * 16 }}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {h.text}
              </a>
            ))}
          </nav>
        </div>
      )}

      <div className="prose prose-slate dark:prose-invert max-w-none text-foreground/90">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          urlTransform={wikiUrlTransform}
          components={{
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold tracking-tight text-foreground mt-6 mb-4 flex items-center gap-2 border-b pb-2">
                <Hash className="w-5 h-5 text-primary/50" />
                {children}
              </h1>
            ),
            h2: ({ children }) => {
              const text = typeof children === "string" ? children : "";
              const id = String(text)
                .toLowerCase()
                .replace(/[^\w\s-]/g, "")
                .replace(/\s+/g, "-");
              return (
                <h2
                  id={id}
                  className="text-xl font-semibold text-foreground mt-8 mb-3 flex items-center gap-2 border-b pb-1 scroll-mt-20"
                >
                  <Hash className="w-4 h-4 text-primary/40" />
                  {children}
                </h2>
              );
            },
            h3: ({ children }) => {
              const text = typeof children === "string" ? children : "";
              const id = String(text)
                .toLowerCase()
                .replace(/[^\w\s-]/g, "")
                .replace(/\s+/g, "-");
              return (
                <h3
                  id={id}
                  className="text-lg font-medium text-foreground mt-6 mb-2 scroll-mt-20"
                >
                  {children}
                </h3>
              );
            },
            h4: ({ children }) => {
              const text = typeof children === "string" ? children : "";
              const id = String(text)
                .toLowerCase()
                .replace(/[^\w\s-]/g, "")
                .replace(/\s+/g, "-");
              return (
                <h4
                  id={id}
                  className="text-base font-medium text-foreground mt-4 mb-1 scroll-mt-20"
                >
                  {children}
                </h4>
              );
            },
            p: ({ children }) => (
              <p className="text-sm leading-7 text-foreground/80 mb-4 whitespace-pre-wrap">{children}</p>
            ),
            a: ({ href, children }) => {
              if (href?.startsWith("/wiki/")) {
                const slug = href.slice("/wiki/".length);
                if (onWikiLinkClick) {
                  return (
                    <button
                      onClick={() => onWikiLinkClick(slug)}
                      className="text-primary font-medium hover:underline transition-all"
                    >
                      {children}
                    </button>
                  );
                }
                return (
                  <Link
                    href={`${href}${linkSuffix}`}
                    className="text-primary font-medium hover:underline transition-all"
                  >
                    {children}
                  </Link>
                );
              }
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-medium inline-flex items-center gap-0.5 hover:underline"
                >
                  {children}
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              );
            },
            code: ({ children, className }) => {
              const isBlock = className?.startsWith("language-");
              if (isBlock) {
                return (
                  <code className="block text-xs font-mono text-foreground/90 leading-6 p-1">
                    {children}
                  </code>
                );
              }
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs text-primary font-medium">
                  {children}
                </code>
              );
            },
            pre: ({ children }) => {
              const codeText = React.Children.toArray(children)
                .map((child) => {
                  if (React.isValidElement(child)) {
                    return (child.props as { children?: string }).children ?? "";
                  }
                  return String(child);
                })
                .join("");
              return (
                <div className="relative group/code my-4">
                  <pre className="bg-muted/50 border rounded-xl p-4 overflow-x-auto text-xs font-mono">
                    {children}
                  </pre>
                  <CopyButton text={codeText} />
                </div>
              );
            },
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground bg-muted/20 py-2 pr-2 rounded-r flex gap-2 items-start">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>{children}</div>
              </blockquote>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-outside pl-5 mb-4 space-y-1.5 text-sm text-foreground/80">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-outside pl-5 mb-4 space-y-1.5 text-sm text-foreground/80">
                {children}
              </ol>
            ),
            li: ({ children }) => <li className="leading-7">{children}</li>,
            hr: () => <hr className="border-border my-6" />,
            strong: ({ children }) => (
              <strong className="font-semibold text-foreground">{children}</strong>
            ),
            em: ({ children }) => <em className="italic">{children}</em>,
            img: ({ src, alt }) => {
              const srcStr = typeof src === "string" ? src : "";
              const altStr = typeof alt === "string" ? alt : "";
              if (!srcStr) return <WikiImage alt={altStr} status="missing" />;
              if (srcStr.startsWith("image://")) {
                return <WikiImage alt={altStr} status="missing" />;
              }
              return <WikiImage src={srcStr} alt={altStr} status="ok" />;
            },
            table: ({ children }) => (
              <div className="my-4 rounded-xl border border-border overflow-hidden shadow-sm bg-card">
                <Table>{children}</Table>
              </div>
            ),
            thead: ({ children }) => <TableHeader>{children}</TableHeader>,
            tbody: ({ children }) => <TableBody>{children}</TableBody>,
            tr: ({ children }) => <TableRow>{children}</TableRow>,
            th: ({ children }) => (
              <TableHead className="text-xs uppercase font-semibold text-foreground bg-muted">{children}</TableHead>
            ),
            td: ({ children }) => <TableCell className="text-sm">{children}</TableCell>,
          }}
        >
          {processed}
        </ReactMarkdown>
      </div>
    </div>
  );
}
