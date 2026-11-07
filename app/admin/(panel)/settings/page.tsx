import { PageHeader, Panel } from "@/components/admin/page";
import { getSiteSettingsFresh } from "@/lib/services/settings";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSiteSettingsFresh();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="SYSTEM"
        title="General settings"
        description="Identity, availability, contact routing and footer configuration. Changes are cached and revalidated on save."
      />
      <Panel title="Site configuration">
        <SettingsForm initial={settings} />
      </Panel>
    </div>
  );
}
