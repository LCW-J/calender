import { auth } from "@/auth";
import GoogleSignInButton from "@/components/Auth/GoogleSignInButton";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/today");

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-5 py-10">
      <section className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <div className="mb-7 text-center">
          <div className="mb-2 text-3xl font-bold tracking-tight">
            時<span className="text-accent">程</span>
          </div>
          <h1 className="mb-2 text-lg font-semibold">登入你的月曆</h1>
          <p className="text-sm leading-relaxed text-text-dim">
            登入後，手機、平板與電腦會使用同一份 Neon 雲端資料。
          </p>
        </div>
        <GoogleSignInButton />
        <p className="mt-4 text-center text-[11px] leading-relaxed text-text-faint">
          時程只會取得 Google 提供的基本帳號資料，用來辨識你的月曆。
        </p>
      </section>
    </main>
  );
}
