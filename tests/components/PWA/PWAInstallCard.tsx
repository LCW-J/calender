"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  const iosStandalone = "standalone" in window.navigator &&
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}

interface InstallContextValue {
  installPrompt: BeforeInstallPromptEvent | null;
  installed: boolean;
  isIOS: boolean;
  install: () => Promise<void>;
}

const InstallContext = createContext<InstallContextValue | null>(null);

export function PWAInstallProvider({ children }: { children: React.ReactNode }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      setInstalled(true);
      setInstallPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
  }

  const value = useMemo(
    () => ({ installPrompt, installed, isIOS, install }),
    [installPrompt, installed, isIOS]
  );

  return <InstallContext.Provider value={value}>{children}</InstallContext.Provider>;
}

export default function PWAInstallCard() {
  const context = useContext(InstallContext);
  if (!context) throw new Error("PWAInstallCard 必須在 <PWAInstallProvider> 內使用");
  const { installPrompt, installed, isIOS, install } = context;

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="text-sm font-medium">安裝到手機</div>
        {installed && (
          <span className="rounded-full bg-teal-dim px-2 py-1 text-[11px] font-medium text-teal">
            已安裝
          </span>
        )}
      </div>
      <p className="mb-3 text-xs leading-relaxed text-text-dim">
        安裝後可從主畫面全螢幕開啟，不需要 App Store，也不會產生費用。
      </p>

      {!installed && installPrompt && (
        <button
          type="button"
          onClick={install}
          className="min-h-11 rounded-card bg-accent px-4 py-2 text-sm font-semibold text-[#1a1305] hover:brightness-110"
        >
          安裝「時程」
        </button>
      )}

      {!installed && !installPrompt && isIOS && (
        <div className="rounded-lg bg-surface2 p-3 text-xs leading-relaxed text-text-dim">
          在 Safari 點擊「分享」圖示，再選擇「加入主畫面」。首次從主畫面開啟後，就會以 App 模式運作。
        </div>
      )}

      {!installed && !installPrompt && !isIOS && (
        <div className="rounded-lg bg-surface2 p-3 text-xs leading-relaxed text-text-dim">
          若沒有出現安裝按鈕，請從瀏覽器選單選擇「安裝應用程式」或「加到主畫面」。部署到 HTTPS 網址後才能安裝。
        </div>
      )}
    </div>
  );
}
