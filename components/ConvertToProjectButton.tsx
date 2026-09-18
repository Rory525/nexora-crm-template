"use client";

import { useState } from "react";
import { convertLeadToProject } from "@/lib/actions/convertLeadToProject";

export default function ConvertToProjectButton({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Convert to Project
      </button>
    );
  }

  return (
    <form
      action={convertLeadToProject}
      className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <input type="hidden" name="leadId" value={leadId} />

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Project Name
        </label>
        <input
          name="name"
          type="text"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="e.g. Acme Co. Website Rebuild"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Project Fee ($)
        </label>
        <input
          name="projectFee"
          type="number"
          step="0.01"
          min="0"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="0.00"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Create Project
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}