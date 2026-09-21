'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/requireAuth';
import { revalidatePath } from 'next/cache';

export async function deleteTask(taskId: string, projectId: string) {
  await requireAuth();
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath(`/projects/${projectId}`);
}