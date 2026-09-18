import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export default async function ContactsList() {
  await requireAuth();

  const contacts = await prisma.contact.findMany({
    where: { archivedAt: null },
    include: {
      _count: {
        select: { leads: true, projects: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Nexora CRM</h1>
            <h2 className="mt-1 text-sm font-semibold uppercase tracking-wide text-indigo-600">
              Contacts
            </h2>
          </div>
          <Link
            href="/contacts/new"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            + New Contact
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Leads</th>
                <th className="px-4 py-3 font-semibold">Projects</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-indigo-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      {contact.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{contact.company ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{contact.email}</td>
                  <td className="px-4 py-3 text-slate-600">{contact.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{contact._count.leads}</td>
                  <td className="px-4 py-3 text-slate-600">{contact._count.projects}</td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No contacts yet.
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