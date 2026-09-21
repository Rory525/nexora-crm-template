'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/requireAuth';
import { revalidatePath } from 'next/cache';

export async function deleteMilestone(milestoneId: string, projectId: string) {
  await requireAuth();
  await prisma.milestone.delete({ where: { id: milestoneId } });
  revalidatePath(`/projects/${projectId}`);
}