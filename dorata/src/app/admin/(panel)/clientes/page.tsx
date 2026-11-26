import { requireAdmin } from "@/server/admin/auth";
import { PageHeader, Pending } from "@/components/admin/ui";

export const metadata = { title: "Clientes" };

export default async function Page() {
  await requireAdmin("staff");
  return (
    <>
      <PageHeader title="Clientes" />
      <Pending phase="5">Ficha de cada clienta: datos de contacto, pedidos, gasto total, garantías y notas internas.</Pending>
    </>
  );
}
