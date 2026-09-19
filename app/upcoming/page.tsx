import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

const KIND_STYLES: Record<string, string> = {
  Task: "bg-blue-100 text-blue-700",
  Milestone: "bg-purple-100 text-purple-700",
  Project: "bg-amber-100 text-amber-700",
};

export default async function UpcomingPage() {
  await requireAuth();

  const [tasks, milestones, projects] = await Promise.all([
    prisma.task.findMany({
      where: {
        dueDate: { not: null },
        status: { not: "COMPLETE" },
        project: { archivedAt: null },
      },
      include: { project: { include: { contact: true } } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.milestone.findMany({
      where: {
        targetDate: { not: null },
        status: { not: "COMPLETE" },
        project: { archivedAt: null },
      },
      include: { project: { include: { contact: true } } },
      orderBy: { targetDate: "asc" },
    }),
    prisma.project.findMany({
      where: {
        nextActionDue: { not: null },
        archivedAt: null,
      },
      include: { contact: true },
      orderBy: { nextActionDue: "asc" },
    }),
  ]);

  type UpcomingItem = {
    date: Date;
    kind: "Task" | "Milestone" | "Project";
    title: string;
    projectName: string;
    clientName: string;
    projectId: string;
  };

  const items: UpcomingItem[] = [
    ...tasks.map((task) => ({
      date: task.dueDate as Date,
      kind: "Task" as const,
      title: task.title,
      projectName: task.project.name,
      clientName: task.project.contact.name,
      projectId: task.projectId,
    })),
    ...milestones.map((milestone) => ({
      date: milestone.targetDate as Date,
      kind: "Milestone" as const,
      title: milestone.name,
      projectName: milestone.project.name,
      clientName: milestone.project.contact.name,
      projectId: milestone.projectId,
    })),
    ...projects.map((project) => ({
      date: project.nextActionDue as Date,
      kind: "Project" as const,
      title: "Next Action Due",
      projectName: project.name,
      clientName: project.contact.name,
      projectId: project.id,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900">Nexora CRM</h1>
        <h2 className="mt-1 text-sm font-semibold uppercase tracking-wide text-indigo-600">
          Upcoming
        </h2>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-slate-400">Nothing upcoming.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((item, index) => {
                const isOverdue = item.date < today;
                return (
                  <li
                    key={index}
                    className="flex items-center justify-between px-4 py-3 hover:bg-indigo-50/60 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${KIND_STYLES[item.kind]}`}
                        >
                          {item.kind}
                        </span>
                        <Link
                          href={`/projects/${item.projectId}`}
                          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          {item.title}
                        </Link>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {item.clientName} — {item.projectName}
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${isOverdue ? "text-red-600" : "text-slate-500"}`}>
                      {item.date.toLocaleDateString()}
                      {isOverdue && <span className="ml-1 text-xs">(overdue)</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}