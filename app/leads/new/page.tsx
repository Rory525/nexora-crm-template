import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/requireAuth";

const STAGES = ["NEW", "CONTACTED", "DISCOVERY_SCHEDULED", "PROPOSAL_SENT", "CLIENT", "LOST"] as const;

export default async function NewLead() {
  await requireAuth();
  async function createLead(formData: FormData) {
    "use server";

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const company = String(formData.get("company") || "").trim();
    const stage = String(formData.get("stage") || "NEW");
    const source = String(formData.get("source") || "").trim();

    if (!name || !email) return;

    const lead = await prisma.lead.create({
      data: {
        stage: stage as typeof STAGES[number],
        source: source || null,
        contact: {
          create: {
            name,
            email,
            phone: phone || null,
            company: company || null,
          },
        },
      },
    });

    redirect(`/leads/${lead.id}`);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-lg mx-auto">
        <a href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">&larr; Back to leads</a>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">New Lead</h1>

          <form action={createLead} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Name *</label>
              <input
                name="name"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Email *</label>
              <input
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Phone</label>
              <input
                name="phone"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Company</label>
              <input
                name="company"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Stage</label>
              <select
                name="stage"
                defaultValue="NEW"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {STAGES.map((stage) => (
                  <option key={stage} value={stage}>{stage.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Source</label>
              <input
                name="source"
                placeholder="e.g. Referral, Networking event, Phone call"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Create Lead
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}