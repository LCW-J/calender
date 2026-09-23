import { auth } from "@/auth";
import GoogleSignInButton from "@/components/Auth/GoogleSignInButton";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/today");

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-5 py-10">
      <section className="soft-card w-full max-w-sm rounded-[30px] p-7 text-center">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-accent text-2xl font-bold text-white shadow-[0_14px_30px_rgba(198,107,75,.25)]">
            時
          </div>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.25em] text-accent">Welcome to 時程</div>
          <h1 className="mb-2 text-xl font-bold">登入你的月曆</h1>
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
