import { PageHeader, Panel } from "@/components/admin/page";
import { Badge } from "@/components/ui/badge";
import { requireSession } from "@/lib/auth/guards";
import { permissionsForRole } from "@/lib/permissions";
import { ChangePasswordForm } from "./change-password-form";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireSession();
  const permissions = permissionsForRole(session.role);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SYSTEM"
        title="Account"
        description="Your credentials, role and effective permissions."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Identity">
          <dl className="space-y-3">
            {[
              ["Name", session.name],
              ["Email", session.email],
              ["Role", session.role],
              ["Session started", formatDateTime(new Date())],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-dim">
                  {label}
                </dt>
                <dd className="text-[12.5px] text-fg">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="Effective permissions">
          <div className="flex flex-wrap gap-1.5">
            {permissions.map((permission) => (
              <Badge key={permission} tone="muted">
                {permission}
              </Badge>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title="Change password"
        description="Changing the password signs out every active session, including this one."
      >
        <ChangePasswordForm />
      </Panel>
    </div>
  );
}
