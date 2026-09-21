'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

type DeleteResult = { error?: string } | void;

export default function DeleteButton({
  action,
  confirmMessage,
  label = 'Delete',
}: {
  action: () => Promise<DeleteResult>;
  confirmMessage: string;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!confirm(confirmMessage)) return;
    startTransition(async () => {
      const result = await action();
      if (result && 'error' in result && result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
    >
      {isPending ? 'Deleting…' : label}
    </button>
  );
}