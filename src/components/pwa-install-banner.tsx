"use client";

import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";

interface PwaInstallBannerProps {
  label?: string;
}

export function PwaInstallBanner({ label = "Waghad Villa" }: PwaInstallBannerProps) {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      (window as any).deferredInstallPrompt = e;
      setInstallPrompt(e);
      setTimeout(() => setShowInstallBanner(true), 3000);
    };

    // If event already fired on a previous page, reuse it
    if ((window as any).deferredInstallPrompt) {
      setInstallPrompt((window as any).deferredInstallPrompt);
      setTimeout(() => setShowInstallBanner(true), 3000);
    }

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    const prompt = installPrompt || (window as any).deferredInstallPrompt;
    if (!prompt) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prompt as any).prompt();
    setInstallPrompt(null);
    (window as any).deferredInstallPrompt = null;
    setShowInstallBanner(false);
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 md:left-auto md:right-6 md:w-80">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Install App</p>
          <p className="text-xs text-slate-400">Add {label} to your home screen</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            Install
          </button>
          <button
            onClick={() => setShowInstallBanner(false)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
