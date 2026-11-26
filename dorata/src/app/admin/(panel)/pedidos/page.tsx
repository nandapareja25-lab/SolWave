import { requireAdmin } from "@/server/admin/auth";
import { PageHeader, Pending } from "@/components/admin/ui";

export const metadata = { title: "Pedidos" };

export default async function Page() {
  await requireAdmin("staff");
  return (
    <>
      <PageHeader title="Pedidos" />
      <Pending phase="5">Pedidos de la web y manuales (Instagram, TikTok, WhatsApp, en persona), con estados, historial y certificados.</Pending>
    </>
  );
}
