import Link from "next/link";
import { BarChart3, FileText, Image, LayoutDashboard } from "lucide-react";
import type { Route } from "next";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f2ea] text-ink">
      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <aside className="border-r border-line bg-ink text-paper">
          <div className="px-5 py-6">
            <Link href="/" className="mb-8 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-md bg-paper text-sm font-black text-ink">EN</span>
              <span className="font-semibold">Admin</span>
            </Link>
            <nav className="grid gap-1 text-sm text-paper/75">
              <AdminLink href="/admin" icon={<LayoutDashboard size={17} />} label="Overview" />
              <AdminLink href="/admin/posts" icon={<FileText size={17} />} label="Posts" />
              <AdminLink href="/admin/media" icon={<Image size={17} />} label="Media" />
              <AdminLink href="/admin/visits" icon={<BarChart3 size={17} />} label="Visits" />
            </nav>
          </div>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

function AdminLink({ href, icon, label }: { href: Route; icon: React.ReactNode; label: string }) {
  return (
    <Link className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-white/10" href={href}>
      {icon}
      {label}
    </Link>
  );
}
