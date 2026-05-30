import { SiteHeader } from "@/components/site-header";
import { VisitTracker } from "@/components/visit-tracker";
import { getPost } from "@/lib/api";
import { Calendar, Clock3 } from "lucide-react";
import { notFound } from "next/navigation";

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug).catch(() => null);

  if (!post) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <VisitTracker path={`/posts/${post.slug}`} postId={post.id} />
      <main className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[1fr_260px]">
        <article className="min-w-0">
          <div className="mb-6 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag.id} className="rounded-md bg-steel/10 px-2.5 py-1 text-xs font-semibold text-steel">
                {tag.name}
              </span>
            ))}
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-ink md:text-6xl">{post.title}</h1>
          <div className="mt-6 flex flex-wrap gap-5 text-sm text-ink/55">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={16} />
              {post.publishedAt ? new Intl.DateTimeFormat("ko-KR").format(new Date(post.publishedAt)) : "Draft"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={16} />
              {post.readingTime}분 읽기
            </span>
          </div>
          <div className="article-body mt-10" dangerouslySetInnerHTML={{ __html: post.html }} />
        </article>
        <aside className="hidden lg:block">
          <div className="sticky top-8 border-l border-line pl-5">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-ink/45">Contents</p>
            <nav className="space-y-2 text-sm text-ink/62">
              {post.toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block hover:text-coral"
                  style={{ paddingLeft: `${(item.depth - 2) * 12}px` }}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      </main>
    </>
  );
}
