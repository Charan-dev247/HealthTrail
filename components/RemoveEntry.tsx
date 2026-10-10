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
      <button onClick={() => setOpen(true)} className="ml-4 text-xs text-red-500 underline hover:text-red-700">
        Remove
      </button>
    );
  }

  return (
    <form onSubmit={remove} className="mt-3 border-t pt-3 space-y-2">
      <p className="text-xs text-slate-500">
        This entry will be hidden from your timeline and from doctors. The removal and its reason are kept in your audit trail.
      </p>
      <input className="border rounded p-2 text-sm text-slate-800 w-full" value={reason}
        onChange={e => setReason(e.target.value)} placeholder="Reason (e.g. added by mistake)" required />
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button disabled={saving} className="bg-red-600 text-white rounded px-3 py-1 text-sm disabled:opacity-50">
          {saving ? "Removing..." : "Remove entry"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-slate-500">Cancel</button>
      </div>
    </form>
  );
}