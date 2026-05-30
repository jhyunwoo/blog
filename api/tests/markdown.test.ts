import { describe, expect, it } from "vitest";
import { renderMarkdown } from "../src/markdown";

describe("renderMarkdown", () => {
  it("renders sanitized html, reading time, and toc", async () => {
    const result = await renderMarkdown("## Hello\n\n```ts\nconst value = 1\n```\n\n<script>alert(1)</script>");

    expect(result.html).toContain("Hello");
    expect(result.html).toContain("const");
    expect(result.html).not.toContain("<script>");
    expect(result.readingTime).toBeGreaterThanOrEqual(1);
    expect(result.toc[0]).toMatchObject({ text: "Hello", depth: 2 });
  }, 20000);
});
