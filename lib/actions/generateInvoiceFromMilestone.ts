"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { InvoiceType, PaymentStatus } from "@prisma/client";
import { requireAuth } from "@/lib/requireAuth";

/**
 * Generates an Invoice directly from a completed billing-trigger Milestone
 * — collapses the previous two-step manual process (complete the
 * milestone, then separately create a matching invoice) into one action.
 *
 * All Invoice fields are derived from the Milestone itself:
 * - amount        <- milestone.invoiceAmount
 * - projectId      <- milestone.projectId
 * - milestoneId    <- milestone.id
 * - invoiceType    <- MILESTONE (fixed; this action is specifically for
 *                     milestone-triggered billing, not deposits/support/etc.)
 * - status         <- PENDING (schema default)
 * - description    <- "Milestone: <name>", so it's traceable at a glance
 *
 * Server-side guards (in addition to whatever the UI checks before
 * showing the button):
 * - Milestone must be marked as a billing trigger
 * - Milestone must have an invoiceAmount set
 * - No invoice already exists for this milestone (prevents accidental
 *   duplicates if the button gets clicked twice or shown when it
 *   shouldn't be)
 *
 * Does NOT redirect — assumes this is called from the Project detail
 * page where Milestones and Invoices are both already visible, and uses
 * revalidatePath so the new invoice shows up in the Invoices list
 * without a full navigation.
 */
export async function generateInvoiceFromMilestone(formData: FormData) {
  await requireAuth();

  const milestoneId = formData.get("milestoneId") as string;

  if (!milestoneId) {
    throw new Error("Milestone is required.");
  }

  const milestone = await prisma.milestone.findUniqueOrThrow({
    where: { id: milestoneId },
    select: {
      id: true,
      projectId: true,
      name: true,
      invoiceAmount: true,
      billingTrigger: true,
    },
  });

  if (!milestone.billingTrigger) {
    throw new Error("This milestone isn't marked as a billing trigger.");
  }

  if (milestone.invoiceAmount === null) {
    throw new Error(
      "This milestone has no invoice amount set — add one before generating an invoice."
    );
  }

  const existingInvoice = await prisma.invoice.findFirst({
    where: { milestoneId: milestone.id },
    select: { id: true },
  });

  if (existingInvoice) {
    throw new Error("An invoice has already been generated for this milestone.");
  }

  await prisma.invoice.create({
    data: {
      projectId: milestone.projectId,
      milestoneId: milestone.id,
      invoiceType: InvoiceType.MILESTONE,
      description: `Milestone: ${milestone.name}`,
      amount: milestone.invoiceAmount,
      status: PaymentStatus.PENDING,
      invoiceDate: new Date(),
    },
  });

  revalidatePath(`/projects/${milestone.projectId}`);
}