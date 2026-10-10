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
      <button onClick={() => setOpen(true)} className="mt-2 text-xs text-slate-500 underline hover:text-teal-700">
        Correct this entry
      </button>
    );
  }

  const input = "border rounded p-2 text-sm text-slate-800 w-full";
  return (
    <form onSubmit={save} className="mt-3 border-t pt-3 space-y-2">
      <p className="text-xs text-slate-500">The original stays in your history, marked as superseded.</p>
      <input className={input} value={title} onChange={e => setTitle(e.target.value)} required />
      <input className={input} type="date" value={date} onChange={e => setDate(e.target.value)} required />
      <textarea className={input} rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes" />
      <input className={input} value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for correction (e.g. typo in value)" required />
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button disabled={saving} className="bg-teal-600 text-white rounded px-3 py-1 text-sm disabled:opacity-50">
          {saving ? "Saving..." : "Save correction"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-500">Cancel</button>
      </div>
    </form>
  );
}