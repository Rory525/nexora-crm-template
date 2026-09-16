import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

const STAGE_STYLES: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-amber-100 text-amber-700",
  DISCOVERY_SCHEDULED: "bg-purple-100 text-purple-700",
  PROPOSAL_SENT: "bg-orange-100 text-orange-700",
  CLIENT: "bg-emerald-100 text-emerald-700",
  LOST: "bg-slate-200 text-slate-600",
};

export default async function Home() {
  await requireAuth();

  const leads = await prisma.lead.findMany({
    include: { contact: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900">Nexora CRM</h1>
        <div className="mt-1 flex items-center justify-between">
  <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Leads</h2>
  <a
    href="/leads/new"
    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
  >
    + New Lead
  </a>
</div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Stage</th>
                <th className="px-4 py-3 font-semibold">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-indigo-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <a href={`/leads/${lead.id}`} className="text-indigo-600 hover:text-indigo-800 font-semibold">
                      {lead.contact.name}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{lead.contact.company}</td>
                  <td className="px-4 py-3 text-slate-600">{lead.contact.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${STAGE_STYLES[lead.stage] ?? "bg-slate-100 text-slate-600"}`}>
                      {lead.stage.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{lead.source}</td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No leads yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}