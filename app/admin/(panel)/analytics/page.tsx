import { PageHeader, Panel, StatCard } from "@/components/admin/page";
import { AnalyticsExclusion } from "@/components/admin/analytics-exclusion";
import { getAnalyticsSummary, type AnalyticsWindow } from "@/lib/services/analytics";
import { getSiteSettingsFresh } from "@/lib/services/settings";

export const dynamic = "force-dynamic";

const windows: AnalyticsWindow[] = [7, 30, 90];

function Sparkline({ points }: { points: number[] }) {
  if (points.length === 0) {
    return <p className="py-6 text-center text-[11px] text-fg-dim">No views recorded in this window.</p>;
  }

  // A single day still reads as a flat line rather than an empty state.
  const series = points.length === 1 ? [points[0]!, points[0]!] : points;
  const max = Math.max(...series, 1);
  const width = 100;
  const height = 32;
  const step = width / (series.length - 1);

  const path = series
    .map((value, index) => `${index === 0 ? "M" : "L"}${(index * step).toFixed(2)},${(height - (value / max) * height).toFixed(2)}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full" preserveAspectRatio="none" role="img" aria-label="Daily page views">
      <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const requested = Number(params.days);
  const days = windows.includes(requested as AnalyticsWindow) ? (requested as AnalyticsWindow) : 30;
  const [summary, settings] = await Promise.all([getAnalyticsSummary(days), getSiteSettingsFresh()]);

  const deviceTotal = summary.devices.reduce((sum, entry) => sum + entry.views, 0) || 1;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="OVERVIEW"
        title="Analytics"
        description="First-party page views. No cookies, no third-party scripts: visitors are counted with a hash that rotates daily."
        actions={
          <div className="flex gap-1">
            {windows.map((value) => (
              <a
                key={value}
                href={`/admin/analytics?days=${value}`}
                className={`inline-flex h-8 items-center px-3 font-mono text-[10px] uppercase tracking-[0.14em] ${
                  days === value ? "bg-accent text-ink" : "border border-line text-fg-muted hover:text-accent"
                }`}
              >
                {value}d
              </a>
            ))}
          </div>
        }
      />

      {!summary.configured ? (
        <p className="border border-dashed border-line px-6 py-12 text-center text-sm text-fg-muted">
          Analytics requires a configured database.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Page views" value={summary.views.toLocaleString()} hint={`last ${days} days`} />
            <StatCard label="Visitors" value={summary.visitors.toLocaleString()} hint="daily rotating hash" />
            <StatCard
              label="Avg views / visitor"
              value={summary.visitors > 0 ? (summary.views / summary.visitors).toFixed(1) : "0"}
            />
          </div>

          <Panel title="Traffic">
            <div className="px-4 py-3">
              <Sparkline points={summary.byDay.map((entry) => entry.views)} />
            </div>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Top pages">
              <ul className="divide-y divide-line">
                {summary.topPaths.length === 0 ? (
                  <li className="px-4 py-6 text-center text-[11.5px] text-fg-dim">No views recorded yet.</li>
                ) : (
                  summary.topPaths.map((entry) => (
                    <li key={entry.path} className="flex items-center justify-between gap-3 px-4 py-2">
                      <span className="truncate font-mono text-[11px] text-fg-muted">{entry.path}</span>
                      <span className="font-mono text-[11px] tabular-nums text-fg">{entry.views}</span>
                    </li>
                  ))
                )}
              </ul>
            </Panel>

            <Panel title="Referrers">
              <ul className="divide-y divide-line">
                {summary.referrers.length === 0 ? (
                  <li className="px-4 py-6 text-center text-[11.5px] text-fg-dim">Nothing yet.</li>
                ) : (
                  summary.referrers.map((entry) => (
                    <li key={entry.host} className="flex items-center justify-between gap-3 px-4 py-2">
                      <span className="truncate font-mono text-[11px] text-fg-muted">{entry.host}</span>
                      <span className="font-mono text-[11px] tabular-nums text-fg">{entry.views}</span>
                    </li>
                  ))
                )}
              </ul>
            </Panel>

            <Panel title="Devices">
              <ul className="divide-y divide-line">
                {summary.devices.length === 0 ? (
                  <li className="px-4 py-6 text-center text-[11.5px] text-fg-dim">Nothing yet.</li>
                ) : (
                  summary.devices.map((entry) => (
                    <li key={entry.category} className="px-4 py-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-fg-muted">
                          {entry.category}
                        </span>
                        <span className="font-mono text-[11px] tabular-nums text-fg">
                          {Math.round((entry.views / deviceTotal) * 100)}%
                        </span>
                      </div>
                      <div className="mt-1 h-1 w-full bg-line">
                        <div
                          className="h-1 bg-accent"
                          style={{ width: `${Math.round((entry.views / deviceTotal) * 100)}%` }}
                        />
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </Panel>
          </div>

          <AnalyticsExclusion exclusions={settings.analytics.excludedVisitors} />

          <p className="text-[11px] leading-relaxed text-fg-dim">
            Retention: rows are plain page views, no personal data. Prune the table periodically with
            <code className="mx-1 text-fg-muted">delete from analytics_events where created_at &lt; now() - interval &apos;180 days&apos;</code>
            if you want a hard 180 day window.
          </p>
        </>
      )}
    </div>
  );
}
