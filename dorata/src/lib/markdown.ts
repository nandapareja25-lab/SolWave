/**
 * Markdown MÍNIMO y SEGURO para políticas editables (##, ###, párrafos, listas, citas, **negrita**, [enlaces]).
 * Primero se escapa TODO el HTML; luego se aplican solo las marcas permitidas. Sin HTML crudo.
 */
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function inline(s: string): string {
  let out = escapeHtml(s);
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\[([^\]]+)\]\(((?:https:\/\/|\/)[^\s)]*)\)/g, (_m, text: string, href: string) =>
    `<a href="${href}"${href.startsWith("https://") ? ' rel="noopener noreferrer" target="_blank"' : ""}>${text}</a>`);
  return out;
}

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let list: string[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) { html.push(`<p>${inline(para.join(" "))}</p>`); para = []; }
    if (list.length) { html.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join("")}</ul>`); list = []; }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flush(); continue; }
    const h = /^(#{2,3})\s+(.*)$/.exec(line);
    if (h) { flush(); const lvl = h[1]!.length; html.push(`<h${lvl}>${inline(h[2]!)}</h${lvl}>`); continue; }
    const li = /^[-*]\s+(.*)$/.exec(line);
    if (li) { if (para.length) { html.push(`<p>${inline(para.join(" "))}</p>`); para = []; } list.push(li[1]!); continue; }
    const q = /^>\s?(.*)$/.exec(line);
    if (q) { flush(); html.push(`<blockquote>${inline(q[1]!)}</blockquote>`); continue; }
    if (list.length) flush();
    para.push(line.trim());
  }
  flush();
  return html.join("\n");
}
