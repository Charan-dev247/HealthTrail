"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Ev = {
  id: string; type: string; category: string; title: string;
  doctor_name: string | null; provider: string | null;
  event_date: string; notes: string | null; file_path?: string | null;
};

export default function CorrectEntry({ event }: { event: Ev }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(event.event_date);
  const [notes, setNotes] = useState(event.notes ?? "");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return setError("Not signed in"); }

    // A correction is a NEW entry pointing to the old one; the old one is never changed
    const { error } = await supabase.from("events").insert({
      patient_id: user.id,
      type: event.type,
      category: event.category,
      title: title.includes("(corrected)") ? title : `${title} (corrected)`,
      doctor_name: event.doctor_name,
      provider: event.provider,
      event_date: date,
      notes: `${notes}${reason ? ` · Correction reason: ${reason}` : ""}`,
      file_path: event.file_path ?? null,
      supersedes_id: event.id,
    });
    setSaving(false);
    if (error) return setError(error.message);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-teal-50 hover:text-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500/10"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-3.5 w-3.5"
        >
          <path d="m15 5 4 4M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Correct this entry
      </button>
    );
  }

  const input = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10";

  return (
    <form
      onSubmit={save}
      className="mt-4 space-y-4 rounded-xl border border-teal-200 bg-teal-50/40 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
          >
            <path d="m15 5 4 4M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Correct medical record
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            The original stays in your history, marked as superseded. Your
            correction will be saved as a new entry.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`correction-title-${event.id}`}
          className="block text-sm font-semibold text-slate-700"
        >
          Record title
        </label>
        <input
          id={`correction-title-${event.id}`}
          className={input}
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`correction-date-${event.id}`}
          className="block text-sm font-semibold text-slate-700"
        >
          Event date
        </label>
        <input
          id={`correction-date-${event.id}`}
          className={input}
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`correction-notes-${event.id}`}
          className="block text-sm font-semibold text-slate-700"
        >
          Notes
        </label>
        <textarea
          id={`correction-notes-${event.id}`}
          className={`${input} resize-y`}
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Update the details or notes"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`correction-reason-${event.id}`}
          className="block text-sm font-semibold text-slate-700"
        >
          Reason for correction
        </label>
        <input
          id={`correction-reason-${event.id}`}
          className={input}
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="e.g. Typo in value"
          required
        />
        <p className="text-xs leading-5 text-slate-500">
          This reason will be included in the corrected entry.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-teal-100 pt-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-50"
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
          {saving ? "Saving..." : "Save correction"}
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