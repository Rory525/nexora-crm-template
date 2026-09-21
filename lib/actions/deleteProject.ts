'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/requireAuth';
import { redirect } from 'next/navigation';
import { isForeignKeyError } from './deleteErrorMessage';

export async function deleteProject(projectId: string) {
  await requireAuth();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      _count: { select: { milestones: true, tasks: true, invoices: true } },
    },
  });

  if (!project) return { error: 'Project not found.' };

  const { milestones, tasks, invoices } = project._count;
  if (milestones > 0 || tasks > 0 || invoices > 0) {
    const parts: string[] = [];
    if (milestones > 0) parts.push(`${milestones} milestone${milestones === 1 ? '' : 's'}`);
    if (tasks > 0) parts.push(`${tasks} task${tasks === 1 ? '' : 's'}`);
    if (invoices > 0) parts.push(`${invoices} invoice${invoices === 1 ? '' : 's'}`);
    return {
      error: `Can't delete — this project still has ${parts.join(', ')} attached. Delete those first if you really want this project gone.`,
    };
  }

  try {
    await prisma.project.delete({ where: { id: projectId } });
  } catch (e) {
    if (isForeignKeyError(e)) {
      return { error: `Can't delete — this project still has linked records attached.` };
    }
    throw e;
  }

  redirect('/projects');
}