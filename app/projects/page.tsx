import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

const CLIENT_STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  ON_HOLD: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-slate-200 text-slate-600",
};

const STAGE_STYLES: Record<string, string> = {
  KICKOFF: "bg-blue-100 text-blue-700",
  PLANNING: "bg-blue-100 text-blue-700",
  BUILD: "bg-purple-100 text-purple-700",
  CLIENT_REVIEW: "bg-amber-100 text-amber-700",
  TESTING: "bg-purple-100 text-purple-700",
  READY_FOR_LAUNCH: "bg-orange-100 text-orange-700",
  LIVE: "bg-emerald-100 text-emerald-700",
  SUPPORT: "bg-cyan-100 text-cyan-700",
  COMPLETE: "bg-slate-200 text-slate-600",
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export default async function ProjectsList() {
  await requireAuth();

  const projects = await prisma.project.findMany({
    where: { archivedAt: null },
    include: { contact: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Nexora CRM</h1>
            <h2 className="mt-1 text-sm font-semibold uppercase tracking-wide text-indigo-600">Projects</h2>
          </div>
          <a
            href="/projects/new"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            + New Project
          </a>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Project</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Stage</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Project Fee</th>
                <th className="px-4 py-3 font-semibold">Next Action Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-indigo-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <a href={`/projects/${project.id}`} className="text-indigo-600 hover:text-indigo-800 font-semibold">
                      {project.contact.name}
                    </a>
                    {project.contact.company && (
                      <div className="text-xs text-slate-400">{project.contact.company}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{project.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${CLIENT_STATUS_STYLES[project.clientStatus] ?? "bg-slate-100 text-slate-600"}`}>
                      {project.clientStatus.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${STAGE_STYLES[project.projectStage] ?? "bg-slate-100 text-slate-600"}`}>
                      {project.projectStage.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${PRIORITY_STYLES[project.priority] ?? "bg-slate-100 text-slate-600"}`}>
                      {project.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    ${Number(project.projectFee).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {project.nextActionDue ? project.nextActionDue.toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No projects yet.
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