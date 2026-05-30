import { PostCard } from "@/components/post-card";
import { SiteHeader } from "@/components/site-header";
import { VisitTracker } from "@/components/visit-tracker";
import { getPosts } from "@/lib/api";

export default async function HomePage() {
  const { items: posts } = await getPosts().catch(() => ({ items: [] }));

  return (
    <>
      <SiteHeader />
      <VisitTracker path="/" />
      <main>
        <section className="mx-auto max-w-6xl px-5 pb-10 pt-16">
          <div className="max-w-4xl">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-coral">Cloudflare-native blog</p>
            <h1 className="text-5xl font-semibold leading-[1.02] text-ink md:text-7xl">
              빠르게 읽히고 오래 남는 기술 기록.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/68">
              Edge runtime, D1, R2, pre-rendered Markdown pipeline으로 구성된 기술 블로그입니다.
            </p>
          </div>
        </section>
        <section className="border-y border-line bg-white/35">
          <div className="mx-auto max-w-6xl px-5">
            {posts.length > 0 ? (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="py-20 text-ink/60">아직 게시된 글이 없습니다.</div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
