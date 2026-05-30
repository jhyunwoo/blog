import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-line/80 bg-paper/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-md bg-ink text-sm font-black text-paper">EN</span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-[0.16em] text-steel">Edge Notes</span>
            <span className="block text-xs text-ink/55">Next.js · Hono · Cloudflare</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-medium text-ink/70">
          <Link className="rounded-md px-3 py-2 hover:bg-ink/5" href="/">
            Posts
          </Link>
          <Link className="rounded-md px-3 py-2 hover:bg-ink/5" href="/admin">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
