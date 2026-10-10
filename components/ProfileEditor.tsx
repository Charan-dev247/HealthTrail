
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = { id: string; full_name: string | null; dob: string | null; blood_group: string | null; emergency_contact: string | null };
type Allergy = { id: string; substance: string; reaction: string | null; severity: string | null };

const input = "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10";

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
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-white px-4 py-3 text-sm font-semibold text-teal-800 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        <span aria-hidden="true">✎</span>
        Edit profile &amp; allergies
      </button>
    );
  }

  return (
    <section className="min-w-0 space-y-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Personal details</span>
          <h3 className="mt-1 text-lg font-bold text-slate-900">Edit profile</h3>
          <p className="mt-1 text-sm leading-5 text-slate-500">Keep your health information up to date.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Close
        </button>
      </div>

      <form onSubmit={saveProfile} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="profile-name" className="block text-sm font-semibold text-slate-700">Full name</label>
          <input id="profile-name" className={input} placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="profile-dob" className="block text-sm font-semibold text-slate-700">Date of birth</label>
          <input id="profile-dob" className={input} type="date" value={dob} onChange={e => setDob(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="profile-blood" className="block text-sm font-semibold text-slate-700">Blood group</label>
          <select id="profile-blood" className={input} value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}>
            <option value="">Select blood group</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="profile-contact" className="block text-sm font-semibold text-slate-700">Emergency contact</label>
          <input id="profile-contact" className={input} placeholder="Name · phone number" value={contact} onChange={e => setContact(e.target.value)} />
        </div>

        <button className="w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:w-auto">
          Save profile
        </button>
      </form>

      <div className="border-t border-slate-100 pt-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-lg text-red-700 ring-1 ring-inset ring-red-100">
            !
          </span>
          <div>
            <h4 className="font-bold text-red-800">Allergies</h4>
            <p className="text-xs leading-5 text-slate-500">Record known allergies and reactions.</p>
          </div>
        </div>

        <div className="mb-5 space-y-2">
          {allergies.length ? allergies.map(a => (
            <div key={a.id} className="flex min-w-0 items-start justify-between gap-3 rounded-xl border border-red-100 bg-red-50/60 p-3">
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold text-red-900">{a.substance}</p>
                {a.reaction && (
                  <p className="mt-1 break-words text-xs leading-5 text-red-800">Reaction: {a.reaction}</p>
                )}
                {a.severity && (
                  <span className="mt-2 inline-flex rounded-full border border-red-200 bg-white px-2 py-0.5 text-xs font-medium capitalize text-red-800">
                    {a.severity}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeAllergy(a.id)}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-red-700 underline decoration-red-200 underline-offset-4 transition hover:bg-red-100 hover:text-red-900"
              >
                Remove
              </button>
            </div>
          )) : (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
              No allergies recorded.
            </p>
          )}
        </div>

        <form onSubmit={addAllergy} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
          <p className="text-sm font-semibold text-slate-800">Add an allergy</p>
          <div className="space-y-1.5">
            <label htmlFor="allergy-substance" className="block text-xs font-semibold text-slate-600">Substance</label>
            <input id="allergy-substance" className={input} placeholder="e.g. Penicillin" value={substance} onChange={e => setSubstance(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="allergy-reaction" className="block text-xs font-semibold text-slate-600">Reaction</label>
            <input id="allergy-reaction" className={input} placeholder="e.g. Rash" value={reaction} onChange={e => setReaction(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="allergy-severity" className="block text-xs font-semibold text-slate-600">Severity</label>
            <select id="allergy-severity" className={input} value={severity} onChange={e => setSeverity(e.target.value)}>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>
          <button className="w-full rounded-xl border border-red-200 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 sm:w-auto">
            + Add allergy
          </button>
        </form>
      </div>

      {msg && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800">
          {msg}
        </p>
      )}
      {error && (
        <p role="alert" className="break-words rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}
