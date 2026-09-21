import Link from "next/link";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/requireAuth";
import DeleteButton from "@/components/DeleteButton";
import { deleteContact } from "@/lib/actions/deleteContact";

export default async function ContactDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();

  const { id } = await params;

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      leads: true,
      projects: true,
      documents: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!contact) {
    notFound();
  }

  async function updateContact(formData: FormData) {
    "use server";
    await requireAuth();

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const company = formData.get("company") as string;

    if (!name?.trim() || !email?.trim()) {
      throw new Error("Name and email are required.");
    }

    await prisma.contact.update({
      where: { id },
      data: {
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        company: company?.trim() || null,
      },
    });

    revalidatePath(`/contacts/${id}`);
  }

  async function uploadDocument(formData: FormData) {
    "use server";
    await requireAuth();

    const file = formData.get("file") as File;
    const label = formData.get("label") as string;

    if (!file || file.size === 0) {
      throw new Error("Please choose a file to upload.");
    }

    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error("File is too large — please upload something under 20MB.");
    }

    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });

    await prisma.document.create({
      data: {
        contactId: id,
        fileName: file.name,
        label: label?.trim() || null,
        url: blob.url,
        fileSize: file.size,
      },
    });

    revalidatePath(`/contacts/${id}`);
  }

  async function deleteDocument(formData: FormData) {
    "use server";
    await requireAuth();

    const documentId = formData.get("documentId") as string;

    const document = await prisma.document.findUniqueOrThrow({
      where: { id: documentId },
      select: { url: true },
    });

    await del(document.url);

    await prisma.document.delete({
      where: { id: documentId },
    });

    revalidatePath(`/contacts/${id}`);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/contacts" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
          ← Back to Contacts
        </Link>

        <h1 className="mt-2 text-2xl font-bold text-slate-900">{contact.name}</h1>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Contact Info
          </h2>

          <form action={updateContact} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Name</label>
              <input
                name="name"
                type="text"
                required
                defaultValue={contact.name}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                name="email"
                type="email"
                required
                defaultValue={contact.email}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Phone</label>
              <input
                name="phone"
                type="text"
                defaultValue={contact.phone ?? ""}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Company</label>
              <input
                name="company"
                type="text"
                defaultValue={contact.company ?? ""}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Optional"
              />
            </div>

                       <button
              type="submit"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Save Changes
            </button>
          </form>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <DeleteButton
              action={deleteContact.bind(null, contact.id)}
              confirmMessage="Delete this contact? This can't be undone."
              label="Delete Contact"
            />
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Leads ({contact.leads.length})
          </h2>
          {contact.leads.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">No leads for this contact.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {contact.leads.map((lead) => (
                <li key={lead.id} className="py-2">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    {lead.stage.replace(/_/g, " ")}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Projects ({contact.projects.length})
          </h2>
          {contact.projects.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">No projects for this contact.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {contact.projects.map((project) => (
                <li key={project.id} className="py-2">
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    {project.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Documents ({contact.documents.length})
          </h2>

          {contact.documents.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">No documents uploaded yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {contact.documents.map((document) => (
                <li key={document.id} className="flex items-center justify-between py-2">
                  <div>
                    <Link
                      href={document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      {document.label || document.fileName}
                    </Link>
                    <div className="text-xs text-slate-400">
                      {document.fileName} — uploaded {document.uploadedAt.toLocaleDateString()}
                    </div>
                  </div>
                  <form action={deleteDocument}>
                    <input type="hidden" name="documentId" value={document.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-slate-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <form
            action={uploadDocument}
            className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4"
          >
            <div className="flex-1 min-w-[160px]">
              <label className="block text-sm font-medium text-slate-700">File</label>
              <input type="file" name="file" required className="mt-1 w-full text-sm" />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-sm font-medium text-slate-700">Label (optional)</label>
              <input
                type="text"
                name="label"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="e.g. Signed Service Agreement"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Upload
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}