import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

const STAGES = ["NEW", "CONTACTED", "DISCOVERY_SCHEDULED", "PROPOSAL_SENT", "CLIENT", "LOST"] as const;

export default async function LeadDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
    <main style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "600px" }}>
      <a href="/">&larr; Back to leads</a>
      <h1>{lead.contact.name}</h1>
      <p>{lead.contact.company}</p>
      <p>{lead.contact.email} {lead.contact.phone ? `· ${lead.contact.phone}` : ""}</p>

     <form action={updateStage} style={{ margin: "1rem 0" }}>
  <label>
    <strong>Stage: </strong>
    <select name="stage" defaultValue={lead.stage}>
      {STAGES.map((stage) => (
        <option key={stage} value={stage}>{stage}</option>
      ))}
    </select>
  </label>
  <button type="submit" style={{ marginLeft: "0.5rem" }}>Update</button>
</form>

      <p><strong>Source:</strong> {lead.source}</p>

      <h2>Notes</h2>
      <form action={addNote} style={{ marginBottom: "1rem" }}>
        <textarea name="body" rows={3} style={{ width: "100%" }} placeholder="Add a note..." required />
        <button type="submit">Add note</button>
      </form>

      {lead.notes.length === 0 && <p>No notes yet.</p>}
      <ul>
        {lead.notes.map((note) => (
          <li key={note.id} style={{ marginBottom: "0.5rem" }}>
            {note.body}
            <br />
            <small>{note.createdAt.toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </main>
  );
}