'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/requireAuth';
import { redirect } from 'next/navigation';
import { isForeignKeyError } from './deleteErrorMessage';

export async function deleteLead(leadId: string) {
  await requireAuth();

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { _count: { select: { projects: true } } },
  });

  if (!lead) return { error: 'Lead not found.' };

  if (lead._count.projects > 0) {
    return {
      error: `Can't delete — this lead has been converted to a project. Delete the project first if you really want this gone.`,
    };
  }

  try {
    await prisma.lead.delete({ where: { id: leadId } });
  } catch (e) {
    if (isForeignKeyError(e)) {
      return { error: `Can't delete — this lead still has linked records attached.` };
    }
    throw e;
  }

  redirect('/');
}