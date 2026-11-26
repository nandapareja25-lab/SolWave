"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { type Announcement, type AnnouncementItem, marqueeDurationSeconds, viewAt } from "@/lib/announcement";
import { countdownParts, formatCountdown, msToNextSecond } from "@/lib/countdown";

const STYLE_CLASS: Record<Announcement["style"], string> = {
  black: "bg-velvet text-on-dark [--ann-accent:var(--gold)]",
  gold: "bg-gold text-ink [--ann-accent:var(--ink)]",
  cream: "bg-cream text-ink border-b border-line [--ann-accent:var(--gold-deep)]",
  white: "bg-surface text-ink border-b border-line [--ann-accent:var(--gold-deep)]",
  custom: "",
};

type Labels = { region: string; pause: string; play: string };

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduce;
}

function ItemContent({ item, countdown }: { item: AnnouncementItem; countdown: string | null }) {
  const parts = item.countdown && countdown !== null ? item.text.split("{countdown}") : [item.text];
  return (
    <span className="inline-flex items-center gap-2">
      <span>
        {parts[0]}
        {parts.length > 1 && <span className="tabular font-semibold text-[color:var(--ann-accent)]">{countdown}</span>}
        {parts[1]}
      </span>
      {item.link_url && (
        <a href={item.link_url} className="underline decoration-[color:var(--ann-accent)] underline-offset-[3px]">
          {item.link_label || "Ver"}
        </a>
      )}
    </span>
  );
}

/**
 * Barra superior programable. El servidor ya decidió qué campaña mostrar; aquí se resuelve
 * lo que cambia con la página abierta: el contador, el cambio de mensaje al llegar a cero y
 * el cierre al terminar la campaña (colapsa a 0 px: sin hueco sobre el menú).
 */
export function AnnouncementBar({ announcement, labels, serverNow }: { announcement: Announcement | null; labels: Labels; serverNow: number }) {
  const reduce = useReducedMotion();
  const [now, setNow] = useState<number>(serverNow); // misma hora en servidor y cliente: sin parpadeo al hidratar
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [rotIndex, setRotIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState<number | null>(null);

  // Reloj: cada segundo solo si hay contador; si no, un único temporizador al próximo cambio.
  useEffect(() => {
    if (!announcement) return;
    setNow(Date.now());
    let timer: ReturnType<typeof setTimeout>;
    const hasCountdown = announcement.mode === "countdown";
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (hasCountdown) timer = setTimeout(tick, msToNextSecond(t));
      else if (announcement.next_change_at) timer = setTimeout(tick, Math.max(1000, Date.parse(announcement.next_change_at) - t));
    };
    timer = setTimeout(tick, hasCountdown ? msToNextSecond(Date.now()) : announcement.next_change_at ? Math.max(1000, Date.parse(announcement.next_change_at) - Date.now()) : 2 ** 31 - 1);
    return () => clearTimeout(timer);
  }, [announcement]);

  const view = viewAt(announcement, now);
  const items = view.kind === "visible" ? view.items : [];
  const countdown = view.kind === "visible" && view.countdownTarget ? formatCountdown(countdownParts(view.countdownTarget, now)) : null;

  const motion = !announcement || reduce ? "static" : items.length > 1 || announcement.motion !== "rotate" ? announcement.motion : "static";
  const isStopped = paused || hover;

  // Rotación
  useEffect(() => {
    if (motion !== "rotate" || isStopped || items.length < 2 || !announcement) return;
    const id = setInterval(() => {
      setRotIndex((i) => (!announcement.repeat && i === items.length - 1 ? i : (i + 1) % items.length));
    }, announcement.rotate_interval_seconds * 1000);
    return () => clearInterval(id);
  }, [motion, isStopped, items.length, announcement]);

  // Velocidad del marquee en px/s según la configuración.
  const measure = useCallback(() => {
    if (!trackRef.current || !announcement) return;
    setDuration(marqueeDurationSeconds(trackRef.current.scrollWidth / 2, announcement.marquee_speed));
  }, [announcement]);
  useLayoutEffect(() => {
    if (motion !== "marquee") return;
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [motion, measure, items.length]);

  if (!announcement) return null;
  const hidden = view.kind === "hidden";
  const custom = announcement.style === "custom" && announcement.bg_color && announcement.text_color
    ? { backgroundColor: announcement.bg_color, color: announcement.text_color, ["--ann-accent" as string]: announcement.text_color }
    : undefined;

  return (
    <div
      role="region"
      aria-label={labels.region}
      aria-hidden={hidden || undefined}
      className={`grid transition-[grid-template-rows] duration-[240ms] ease-[var(--ease-out)] ${hidden ? "grid-rows-[0fr]" : "grid-rows-[1fr]"}`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`relative text-[12px] font-medium uppercase tracking-[.12em] ${STYLE_CLASS[announcement.style]}`}
          style={custom}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onFocusCapture={() => setHover(true)}
          onBlurCapture={() => setHover(false)}
        >
          {motion === "marquee" && (
            <div className="marquee-mask flex h-9 items-center overflow-hidden pr-10">
              <div
                ref={trackRef}
                className="flex w-max whitespace-nowrap"
                style={{
                  animation: duration ? `dorata-marquee ${duration}s linear ${announcement.repeat ? "infinite" : "1 forwards"}` : undefined,
                  animationPlayState: isStopped ? "paused" : "running",
                }}
              >
                {[0, 1].map((copy) => (
                  <div key={copy} className="flex" aria-hidden={copy === 1 || undefined}>
                    {items.map((it, i) => {
                      const next = items[(i + 1) % items.length]!;
                      const glyph = !it.text.trim().endsWith("✦") && !next.text.trim().startsWith("✦");
                      return (
                        <span key={i} className="inline-flex items-center">
                          <ItemContent item={it} countdown={countdown} />
                          <span aria-hidden="true" className="mx-6 text-[color:var(--ann-accent)]">{glyph ? "✦" : ""}</span>
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {motion === "rotate" && (
            <div className="relative flex h-9 items-center justify-center px-10" aria-live="off">
              {items.map((it, i) => (
                <div
                  key={i}
                  aria-hidden={i !== rotIndex || undefined}
                  className={`absolute inset-x-10 flex items-center justify-center truncate transition-[opacity,transform] duration-[320ms] ease-[var(--ease-out)] ${i === rotIndex ? "opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}
                >
                  <ItemContent item={it} countdown={countdown} />
                </div>
              ))}
            </div>
          )}

          {motion === "static" && (
            <p className="flex min-h-9 flex-wrap items-center justify-center gap-x-2 px-4 py-2 text-center leading-[1.4]">
              {items.map((it, i) => (
                <span key={i} className="inline-flex items-center gap-2">
                  {i > 0 && <span aria-hidden="true" className="text-[color:var(--ann-accent)]">·</span>}
                  <ItemContent item={it} countdown={countdown} />
                </span>
              ))}
            </p>
          )}

          {motion !== "static" && (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? labels.play : labels.pause}
              aria-pressed={paused}
              className={`absolute right-0 top-0 grid h-9 w-10 place-items-center ${STYLE_CLASS[announcement.style]} border-0 before:absolute before:-inset-y-1 before:inset-x-0 before:content-['']`}
              style={custom}
            >
              {paused ? <Play aria-hidden="true" size={14} /> : <Pause aria-hidden="true" size={14} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
