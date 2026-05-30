import type { Plugin } from "unified";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeShiki from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import type { TocItem } from "./types";

export type RenderedMarkdown = {
  html: string;
  excerpt: string;
  readingTime: number;
  toc: TocItem[];
};

const tocPlugin = (toc: TocItem[]): Plugin<[], any> => {
  return () => (tree) => {
    for (const node of tree.children) {
      if (node.type !== "element" || !/^h[2-3]$/.test(node.tagName)) {
        continue;
      }

      const id = String(node.properties?.id ?? "");
      const text = node.children
        .map((child: any) => ("value" in child ? String(child.value) : ""))
        .join("")
        .trim();

      if (id && text) {
        toc.push({ id, depth: Number(node.tagName.slice(1)), text });
      }
    }
  };
};

const schema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "video",
    "source",
    "figure",
    "figcaption",
    "span"
  ],
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "className", "id"],
    a: [...(defaultSchema.attributes?.a ?? []), "target", "rel"],
    img: [...(defaultSchema.attributes?.img ?? []), "loading", "decoding"],
    video: ["src", "controls", "preload", "poster", "className"],
    source: ["src", "type"],
    code: ["className"],
    span: ["className"]
  },
  protocols: {
    ...defaultSchema.protocols,
    src: ["http", "https", "data"]
  }
};

export async function renderMarkdown(markdown: string, fallbackExcerpt?: string): Promise<RenderedMarkdown> {
  const toc: TocItem[] = [];
  const processor = unified() as any;
  const file = await processor
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSlug)
    .use(tocPlugin(toc))
    .use(rehypeAutolinkHeadings as any, { behavior: "wrap" })
    .use(rehypeShiki as any, { theme: "github-dark-default" })
    .use(rehypeSanitize as any, schema)
    .use(rehypeStringify)
    .process(markdown);

  return {
    html: String(file),
    excerpt: fallbackExcerpt?.trim() || createExcerpt(markdown),
    readingTime: Math.max(1, Math.ceil(markdown.trim().split(/\s+/).length / 220)),
    toc
  };
}

export function createExcerpt(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/\[[^\]]+]\([^)]+\)/g, (match) => match.slice(1, match.indexOf("]")))
    .replace(/[#>*_`~-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}
