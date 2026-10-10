"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = { id: string; full_name: string | null; dob: string | null; blood_group: string | null; emergency_contact: string | null };
type Allergy = { id: string; substance: string; reaction: string | null; severity: string | null };

const input = "border rounded p-2 text-sm text-slate-800 w-full";

export default function ProfileEditor({ profile, allergies }: { profile: Profile; allergies: Allergy[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [dob, setDob] = useState(profile.dob ?? "");
  const [bloodGroup, setBloodGroup] = useState(profile.blood_group ?? "");
  const [contact, setContact] = useState(profile.emergency_contact ?? "");
  const [substance, setSubstance] = useState("");
  const [reaction, setReaction] = useState("");
  const [severity, setSeverity] = useState("moderate");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setMsg("");
    const { error } = await supabase.from("profiles").update({
      full_name: fullName || null, dob: dob || null,
      blood_group: bloodGroup || null, emergency_contact: contact || null,
    }).eq("id", profile.id);
    if (error) return setError(error.message);
    setMsg("Profile saved");
    router.refresh();
  }

  async function addAllergy(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setMsg("");
    const { error } = await supabase.from("allergies").insert({
      patient_id: profile.id, substance: substance.trim(), reaction: reaction || null, severity,
    });
    if (error) return setError(error.message);
    setSubstance(""); setReaction("");
    router.refresh();
  }

  async function removeAllergy(id: string) {
    const { error } = await supabase.from("allergies").delete().eq("id", id);
    if (error) return setError(error.message);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full text-sm border border-teal-600 text-teal-700 rounded-lg p-2 hover:bg-teal-50">
        Edit profile &amp; allergies
      </button>
    );
  }

  return (
    <section className="bg-white rounded-lg p-4 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">Edit profile</h3>
        <button onClick={() => setOpen(false)} className="text-sm text-slate-500">Close</button>
      </div>

      <form onSubmit={saveProfile} className="space-y-2">
        <input className={input} placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} />
        <label className="text-xs text-slate-500">Date of birth</label>
        <input className={input} type="date" value={dob} onChange={e => setDob(e.target.value)} />
        <select className={input} value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}>
          <option value="">Blood group</option>
          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <input className={input} placeholder="Emergency contact (name · phone)" value={contact} onChange={e => setContact(e.target.value)} />
        <button className="bg-teal-600 text-white rounded px-3 py-1 text-sm">Save profile</button>
      </form>

      <div className="border-t pt-3 space-y-2">
        <h4 className="font-semibold text-red-700 text-sm">Allergies</h4>
        {allergies.map(a => (
          <div key={a.id} className="flex justify-between items-center text-sm text-red-800">
            <span>{a.substance}{a.reaction ? ` (${a.reaction})` : ""}</span>
            <button onClick={() => removeAllergy(a.id)} className="text-xs text-slate-500 underline">remove</button>
          </div>
        ))}
        <form onSubmit={addAllergy} className="space-y-2">
          <input className={input} placeholder="Substance (e.g. Penicillin)" value={substance} onChange={e => setSubstance(e.target.value)} required />
          <input className={input} placeholder="Reaction (e.g. rash)" value={reaction} onChange={e => setReaction(e.target.value)} />
          <select className={input} value={severity} onChange={e => setSeverity(e.target.value)}>
            <option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option>
          </select>
          <button className="bg-red-600 text-white rounded px-3 py-1 text-sm">Add allergy</button>
        </form>
      </div>

      {msg && <p className="text-green-700 text-sm">{msg}</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </section>
  );
}