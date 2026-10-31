import { useState, useEffect } from "react";
import { HardDrive, Wifi, WifiOff, Trash2, CheckCircle2 } from "lucide-react";

interface Props {
  fileUrl:   string;
  fileName:  string;
  fileSize?: number | null;
}

const CACHE_NAME = "mystudies-pdfs-v1";

export function OfflinePdfCache({ fileUrl, fileName, fileSize }: Props) {
  const [cached,   setCached]   = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    window.addEventListener("online",  () => setIsOnline(true));
    window.addEventListener("offline", () => setIsOnline(false));

    // Check if already cached
    checkCached();
  }, [fileUrl]);

  async function checkCached() {
    try {
      const cache    = await caches.open(CACHE_NAME);
      const response = await cache.match(fileUrl);
      setCached(!!response);
    } catch { /* Cache API unavailable */ }
  }

  async function handleSaveOffline() {
    setSaving(true);
    try {
      const cache    = await caches.open(CACHE_NAME);
      const response = await fetch(fileUrl);
      await cache.put(fileUrl, response);
      setCached(true);
    } catch (err) {
      console.error("Cache failed:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(fileUrl);
      setCached(false);
    } catch { /* ignore */ }
  }

  function formatSize(bytes?: number | null) {
    if (!bytes) return "";
    return bytes < 1_048_576
      ? `${(bytes / 1024).toFixed(0)} KB`
      : `${(bytes / 1_048_576).toFixed(1)} MB`;
  }

  return (
    <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-xl">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          cached ? "bg-emerald-100" : "bg-stone-100"
        }`}>
          {cached
            ? <CheckCircle2 size={15} className="text-emerald-600" />
            : <HardDrive    size={15} className="text-stone-500"   />
          }
        </div>
        <div>
          <p className="text-xs font-semibold text-stone-800">
            {cached ? "Saved for offline" : "Save for offline"}
          </p>
          <p className="text-[10px] text-stone-400">
            {cached
              ? "Available without internet"
              : `${formatSize(fileSize)} · read anywhere`}
          </p>
        </div>
      </div>

      {cached ? (
        <button
          onClick={handleRemove}
          className="p-2 text-stone-400 hover:text-red-500 transition-colors"
          title="Remove from offline storage"
        >
          <Trash2 size={14} />
        </button>
      ) : (
        <button
          onClick={handleSaveOffline}
          disabled={saving || !isOnline}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            !isOnline
              ? "bg-stone-100 text-stone-400 cursor-not-allowed"
              : "bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50"
          }`}
        >
          {saving ? (
            <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
          ) : !isOnline ? (
            <><WifiOff size={11} /> Offline</>
          ) : (
            <><Wifi size={11} /> Save</>
          )}
        </button>
      )}
    </div>
  );
}