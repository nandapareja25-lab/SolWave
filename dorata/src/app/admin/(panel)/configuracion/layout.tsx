import { ConfigTabs } from "@/components/admin/ConfigTabs";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/server/admin/auth";

export default async function ConfigLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin("admin");
  return (
    <>
      <PageHeader title="Configuración" description="Todo lo que cambias aquí se aplica en la tienda sin tocar código." />
      <ConfigTabs />
      {children}
    </>
  );
}
