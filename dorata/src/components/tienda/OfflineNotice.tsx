"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineNotice({ label }: { label: string }) {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="rise fixed inset-x-4 top-20 z-50 mx-auto flex max-w-md items-center gap-3 rounded-[4px] bg-ink px-4 py-3 text-[14px] text-on-dark shadow-lg">
      <WifiOff aria-hidden="true" size={18} className="shrink-0 text-gold" /> {label}
    </div>
  );
}
