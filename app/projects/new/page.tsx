import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { redirect } from "next/navigation";

const PROJECT_STAGES = [
  "KICKOFF", "PLANNING", "BUILD", "CLIENT_REVIEW", "TESTING",
  "READY_FOR_LAUNCH", "LIVE", "SUPPORT", "COMPLETE",
] as const;

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export default async function NewProject() {
  await requireAuth();

  const contacts = await prisma.contact.findMany({
    where: { archivedAt: null },
    orderBy: { name: "asc" },
  });

  async function createProject(formData: FormData) {
    "use server";

    const contactId = String(formData.get("contactId") || "");
    const name = String(formData.get("name") || "").trim();
    const projectStage = String(formData.get("projectStage") || "KICKOFF");
    const priority = String(formData.get("priority") || "MEDIUM");
    const projectFee = String(formData.get("projectFee") || "0");
    const supportFeeMonthly = String(formData.get("supportFeeMonthly") || "");
    const nextAction = String(formData.get("nextAction") || "").trim();
    const nextActionDueRaw = String(formData.get("nextActionDue") || "");

    if (!contactId || !name) return;

    const project = await prisma.project.create({
      data: {
        contactId,
        name,
        projectStage: projectStage as typeof PROJECT_STAGES[number],
        priority: priority as typeof PRIORITIES[number],
        projectFee,
        supportFeeMonthly: supportFeeMonthly || null,
        nextAction: nextAction || null,
        nextActionDue: nextActionDueRaw ? new Date(nextActionDueRaw) : null,
      },
    });

    redirect(`/projects/${project.id}`);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-lg mx-auto">
        <a href="/projects" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">&larr; Back to projects</a>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">New Project</h1>

          <form action={createProject} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Client *</label>
              <select
                name="contactId"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select a client...</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}{contact.company ? ` — ${contact.company}` : ""}
                  </option>
                ))}
              </select>
              {contacts.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">No contacts exist yet — create a lead first, or a contact needs to exist before you can start a project for them.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Project Name *</label>
              <input
                name="name"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Stage</label>
                <select
                  name="projectStage"
                  defaultValue="KICKOFF"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {PROJECT_STAGES.map((stage) => (
                    <option key={stage} value={stage}>{stage.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Priority</label>
                <select
                  name="priority"
                  defaultValue="MEDIUM"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Project Fee ($) *</label>
                <input
                  name="projectFee"
                  type="number"
                  step="0.01"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Monthly Support Fee ($)</label>
                <input
                  name="supportFeeMonthly"
                  type="number"
                  step="0.01"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Next Action</label>
              <input
                name="nextAction"
                placeholder="e.g. Confirm API access"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Next Action Due</label>
              <input
                name="nextActionDue"
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Create Project
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}