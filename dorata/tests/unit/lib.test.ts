import { describe, expect, it } from "vitest";
import fixture from "./fixture-announcement.json";
import { formatUSD, discountPercent } from "@/lib/money";
import { countdownParts, formatCountdown, msToNextSecond } from "@/lib/countdown";
import { announcementSchema, viewAt, contrastRatio, marqueeDurationSeconds } from "@/lib/announcement";
import { decideRoute } from "@/lib/store-mode";
import { applyGpc, categoriesFor, consentRecordSchema, needsPrompt, parseConsent, serializeConsent } from "@/lib/consent";
import { renderMarkdown } from "@/lib/markdown";
import { whatsappLink } from "@/lib/whatsapp";

describe("dinero", () => {
  it("formatea centavos en USD", () => {
    expect(formatUSD(5999)).toBe("$59.99");
    expect(formatUSD(0)).toBe("$0.00");
    expect(() => formatUSD(59.99)).toThrow();
  });
  it("descuento nunca exagera", () => {
    expect(discountPercent(6400, 7800)).toBe(17); // 17.9 → 17
    expect(discountPercent(6400, null)).toBeNull();
    expect(discountPercent(6400, 6400)).toBeNull();
  });
});

describe("cuenta regresiva", () => {
  const target = "2026-12-02T05:00:00Z"; // 2-dic 00:00 Nueva York
  it("formatea días y reloj", () => {
    const now = Date.parse(target) - (5 * 86400 + 4 * 3600 + 32 * 60 + 18) * 1000;
    expect(formatCountdown(countdownParts(target, now))).toBe("5 días · 04:32:18");
    expect(formatCountdown(countdownParts(target, Date.parse(target) - 86_400_000 - 9000))).toBe("1 día · 00:00:09");
    expect(formatCountdown(countdownParts(target, Date.parse(target) - 9000))).toBe("00:00:09");
  });
  it("llega a cero y no se vuelve negativa", () => {
    const p = countdownParts(target, Date.parse(target) + 5000);
    expect(p.done).toBe(true);
    expect(formatCountdown(p)).toBe("00:00:00");
  });
  it("se sincroniza al segundo exacto", () => {
    expect(msToNextSecond(1_000_250)).toBe(750);
  });
});

describe("banner de anuncios", () => {
  const a = announcementSchema.parse(fixture); // respuesta REAL de current_announcement() (lanzamiento)
  const target = Date.parse(a.countdown_target_at!);
  it("antes del lanzamiento: contador + mensaje", () => {
    const v = viewAt(a, target - 60_000);
    expect(v.kind).toBe("visible");
    if (v.kind === "visible") {
      expect(v.countdownTarget).toBe(a.countdown_target_at);
      expect(v.items.map((i) => i.text)).toEqual(["Faltan {countdown}", "✦ LANZAMIENTO D'ORATA · 2 DE DICIEMBRE · MUY PRONTO ✦"]);
    }
  });
  it("al llegar a cero cambia solo a 'ya disponible'", () => {
    const v = viewAt(a, target);
    expect(v).toEqual({ kind: "visible", countdownTarget: null, items: [a.after] });
  });
  it("con comportamiento 'ocultar' desaparece sin hueco", () => {
    expect(viewAt({ ...a, after: null }, target).kind).toBe("hidden");
  });
  it("al pasar la fecha de fin desaparece", () => {
    expect(viewAt({ ...a, ends_at: "2026-11-30T00:00:00Z" }, Date.parse("2026-11-30T00:00:01Z")).kind).toBe("hidden");
    expect(viewAt(null, Date.now()).kind).toBe("hidden");
  });
  it("velocidad del marquee en px/s", () => {
    expect(marqueeDurationSeconds(720, 36)).toBe(20);
    expect(marqueeDurationSeconds(40, 200)).toBe(4); // mínimo legible
  });
  it("contraste de los estilos de marca ≥ 4.5", () => {
    expect(contrastRatio("#FAF6EF", "#1C1915")).toBeGreaterThan(4.5); // negro
    expect(contrastRatio("#1C1915", "#C9A45C")).toBeGreaterThan(4.5); // dorado
    expect(contrastRatio("#1C1915", "#F2EADB")).toBeGreaterThan(4.5); // crema
    expect(contrastRatio("#8A6628", "#FAF6EF")).toBeGreaterThan(4.5); // dorado de texto sobre marfil
    expect(contrastRatio("#C9A45C", "#FFFFFF")).toBeLessThan(4.5);    // dorado claro sobre blanco: prohibido para texto
  });
});

describe("modo de la tienda", () => {
  const legal = (p: string) => ["/privacidad", "/cookies", "/terminos-y-condiciones"].includes(p);
  it("tienda activa: todo normal y Próximamente redirige al inicio", () => {
    expect(decideRoute("live", "/cadenas/cadena-singapur", false, legal)).toEqual({ action: "next" });
    expect(decideRoute("live", "/proximamente", false, legal)).toEqual({ action: "redirect", to: "/" });
  });
  it("Próximamente: la tienda se tapa, las legales no", () => {
    expect(decideRoute("coming_soon", "/", false, legal)).toEqual({ action: "rewrite", to: "/proximamente" });
    expect(decideRoute("coming_soon", "/cadenas", false, legal)).toEqual({ action: "rewrite", to: "/proximamente" });
    expect(decideRoute("coming_soon", "/privacidad", false, legal)).toEqual({ action: "next" });
    expect(decideRoute("coming_soon", "/proximamente/", false, legal)).toEqual({ action: "next" });
  });
  it("Mantenimiento", () => {
    expect(decideRoute("maintenance", "/", false, legal)).toEqual({ action: "rewrite", to: "/mantenimiento" });
    expect(decideRoute("maintenance", "/proximamente", false, legal)).toEqual({ action: "rewrite", to: "/mantenimiento" });
  });
  it("con vista previa la dueña ve la tienda real", () => {
    expect(decideRoute("coming_soon", "/", true, legal)).toEqual({ action: "next" });
  });
});

describe("consentimiento de cookies", () => {
  const c = { v: "1.0", id: "7f6b0a4e-2a51-4d5c-9b0e-3f3f1c1b2a10", a: true, m: false, p: false, t: 1764000000000 };
  it("ida y vuelta de la cookie; basura = sin consentimiento", () => {
    expect(parseConsent(serializeConsent(c))).toEqual(c);
    expect(parseConsent("%7Bmal")).toBeNull();
    expect(parseConsent(encodeURIComponent(JSON.stringify({ ...c, id: "no-uuid" })))).toBeNull();
  });
  it("vuelve a preguntar si cambia la versión de la política", () => {
    expect(needsPrompt(null, "1.0")).toBe(true);
    expect(needsPrompt(c, "1.0")).toBe(false);
    expect(needsPrompt(c, "1.1")).toBe(true);
  });
  it("GPC apaga marketing siempre", () => {
    expect(applyGpc(categoriesFor("accept_all"), true)).toEqual({ analytics: true, marketing: false, personalization: true });
  });
  it("registro coherente (igual que los CHECK de la base)", () => {
    const base = { subject_id: c.id, gpc: false, policy_version: "1.0" };
    expect(consentRecordSchema.safeParse({ ...base, action: "reject_all", analytics: true, marketing: false, personalization: false }).success).toBe(false);
    expect(consentRecordSchema.safeParse({ ...base, action: "custom", analytics: true, marketing: true, personalization: false, gpc: true }).success).toBe(false);
    expect(consentRecordSchema.safeParse({ ...base, action: "accept_all", analytics: true, marketing: true, personalization: true }).success).toBe(true);
  });
});

describe("markdown de políticas", () => {
  it("no permite HTML ni scripts", () => {
    const html = renderMarkdown('## Hola\n<script>alert(1)</script>\n[x](javascript:alert(1))');
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain('href="javascript');
  });
  it("títulos, listas, citas, negrita y enlaces seguros", () => {
    const html = renderMarkdown("## Qué cubre\n- Piscina\n- **Mar**\n\n> [REQUIERE REVISIÓN LEGAL]\n\nVer [garantía](/garantia).");
    expect(html).toContain("<h2>Qué cubre</h2>");
    expect(html).toContain("<li><strong>Mar</strong></li>");
    expect(html).toContain("<blockquote>[REQUIERE REVISIÓN LEGAL]</blockquote>");
    expect(html).toContain('<a href="/garantia">garantía</a>');
  });
});

describe("WhatsApp", () => {
  it("solo con número válido", () => {
    expect(whatsappLink("+13055550100", "Hola, me interesa la Cadena Singapur")).toBe(
      "https://wa.me/13055550100?text=Hola%2C%20me%20interesa%20la%20Cadena%20Singapur");
    expect(whatsappLink("305-555", "x")).toBeNull();
    expect(whatsappLink(null)).toBeNull();
  });
});

import { definedByDuration, formatWarranty } from "@/lib/warranty";
describe("garantías", () => {
  it("formatea duración y 'por definir'", () => {
    expect(formatWarranty(12)).toBe("1 año");
    expect(formatWarranty(60)).toBe("5 años");
    expect(formatWarranty(6)).toBe("6 meses");
    expect(formatWarranty(null)).toBe("por definir");
  });
  it("solo políticas definidas, ordenadas", () => {
    const r = definedByDuration([{ months: 60 }, { months: null }, { months: 12 }]);
    expect(r.map((p) => p.months)).toEqual([12, 60]);
  });
});

import { averageColor, checkImage, mediaPaths, plannedWidths, scaledSize } from "@/lib/images";
describe("fotos de producto", () => {
  it("valida tipo, peso y tamaño mínimo", () => {
    expect(checkImage({ type: "image/jpeg", size: 1000 })).toEqual({ ok: true });
    expect(checkImage({ type: "image/gif", size: 1000 })).toEqual({ ok: false, reason: "type" });
    expect(checkImage({ type: "image/png", size: 30 * 1024 * 1024 })).toEqual({ ok: false, reason: "size" });
    expect(checkImage({ type: "image/png", size: 1 }, { width: 500, height: 900 })).toEqual({ ok: false, reason: "too_small" });
  });
  it("nunca agranda la foto original", () => {
    expect(plannedWidths(3000)).toEqual([400, 800, 1600]);
    expect(plannedWidths(1000)).toEqual([400, 800]);
    expect(plannedWidths(300)).toEqual([400]);
    expect(scaledSize(3000, 4000, 800)).toEqual({ width: 800, height: 1067 });
    expect(scaledSize(600, 600, 800)).toEqual({ width: 600, height: 600 });
  });
  it("rutas dentro de la carpeta del producto", () => {
    const pid = "b4533810-079e-4b23-9f48-3f5f2edf0f16", iid = "7f6b0a4e-2a51-4d5c-9b0e-3f3f1c1b2a10";
    const r = mediaPaths(pid, iid, [400, 800, 1600]);
    expect(r.storagePath).toBe(`${pid}/${iid}-1600.webp`);
    expect(r.variants["800"]).toBe(`${pid}/${iid}-800.webp`);
    expect(() => mediaPaths("../otro", iid, [400])).toThrow();
  });
  it("color dominante", () => {
    const px = new Uint8ClampedArray(64).fill(0).map((_, i) => (i % 4 === 3 ? 255 : i % 4 === 0 ? 200 : 100));
    expect(averageColor(px)).toBe("#C86464");
  });
});

import { utcToWallTime, wallTimeToUtc } from "@/lib/tz";
describe("zonas horarias", () => {
  it("2-dic 00:00 Nueva York = 05:00 UTC (horario de invierno)", () => {
    expect(wallTimeToUtc("2026-12-02T00:00", "America/New_York")).toBe("2026-12-02T05:00:00.000Z");
  });
  it("julio en Nueva York = UTC-4 (horario de verano)", () => {
    expect(wallTimeToUtc("2026-07-04T12:00", "America/New_York")).toBe("2026-07-04T16:00:00.000Z");
  });
  it("ida y vuelta para el formulario", () => {
    expect(utcToWallTime("2026-12-02T05:00:00.000Z", "America/New_York")).toBe("2026-12-02T00:00");
    expect(utcToWallTime("2026-12-02T05:00:00.000Z", "America/Los_Angeles")).toBe("2026-12-01T21:00");
  });
  it("texto inválido", () => { expect(wallTimeToUtc("mañana", "America/New_York")).toBeNull(); });
});
