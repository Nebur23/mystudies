import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [prompt,    setPrompt]    = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    // Check if user dismissed before
    if (localStorage.getItem("pwa-install-dismissed")) {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "1");
  };

  if (!prompt || dismissed || installed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xl flex items-start gap-3">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
          <Smartphone size={20} className="text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-stone-900">Install MyStudies</p>
          <p className="text-xs text-stone-500 mt-0.5">
            Get offline access, faster loads & native app feel
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 border border-stone-200 text-stone-600 text-xs rounded-xl"
            >
              Not now
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="p-1 text-stone-400 hover:text-stone-600">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}