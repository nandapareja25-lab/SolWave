import { Crown, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function SectionHeading({ kicker, title, href, linkLabel, tone = "light", id }: {
  kicker?: string; title: string; href?: string; linkLabel?: string; tone?: "light" | "dark"; id?: string;
}) {
  const dark = tone === "dark";
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {kicker && (
          <p className={`flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[.16em] ${dark ? "text-gold" : "text-gold-deep"}`}>
            <Crown aria-hidden="true" size={14} strokeWidth={1.75} /> {kicker}
          </p>
        )}
        <h2 id={id} className="mt-1 font-display text-[28px] leading-[1.1]">{title}</h2>
      </div>
      {href && linkLabel && (
        <Link href={href} className={`press inline-flex min-h-11 shrink-0 items-center gap-1 text-[14px] font-semibold ${dark ? "text-on-dark" : "text-ink"}`}>
          {linkLabel} <ArrowRight aria-hidden="true" size={16} />
        </Link>
      )}
    </div>
  );
}
