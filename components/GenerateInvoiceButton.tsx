"use client";

import { generateInvoiceFromMilestone } from "@/lib/actions/generateInvoiceFromMilestone";

/**
 * Small inline action for a Milestone row — no form fields needed since
 * the invoice's amount, type, and links are all derived server-side from
 * the milestone itself.
 *
 * Only render this when it makes sense: milestone.billingTrigger is true
 * AND milestone.status === "COMPLETE". The server action also guards
 * against a milestone with no invoiceAmount and against generating a
 * second invoice for the same milestone, but the UI-level condition
 * keeps the button from showing where it isn't relevant yet.
 *
 * Usage: <GenerateInvoiceButton milestoneId={milestone.id} />
 */
export default function GenerateInvoiceButton({ milestoneId }: { milestoneId: string }) {
  return (
    <form action={generateInvoiceFromMilestone}>
      <input type="hidden" name="milestoneId" value={milestoneId} />
      <button
        type="submit"
        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
      >
        Generate Invoice
      </button>
    </form>
  );
}