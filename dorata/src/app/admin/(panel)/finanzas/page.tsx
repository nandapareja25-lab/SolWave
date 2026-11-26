import { requireAdmin } from "@/server/admin/auth";
import { PageHeader, Pending } from "@/components/admin/ui";

export const metadata = { title: "Finanzas" };

export default async function Page() {
  await requireAdmin("staff");
  return (
    <>
      <PageHeader title="Finanzas" />
      <Pending phase="6">Ingresos, costo de mercancía, ganancia bruta, gastos, valor del inventario y calculadora de precio.</Pending>
    </>
  );
}
