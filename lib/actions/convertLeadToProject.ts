"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PipelineStage } from "@prisma/client";
import { requireAuth } from "@/lib/requireAuth";

/**
 * Converts a Lead into a Project in one step: pulls the Contact off the
 * existing Lead (no re-typing contact info), creates the Project linked
 * to both, flips the Lead's stage to CLIENT, and redirects straight to
 * the new Project's detail page.
 *
 * DESIGN CHOICE: auto-flipping the Lead to CLIENT on conversion. This
 * matches "convert to project" implying the deal is closed, but if you'd
 * rather leave the Lead's stage alone (e.g. you sometimes create a
 * Project before the paperwork is fully signed), just delete the
 * prisma.lead.update call below.
 *
 * Only asks for the two fields Project actually requires beyond the
 * Contact link — `name` and `projectFee` — everything else on Project
 * (clientStatus, projectStage, priority, etc.) uses its schema default
 * and can be filled in from the Project detail page afterward.
 */
export async function convertLeadToProject(formData: FormData) {
  await requireAuth();

  const leadId = formData.get("leadId") as string;
  const name = formData.get("name") as string;
  const projectFeeRaw = formData.get("projectFee") as string;

  if (!leadId || !name?.trim() || !projectFeeRaw) {
    throw new Error("Lead, project name, and project fee are all required.");
  }

  const projectFee = Number(projectFeeRaw);
  if (Number.isNaN(projectFee) || projectFee < 0) {
    throw new Error("Project fee must be a valid, non-negative number.");
  }

  const lead = await prisma.lead.findUniqueOrThrow({
    where: { id: leadId },
    select: { id: true, contactId: true },
  });

  const project = await prisma.project.create({
    data: {
      contactId: lead.contactId,
      leadId: lead.id,
      name: name.trim(),
      projectFee,
    },
  });

  await prisma.lead.update({
    where: { id: lead.id },
    data: { stage: PipelineStage.CLIENT },
  });

  redirect(`/projects/${project.id}`);
}