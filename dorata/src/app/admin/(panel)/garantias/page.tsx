import { requireAdmin } from "@/server/admin/auth";
import { PageHeader, Pending } from "@/components/admin/ui";

export const metadata = { title: "Garantías" };

export default async function Page() {
  await requireAdmin("staff");
  return (
    <>
      <PageHeader title="Garantías" />
      <Pending phase="5">Búsqueda por número de orden, solicitudes con fotos, decisión, reemplazo y resolución.</Pending>
    </>
  );
}
