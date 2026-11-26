import { requireAdmin } from "@/server/admin/auth";
import { PageHeader, Pending } from "@/components/admin/ui";

export const metadata = { title: "Colecciones" };

export default async function Page() {
  await requireAdmin("staff");
  return (
    <>
      <PageHeader title="Colecciones" />
      <Pending phase="3">Agrupa piezas por tema (Sets, Navidad, Lanzamiento…) además de su categoría. Las colecciones ya existen en la base; esta pantalla llega al terminar productos.</Pending>
    </>
  );
}
