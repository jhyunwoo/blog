import { AdminLogin } from "@/components/admin-login";

export default function AdminPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-12">
      <div className="grid w-full gap-10 lg:grid-cols-[1fr_380px]">
        <section>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-coral">Dashboard</p>
          <h1 className="text-5xl font-semibold leading-tight">글, 미디어, 방문 기록을 한 곳에서 관리합니다.</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-ink/64">
            Markdown 작성 흐름과 R2 미디어 업로드, D1 기반 방문 로그 조회를 위한 관리자 콘솔입니다.
          </p>
        </section>
        <AdminLogin />
      </div>
    </div>
  );
}
