import { requireAdmin } from "@/server/admin/auth";
import { PageHeader, Pending } from "@/components/admin/ui";

export const metadata = { title: "Analítica" };

export default async function Page() {
  await requireAdmin("staff");
  return (
    <>
      <PageHeader title="Analítica" />
      <Pending phase="6">Ventas por día, categoría y canal; productos más vendidos; ticket promedio.</Pending>
    </>
  );
}
