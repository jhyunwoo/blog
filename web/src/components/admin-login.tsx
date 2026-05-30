"use client";

import { browserApiBaseUrl } from "@/lib/api";
import { LogIn } from "lucide-react";
import { useState } from "react";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await fetch(`${browserApiBaseUrl}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      setMessage("로그인 정보가 올바르지 않습니다.");
      return;
    }

    window.location.href = "/admin/posts";
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold">관리자 로그인</h2>
      <label className="mt-5 block text-sm font-medium">
        이메일
        <input
          className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 outline-none focus:border-steel"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className="mt-4 block text-sm font-medium">
        비밀번호
        <input
          className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2 outline-none focus:border-steel"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {message ? <p className="mt-3 text-sm text-coral">{message}</p> : null}
      <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 font-semibold text-paper hover:bg-coral">
        <LogIn size={18} />
        로그인
      </button>
    </form>
  );
}
