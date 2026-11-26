import { requireAdmin } from "@/server/admin/auth";
import { PageHeader, Pending } from "@/components/admin/ui";

export const metadata = { title: "Descuentos" };

export default async function Page() {
  await requireAdmin("staff");
  return (
    <>
      <PageHeader title="Descuentos" />
      <Pending phase="4">Códigos por porcentaje, monto fijo o envío gratis, con fechas, límites y categorías. El código BIENVENIDA10 ya existe, inactivo.</Pending>
    </>
  );
}
