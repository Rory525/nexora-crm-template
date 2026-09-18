import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import GenerateInvoiceButton from "@/components/GenerateInvoiceButton";

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

const TASK_STATUS_STYLES: Record<string, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  WAITING_ON_CLIENT: "bg-amber-100 text-amber-700",
  BLOCKED: "bg-red-100 text-red-700",
  COMPLETE: "bg-emerald-100 text-emerald-700",
};

const MILESTONE_STATUS_STYLES: Record<string, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  WAITING_ON_CLIENT: "bg-amber-100 text-amber-700",
  BLOCKED: "bg-red-100 text-red-700",
  COMPLETE: "bg-emerald-100 text-emerald-700",
};

const INVOICE_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-red-100 text-red-700",
  DISPUTED: "bg-orange-100 text-orange-700",
  WAIVED: "bg-slate-200 text-slate-600",
};

const TASK_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "WAITING_ON_CLIENT", "BLOCKED", "COMPLETE"] as const;
const MILESTONE_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "WAITING_ON_CLIENT", "BLOCKED", "COMPLETE"] as const;
const INVOICE_STATUSES = ["PENDING", "PAID", "OVERDUE", "DISPUTED", "WAIVED"] as const;
const INVOICE_TYPES = ["DEPOSIT", "MILESTONE", "SUPPORT", "FINAL", "OTHER"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      contact: true,
      tasks: { orderBy: { createdAt: "desc" } },
      milestones: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!project) {
    notFound();
  }

  async function addTask(formData: FormData) {
    "use server";
    const title = String(formData.get("title") || "").trim();
    const owner = String(formData.get("owner") || "").trim();
    const priority = String(formData.get("priority") || "MEDIUM");
    const dueDateRaw = String(formData.get("dueDate") || "");

    if (!title || !owner) return;

    await prisma.task.create({
      data: {
        projectId: id,
        title,
        owner,
        priority: priority as typeof PRIORITIES[number],
        dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      },
    });
    revalidatePath(`/projects/${id}`);
  }

  async function updateTaskStatus(formData: FormData) {
    "use server";
    const taskId = String(formData.get("taskId") || "");
    const status = String(formData.get("status") || "");
    if (!taskId || !status) return;

    await prisma.task.update({
      where: { id: taskId },
      data: { status: status as typeof TASK_STATUSES[number] },
    });
    revalidatePath(`/projects/${id}`);
  }

  async function addMilestone(formData: FormData) {
    "use server";
    const name = String(formData.get("name") || "").trim();
    const owner = String(formData.get("owner") || "").trim();
    const targetDateRaw = String(formData.get("targetDate") || "");
    const billingTrigger = formData.get("billingTrigger") === "on";
    const invoiceAmount = String(formData.get("invoiceAmount") || "");

    if (!name || !owner) return;

    await prisma.milestone.create({
      data: {
        projectId: id,
        name,
        owner,
        targetDate: targetDateRaw ? new Date(targetDateRaw) : null,
        billingTrigger,
        invoiceAmount: billingTrigger && invoiceAmount ? invoiceAmount : null,
      },
    });
    revalidatePath(`/projects/${id}`);
  }

  async function updateMilestoneStatus(formData: FormData) {
    "use server";
    const milestoneId = String(formData.get("milestoneId") || "");
    const status = String(formData.get("status") || "");
    if (!milestoneId || !status) return;

    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: status as typeof MILESTONE_STATUSES[number],
        completedDate: status === "COMPLETE" ? new Date() : null,
      },
    });
    revalidatePath(`/projects/${id}`);
  }

  async function addInvoice(formData: FormData) {
    "use server";
    const invoiceType = String(formData.get("invoiceType") || "OTHER");
    const amount = String(formData.get("amount") || "");
    const description = String(formData.get("description") || "").trim();
    const dueDateRaw = String(formData.get("dueDate") || "");
    const milestoneId = String(formData.get("milestoneId") || "");

    if (!amount) return;

    await prisma.invoice.create({
      data: {
        projectId: id,
        milestoneId: milestoneId || null,
        invoiceType: invoiceType as typeof INVOICE_TYPES[number],
        amount,
        description: description || null,
        dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      },
    });
    revalidatePath(`/projects/${id}`);
  }

  async function updateInvoiceStatus(formData: FormData) {
    "use server";
    const invoiceId = String(formData.get("invoiceId") || "");
    const status = String(formData.get("status") || "");
    if (!invoiceId || !status) return;

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: status as typeof INVOICE_STATUSES[number],
        paidDate: status === "PAID" ? new Date() : null,
      },
    });
    revalidatePath(`/projects/${id}`);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-3xl mx-auto">
        <a href="/projects" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">&larr; Back to projects</a>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
              <p className="mt-1 text-slate-600">
                {project.contact.name}{project.contact.company ? ` — ${project.contact.company}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${CLIENT_STATUS_STYLES[project.clientStatus] ?? "bg-slate-100 text-slate-600"}`}>
                {project.clientStatus.replace(/_/g, " ")}
              </span>
              <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${STAGE_STYLES[project.projectStage] ?? "bg-slate-100 text-slate-600"}`}>
                {project.projectStage.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-slate-700">Priority:</span> {project.priority}
            </div>
            <div>
              <span className="font-semibold text-slate-700">Project Fee:</span> ${Number(project.projectFee).toLocaleString()}
            </div>
            {project.supportFeeMonthly && (
              <div>
                <span className="font-semibold text-slate-700">Monthly Support:</span> ${Number(project.supportFeeMonthly).toLocaleString()}/mo
              </div>
            )}
            {project.nextAction && (
              <div>
                <span className="font-semibold text-slate-700">Next Action:</span> {project.nextAction}
              </div>
            )}
            {project.nextActionDue && (
              <div>
                <span className="font-semibold text-slate-700">Due:</span> {project.nextActionDue.toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Milestones</h2>

          <form action={addMilestone} className="mt-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                name="name"
                placeholder="Milestone name"
                required
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                name="owner"
                placeholder="Owner"
                required
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 items-center">
              <input
                name="targetDate"
                type="date"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                name="invoiceAmount"
                type="number"
                step="0.01"
                placeholder="Invoice amount (if billing trigger)"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="billingTrigger" className="rounded border-slate-300" />
              This milestone triggers billing
            </label>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Add Milestone
            </button>
          </form>

          {project.milestones.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No milestones yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {project.milestones.map((milestone) => (
                                <li key={milestone.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {milestone.name}
                      {milestone.billingTrigger && (
                        <span className="ml-2 text-xs font-semibold text-indigo-600">💰 Billing trigger</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      {milestone.owner}
                      {milestone.targetDate ? ` · Target ${milestone.targetDate.toLocaleDateString()}` : ""}
                      {milestone.invoiceAmount ? ` · $${Number(milestone.invoiceAmount).toLocaleString()}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                  <form action={updateMilestoneStatus} className="flex items-center gap-2">
                    <input type="hidden" name="milestoneId" value={milestone.id} />
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${MILESTONE_STATUS_STYLES[milestone.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {milestone.status.replace(/_/g, " ")}
                    </span>
                    <select
                      name="status"
                      defaultValue={milestone.status}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {MILESTONE_STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                    >
                        Update
                      </button>
                    </form>
                    {milestone.billingTrigger &&
                      milestone.status === "COMPLETE" &&
                      !project.invoices.some((inv) => inv.milestoneId === milestone.id) && (
                        <GenerateInvoiceButton milestoneId={milestone.id} />
                      )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
 
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Tasks</h2>

          <form action={addTask} className="mt-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                name="title"
                placeholder="Task title"
                required
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                name="owner"
                placeholder="Owner"
                required
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                name="priority"
                defaultValue="MEDIUM"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input
                name="dueDate"
                type="date"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Add Task
            </button>
          </form>

          {project.tasks.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No tasks yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {project.tasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{task.title}</p>
                    <p className="text-xs text-slate-400">
                      {task.owner} · {task.priority}
                      {task.dueDate ? ` · Due ${task.dueDate.toLocaleDateString()}` : ""}
                    </p>
                  </div>
                  <form action={updateTaskStatus} className="flex items-center gap-2">
                    <input type="hidden" name="taskId" value={task.id} />
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${TASK_STATUS_STYLES[task.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {task.status.replace(/_/g, " ")}
                    </span>
                    <select
                      name="status"
                      defaultValue={task.status}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {TASK_STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                    >
                      Update
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Invoices</h2>

          <form action={addInvoice} className="mt-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <select
                name="invoiceType"
                defaultValue="OTHER"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {INVOICE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                name="amount"
                type="number"
                step="0.01"
                placeholder="Amount ($)"
                required
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <input
              name="description"
              placeholder="Description"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                name="dueDate"
                type="date"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <select
                name="milestoneId"
                defaultValue=""
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">No linked milestone</option>
                {project.milestones.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Add Invoice
            </button>
          </form>

          {project.invoices.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No invoices yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {project.invoices.map((invoice) => (
                <li key={invoice.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {invoice.invoiceType.replace(/_/g, " ")} · ${Number(invoice.amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">
                      {invoice.description || "No description"}
                      {invoice.dueDate ? ` · Due ${invoice.dueDate.toLocaleDateString()}` : ""}
                    </p>
                  </div>
                  <form action={updateInvoiceStatus} className="flex items-center gap-2">
                    <input type="hidden" name="invoiceId" value={invoice.id} />
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${INVOICE_STATUS_STYLES[invoice.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {invoice.status}
                    </span>
                    <select
                      name="status"
                      defaultValue={invoice.status}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {INVOICE_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                    >
                      Update
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm">
            <span className="font-semibold text-slate-700">Outstanding Balance:</span>{" "}
            <span className="text-lg font-bold text-slate-900">
              ${project.invoices
                .filter((inv) => inv.status === "PENDING" || inv.status === "OVERDUE")
                .reduce((sum, inv) => sum + Number(inv.amount), 0)
                .toLocaleString()}
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}