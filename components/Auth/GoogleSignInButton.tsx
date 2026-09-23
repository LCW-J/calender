"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        void signIn("google", { callbackUrl: "/today" });
      }}
      className="flex min-h-12 w-full items-center justify-center gap-3 rounded-card bg-accent px-4 py-3 text-sm font-semibold text-[#1a1305] hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold text-[#4285f4]">
        G
      </span>
      {loading ? "正在前往 Google…" : "使用 Google 登入"}
    </button>
  );
}
