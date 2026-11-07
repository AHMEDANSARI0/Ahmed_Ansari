import { AdminShell } from "@/components/admin/shell";
import { ToastProvider } from "@/components/ui/toast";
import { requireSession } from "@/lib/auth/guards";
import { permissionsForRole } from "@/lib/permissions";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const permissions = permissionsForRole(session.role);

  return (
    <ToastProvider>
      <AdminShell
        admin={{ name: session.name, email: session.email, role: session.role }}
        permissions={permissions}
      >
        {children}
      </AdminShell>
    </ToastProvider>
  );
}
