/** Cómo se vería el resultado en Google (aproximado), con los valores por defecto cuando los campos están vacíos. */
export function GooglePreview({ title, url, description }: { title: string; url: string; description: string }) {
  return (
    <div aria-label="Vista previa en Google" className="rounded-[4px] border border-line bg-white p-3 font-[Arial,sans-serif]">
      <p className="break-all text-[12px] text-[#4d5156]">{url}</p>
      <p className="mt-0.5 line-clamp-1 text-[18px] leading-snug text-[#1a0dab]">{title}</p>
      <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[#4d5156]">{description || "Google mostrará un fragmento de la página."}</p>
    </div>
  );
}
