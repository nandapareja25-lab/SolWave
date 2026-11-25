"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("system");
  useEffect(() => { console.error("store_error", error.digest ?? "no-digest"); }, [error]);
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
      <h1 className="font-display text-[28px]">{t("errorTitle")}</h1>
      <p className="mt-2 text-[15px] text-ink-2">{t("errorBody")}</p>
      <button type="button" onClick={reset} className="press mt-6 flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold text-on-dark">
        <RotateCcw aria-hidden="true" size={16} /> {t("retry")}
      </button>
    </div>
  );
}
