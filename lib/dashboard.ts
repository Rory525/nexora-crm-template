import { prisma } from "@/lib/prisma";
import { ClientStatus, PipelineStage, TaskStatus, PaymentStatus } from "@prisma/client";

/**
 * Dashboard metrics — every number here is computed live from real rows
 * on each call, per the same no-stale-numbers principle used for the
 * per-project Outstanding Balance. Nothing is cached or stored.
 *
 * ASSUMPTIONS TO VERIFY AGAINST YOUR ACTUAL schema.prisma:
 * 1. Enum names — this assumes `ClientStatus`, `PipelineStage`, `TaskStatus`,
 *    `PaymentStatus` as the generated Prisma enum names. The status doc only
 *    confirms the enum *values*, not the enum type names, so double-check
 *    these imports match what `@prisma/client` actually exports.
 * 2. `Project.supportFeeMonthly` — the status doc's roadmap section mentions
 *    "Monthly Support Revenue (computed from active projects' supportFeeMonthly)"
 *    but this field isn't listed in the Data Model section, so the exact
 *    field name/type (Decimal? Int?) needs confirming.
 * 3. "Active Clients" is defined here as the count of distinct Contacts with
 *    at least one non-archived Project where clientStatus = ACTIVE. If you
 *    intended a plain count of active Projects instead (in case a Contact
 *    ever has two simultaneous active Projects), swap the `distinct` query
 *    below for a simple `prisma.project.count(...)`.
 */

export async function getDashboardData() {
  const [
    activeClientRows,
    openTasksCount,
    outstandingInvoices,
    activeSupportProjects,
    pipelineGroups,
    taskStatusGroups,
    invoiceStatusGroups,
  ] = await Promise.all([
    // Distinct clients (Contacts) with at least one active, non-archived Project
    prisma.project.findMany({
      where: { clientStatus: ClientStatus.ACTIVE, archivedAt: null },
      select: { contactId: true },
      distinct: ["contactId"],
    }),

    // "Open" = any Task not COMPLETE, on a non-archived Project
    prisma.task.count({
      where: {
        status: { not: TaskStatus.COMPLETE },
        project: { archivedAt: null },
      },
    }),

    // Outstanding A/R = PENDING + OVERDUE invoices org-wide (non-archived projects)
    prisma.invoice.findMany({
      where: {
        status: { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE] },
        project: { archivedAt: null },
      },
      select: { amount: true },
    }),

    // Monthly Support Revenue = supportFeeMonthly summed across active projects
    prisma.project.findMany({
      where: { clientStatus: ClientStatus.ACTIVE, archivedAt: null },
      select: { supportFeeMonthly: true },
    }),

    // Pre-sale pipeline breakdown (Lead.stage), excluding archived contacts
    prisma.lead.groupBy({
      by: ["stage"],
      where: { contact: { archivedAt: null } },
      _count: { _all: true },
    }),

    // Task status breakdown, non-archived projects
    prisma.task.groupBy({
      by: ["status"],
      where: { project: { archivedAt: null } },
      _count: { _all: true },
    }),

    // Invoice/payment status breakdown, non-archived projects
    prisma.invoice.groupBy({
      by: ["status"],
      where: { project: { archivedAt: null } },
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ]);

  const outstandingAR = outstandingInvoices.reduce(
    (sum, inv) => sum + Number(inv.amount),
    0
  );

  const monthlySupportRevenue = activeSupportProjects.reduce(
    (sum, p) => sum + Number(p.supportFeeMonthly ?? 0),
    0
  );

  // Ensure every enum value shows up even at zero count, so the UI doesn't
  // silently drop a stage/status just because nothing's in it yet.
  const pipelineByStage = Object.values(PipelineStage).map((stage) => {
    const match = pipelineGroups.find((g) => g.stage === stage);
    return { stage, count: match?._count._all ?? 0 };
  });

  const tasksByStatus = Object.values(TaskStatus).map((status) => {
    const match = taskStatusGroups.find((g) => g.status === status);
    return { status, count: match?._count._all ?? 0 };
  });

  const invoicesByStatus = Object.values(PaymentStatus).map((status) => {
    const match = invoiceStatusGroups.find((g) => g.status === status);
    return {
      status,
      count: match?._count._all ?? 0,
      total: Number(match?._sum.amount ?? 0),
    };
  });

  return {
    activeClients: activeClientRows.length,
    openTasks: openTasksCount,
    outstandingAR,
    monthlySupportRevenue,
    pipelineByStage,
    tasksByStatus,
    invoicesByStatus,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;