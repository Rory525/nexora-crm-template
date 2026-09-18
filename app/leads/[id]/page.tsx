import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/requireAuth";
import ConvertToProjectButton from "@/components/ConvertToProjectButton";

const STAGES = ["NEW", "CONTACTED", "DISCOVERY_SCHEDULED", "PROPOSAL_SENT", "CLIENT", "LOST"] as const;

const STAGE_STYLES: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-amber-100 text-amber-700",
  DISCOVERY_SCHEDULED: "bg-purple-100 text-purple-700",
  PROPOSAL_SENT: "bg-orange-100 text-orange-700",
  CLIENT: "bg-emerald-100 text-emerald-700",
  LOST: "bg-slate-200 text-slate-600",
};

export default async function LeadDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { contact: true, notes: { orderBy: { createdAt: "desc" } } },
  });

  if (!lead) {
    notFound();
  }

  async function updateStage(formData: FormData) {
    "use server";
    const stage = formData.get("stage") as string;
    await prisma.lead.update({
      where: { id },
      data: { stage: stage as typeof STAGES[number] },
    });
    revalidatePath(`/leads/${id}`);
  }

  async function addNote(formData: FormData) {
    "use server";
    const body = formData.get("body") as string;
    if (!body?.trim()) return;
    await prisma.note.create({
      data: { leadId: id, body },
    });
    revalidatePath(`/leads/${id}`);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <a href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">&larr; Back to leads</a>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">{lead.contact.name}</h1>
          <p className="mt-1 text-slate-600">{lead.contact.company}</p>
          <p className="mt-1 text-sm text-slate-500">
            {lead.contact.email} {lead.contact.phone ? `· ${lead.contact.phone}` : ""}
          </p>

          <form action={updateStage} className="mt-5 flex items-center gap-3">
            <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${STAGE_STYLES[lead.stage] ?? "bg-slate-100 text-slate-600"}`}>
              {lead.stage.replace(/_/g, " ")}
            </span>
            <select
              name="stage"
              defaultValue={lead.stage}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {STAGES.map((stage) => (
                <option key={stage} value={stage}>{stage.replace(/_/g, " ")}</option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Update
            </button>
          </form>

          <p className="mt-4 text-sm text-slate-500">
            <span className="font-semibold text-slate-700">Source:</span> {lead.source}
          </p>
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Notes</h2>

          <form action={addNote} className="mt-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <textarea
              name="body"
              rows={3}
              required
              placeholder="Add a note..."
              className="w-full resize-none rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          
            <button
              type="submit"
              className="mt-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Add note
            </button>
          </form>
<ConvertToProjectButton leadId={lead.id} />
          {lead.notes.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No notes yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {lead.notes.map((note) => (
                <li key={note.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <p className="text-sm text-slate-700">{note.body}</p>
                  <p className="mt-1 text-xs text-slate-400">{note.createdAt.toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
        </main>
  );
}