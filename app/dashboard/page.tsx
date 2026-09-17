import { requireAuth } from "@/lib/requireAuth";
import { getDashboardData } from "@/lib/dashboard";

// ---------------------------------------------------------------------
// Local label/color maps. These are kept self-contained here rather than
// pulled from a shared badge helper, since it's unclear whether the
// Leads/Projects pages already export one. If they do, swap these out
// for the shared version to keep colors consistent app-wide.
// ---------------------------------------------------------------------

const PIPELINE_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  DISCOVERY_SCHEDULED: "Discovery Scheduled",
  PROPOSAL_SENT: "Proposal Sent",
  CLIENT: "Client",
  LOST: "Lost",
};

const PIPELINE_COLORS: Record<string, string> = {
  NEW: "bg-slate-100 text-slate-700",
  CONTACTED: "bg-blue-100 text-blue-700",
  DISCOVERY_SCHEDULED: "bg-indigo-100 text-indigo-700",
  PROPOSAL_SENT: "bg-amber-100 text-amber-700",
  CLIENT: "bg-emerald-100 text-emerald-700",
  LOST: "bg-red-100 text-red-700",
};

const TASK_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  WAITING_ON_CLIENT: "Waiting on Client",
  BLOCKED: "Blocked",
  COMPLETE: "Complete",
};

const TASK_STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  WAITING_ON_CLIENT: "bg-amber-100 text-amber-700",
  BLOCKED: "bg-red-100 text-red-700",
  COMPLETE: "bg-emerald-100 text-emerald-700",
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  OVERDUE: "Overdue",
  DISPUTED: "Disputed",
  WAIVED: "Waived",
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-red-100 text-red-700",
  DISPUTED: "bg-purple-100 text-purple-700",
  WAIVED: "bg-slate-100 text-slate-700",
};

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

// ---------------------------------------------------------------------
// Presentational pieces
// ---------------------------------------------------------------------

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

type BreakdownRow = {
  key: string;
  label: string;
  color: string;
  count: number;
  sub?: string;
};

function BreakdownCard({ title, rows }: { title: string; rows: BreakdownRow[] }) {
  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-2">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${row.color}`}>
              {row.label}
            </span>
            <span className="text-sm text-slate-600">
              {row.count}
              {row.sub ? ` · ${row.sub}` : ""}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
        {total} total
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------

export default async function DashboardPage() {
  await requireAuth();

  const data = await getDashboardData();

return (
  <div className="min-h-screen bg-white">
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        Live numbers, computed on every load — nothing here is stored.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Active Clients" value={String(data.activeClients)} />
        <StatTile label="Open Tasks" value={String(data.openTasks)} />
        <StatTile label="Outstanding A/R" value={formatCurrency(data.outstandingAR)} />
        <StatTile
          label="Monthly Support Revenue"
          value={formatCurrency(data.monthlySupportRevenue)}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BreakdownCard
          title="Client Pipeline"
          rows={data.pipelineByStage.map((g) => ({
            key: g.stage,
            label: PIPELINE_LABELS[g.stage] ?? g.stage,
            color: PIPELINE_COLORS[g.stage] ?? "bg-slate-100 text-slate-700",
            count: g.count,
          }))}
        />
        <BreakdownCard
          title="Task Status"
          rows={data.tasksByStatus.map((g) => ({
            key: g.status,
            label: TASK_STATUS_LABELS[g.status] ?? g.status,
            color: TASK_STATUS_COLORS[g.status] ?? "bg-slate-100 text-slate-700",
            count: g.count,
          }))}
        />
        <BreakdownCard
          title="Invoices by Status"
          rows={data.invoicesByStatus.map((g) => ({
            key: g.status,
            label: INVOICE_STATUS_LABELS[g.status] ?? g.status,
            color: INVOICE_STATUS_COLORS[g.status] ?? "bg-slate-100 text-slate-700",
            count: g.count,
            sub: formatCurrency(g.total),
          }))}
        />
      </div>
       </main>
  </div>
  );
}