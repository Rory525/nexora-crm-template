'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/requireAuth';
import { redirect } from 'next/navigation';
import { isForeignKeyError } from './deleteErrorMessage';

export async function deleteContact(contactId: string) {
  await requireAuth();

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      _count: { select: { leads: true, projects: true, documents: true } },
    },
  });

  if (!contact) return { error: 'Contact not found.' };

  const { leads, projects, documents } = contact._count;
  if (leads > 0 || projects > 0 || documents > 0) {
    const parts: string[] = [];
    if (leads > 0) parts.push(`${leads} lead${leads === 1 ? '' : 's'}`);
    if (projects > 0) parts.push(`${projects} project${projects === 1 ? '' : 's'}`);
    if (documents > 0) parts.push(`${documents} document${documents === 1 ? '' : 's'}`);
    return {
      error: `Can't delete — this contact still has ${parts.join(', ')} attached. Delete those first if you really want this contact gone.`,
    };
  }

  try {
    await prisma.contact.delete({ where: { id: contactId } });
  } catch (e) {
    if (isForeignKeyError(e)) {
      return { error: `Can't delete — this contact still has linked records attached.` };
    }
    throw e;
  }

  redirect('/contacts');
}