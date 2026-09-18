import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/requireAuth";

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
      </div>
    </main>
  );
}