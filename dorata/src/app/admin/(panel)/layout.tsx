import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_NAV } from "@/components/admin/nav";
import { requireAdmin } from "@/server/admin/auth";
import { signOut } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

const RANK = { staff: 1, admin: 2, owner: 3 } as const;

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = await requireAdmin("staff");
  const nav = ADMIN_NAV.filter((n) => RANK[role] >= RANK[n.min]);
  return <AdminShell nav={nav} email={user.email ?? ""} role={role} signOutAction={signOut}>{children}</AdminShell>;
}
