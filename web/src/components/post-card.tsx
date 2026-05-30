import type { PostSummary } from "@blog/shared";
import { Calendar, Clock3 } from "lucide-react";
import Link from "next/link";

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <article className="group border-b border-line py-8">
      <Link href={`/posts/${post.slug}`} className="grid gap-4 md:grid-cols-[1fr_220px] md:items-start">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag.id} className="rounded-md bg-moss/10 px-2.5 py-1 text-xs font-semibold text-moss">
                {tag.name}
              </span>
            ))}
          </div>
          <h2 className="max-w-3xl text-3xl font-semibold leading-tight text-ink group-hover:text-coral">
            {post.title}
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-ink/68">{post.excerpt}</p>
        </div>
        <div className="flex gap-4 text-sm text-ink/55 md:flex-col md:items-end">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={16} />
            {post.publishedAt ? new Intl.DateTimeFormat("ko-KR").format(new Date(post.publishedAt)) : "Draft"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 size={16} />
            {post.readingTime}분
          </span>
        </div>
      </Link>
    </article>
  );
}
