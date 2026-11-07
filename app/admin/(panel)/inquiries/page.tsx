import { PageHeader } from "@/components/admin/page";
import { Badge } from "@/components/ui/badge";
import { listInquiryDetails } from "@/lib/services/inquiries";
import { InquiryTable } from "./inquiry-table";

export const dynamic = "force-dynamic";

const statuses = ["new", "contacted", "qualified", "converted", "archived"] as const;

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const status = statuses.find((value) => value === params.status);
  const { items, total } = await listInquiryDetails({ status, query: params.q?.trim() || undefined });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="OVERVIEW"
        title="Inquiries"
        description="Every submission from the contact form, with status, notes and CSV export."
        actions={<Badge tone="muted">{total} total</Badge>}
      />

      <form className="flex flex-wrap items-end gap-2" action="/admin/inquiries">
        <label className="min-w-[180px] flex-1">
          <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-fg-dim">
            Search
          </span>
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Name, email or company"
            className="h-9 w-full border border-line bg-ink px-3 text-sm text-fg placeholder:text-fg-dim focus:border-accent/70 focus:outline-none"
          />
        </label>
        <label>
          <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-fg-dim">
            Status
          </span>
          <select
            name="status"
            defaultValue={params.status ?? ""}
            className="h-9 border border-line bg-ink px-3 text-sm text-fg"
          >
            <option value="">All</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="h-9 bg-accent px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink"
        >
          Filter
        </button>
      </form>

      <InquiryTable initial={items} />
    </div>
  );
}
