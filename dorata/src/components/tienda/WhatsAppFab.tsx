import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/whatsapp";

/** Solo aparece cuando la dueña configuró su número (nunca un número inventado). */
export function WhatsAppFab({ e164, message }: { e164: string | null; message: string }) {
  const href = whatsappLink(e164, message);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label="Escríbenos por WhatsApp"
      className="press fixed bottom-[max(16px,env(safe-area-inset-bottom))] right-4 z-40 grid size-14 place-items-center rounded-full border border-gold bg-velvet text-gold shadow-[0_8px_24px_-8px_rgba(0,0,0,.5)]">
      <MessageCircle aria-hidden="true" size={24} strokeWidth={1.5} />
    </a>
  );
}
