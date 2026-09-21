'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/requireAuth';
import { revalidatePath } from 'next/cache';

export async function deleteInvoice(invoiceId: string, projectId: string) {
  await requireAuth();
  await prisma.invoice.delete({ where: { id: invoiceId } });
  revalidatePath(`/projects/${projectId}`);
}