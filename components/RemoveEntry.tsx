"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RemoveEntry({ eventId, type }: { eventId: string; type: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function remove(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return setError("Not signed in"); }

    // Removal is itself recorded (insert-only table); the entry is hidden, not erased
    const { error } = await supabase.from("event_removals").insert({
      patient_id: user.id, event_id: eventId, reason,
    });
    if (error) { setSaving(false); return setError(error.message); }

    // Medicines / lab values created by this entry no longer apply
    if (type === "prescription") await supabase.from("medications").delete().eq("event_id", eventId);
    if (type === "lab") await supabase.from("lab_results").delete().eq("event_id", eventId);

    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/10"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-3.5 w-3.5"
        >
          <path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Remove
      </button>
    );
  }

  return (
    <form
      onSubmit={remove}
      className="mt-4 space-y-4 rounded-xl border border-red-200 bg-red-50/60 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
          >
            <path d="M12 9v4m0 3h.01" strokeLinecap="round" />
            <path d="M10.3 4.7 2.9 17.5A1.7 1.7 0 0 0 4.4 20h15.2a1.7 1.7 0 0 0 1.5-2.5L13.7 4.7a2 2 0 0 0-3.4 0Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900">
            Remove this entry?
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            This entry will be hidden from your timeline and from doctors. The
            removal and its reason are kept in your audit trail.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`removal-reason-${eventId}`}
          className="block text-sm font-semibold text-slate-700"
        >
          Reason for removal
        </label>
        <input
          id={`removal-reason-${eventId}`}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="e.g. Added by mistake"
          required
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 animate-spin"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="3"
                opacity="0.25"
              />
              <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          )}
          {saving ? "Removing..." : "Confirm removal"}
        </button>

        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={saving}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-500/10 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}