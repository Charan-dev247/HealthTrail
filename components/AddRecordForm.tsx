
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { checkMeds, toGeneric, type Warning } from "@/lib/drugs";

type MedRow = { brand_name: string; generic_name: string; dose: string; frequency: string };
type CurrentMed = { id: string; generic_name: string; dose: string | null; brand_name: string | null };

const emptyMed = (): MedRow => ({ brand_name: "", generic_name: "", dose: "", frequency: "" });

const input = "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10";

export default function AddRecordForm({ userId, currentMeds, allergies, rules }: {
  userId: string;
  currentMeds: CurrentMed[];
  allergies: { substance: string }[];
  rules: { test_code: string; test_name: string }[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("prescription");
  const [category, setCategory] = useState("general");
  const [title, setTitle] = useState("");
  const [doctor, setDoctor] = useState("");
  const [provider, setProvider] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [meds, setMeds] = useState<MedRow[]>([emptyMed()]);
  const [lab, setLab] = useState({ test_code: rules[0]?.test_code ?? "", value: "", unit: "" });
  const [condition, setCondition] = useState("");
  const [warnings, setWarnings] = useState<Warning[] | null>(null);
  const [endPrevious, setEndPrevious] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateMed(i: number, field: keyof MedRow, value: string) {
    setWarnings(null);
    setMeds(ms => ms.map((m, j) => {
      if (j !== i) return m;
      const next = { ...m, [field]: value };
      if (field === "brand_name") { const g = toGeneric(value); if (g) next.generic_name = g; }
      return next;
    }));
  }

  const filledMeds = meds
    .filter(m => m.generic_name.trim() || m.brand_name.trim())
    .map(m => ({ ...m, generic_name: m.generic_name.trim() || toGeneric(m.brand_name) || m.brand_name.trim() }));

  function reset() {
    setTitle(""); setDoctor(""); setProvider(""); setDate(""); setNotes(""); setFile(null);
    setMeds([emptyMed()]); setLab({ test_code: rules[0]?.test_code ?? "", value: "", unit: "" });
    setCondition(""); setWarnings(null); setEndPrevious(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Safety check before saving a prescription
    if (type === "prescription" && warnings === null) {
      const w = checkMeds(filledMeds, currentMeds, allergies);
      if (w.length) { setWarnings(w); return; }
    }

    setSaving(true);
    try {
      let file_path: string | null = null;
      if (file) {
        const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\_-]/g, "_")}`;
        const { error } = await supabase.storage.from(process.env.NEXT_PUBLIC_STORAGE_BUCKET!).upload(path, file);
        if (error) throw error;
        file_path = path;
      }

      const autoTitle = title.trim() || (
        type === "prescription" ? filledMeds.map(m => `${m.generic_name} ${m.dose}`).join(", ") :
        type === "lab" ? (rules.find(r => r.test_code === lab.test_code)?.test_name ?? "Lab result") :
        type === "diagnosis" ? condition : "Visit");

      const { data: ev, error: evErr } = await supabase.from("events").insert({
        patient_id: userId, type, category, title: autoTitle,
        doctor_name: doctor || null, provider: provider || null,
        event_date: date, notes: notes || null, file_path,
      }).select("id").single();
      if (evErr) throw evErr;

      if (type === "prescription" && filledMeds.length) {
        // Dose change: end the previous entry instead of overwriting it (history preserved)
        const dupIds = endPrevious
          ? (warnings ?? []).filter(w => w.kind === "duplicate" && w.existingId).map(w => w.existingId!)
          : [];
        if (dupIds.length) {
          const { error } = await supabase.from("medications").update({ end_date: date }).in("id", dupIds);
          if (error) throw error;
        }
        const { error } = await supabase.from("medications").insert(filledMeds.map(m => ({
          patient_id: userId, event_id: ev.id, brand_name: m.brand_name || null,
          generic_name: m.generic_name, dose: m.dose || null, frequency: m.frequency || null,
          start_date: date, category,
        })));
        if (error) throw error;
      }

      if (type === "lab") {
        const { error } = await supabase.from("lab_results").insert({
          patient_id: userId, event_id: ev.id, test_code: lab.test_code,
          value: lab.value || null, unit: lab.unit || null, tested_on: date, category,
        });
        if (error) throw error;
      }

      if (type === "diagnosis" && condition.trim()) {
        const { error } = await supabase.from("conditions").insert({
          patient_id: userId, name: condition.trim(), diagnosed_on: date, category,
        });
        if (error) throw error;
      }

      reset();
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3.5 font-semibold text-white shadow-md shadow-teal-900/10 transition hover:-translate-y-0.5 hover:bg-teal-800 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/15 text-lg">+</span>
        Add record
      </button>
    );
  }

  const warnColor = {
    allergy: "border-red-200 bg-red-50 text-red-900",
    interaction: "border-amber-200 bg-amber-50 text-amber-900",
    duplicate: "border-blue-200 bg-blue-50 text-blue-900",
  };

  return (
    <form onSubmit={submit} className="mb-6 space-y-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Medical history</span>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Add record</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">Enter the details of a medical event.</p>
        </div>
        <button
          type="button"
          onClick={() => { reset(); setOpen(false); }}
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-800">Record details</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select aria-label="Record type" className={input} value={type} onChange={e => { setType(e.target.value); setWarnings(null); }}>
            <option value="prescription">Prescription</option>
            <option value="lab">Lab result</option>
            <option value="diagnosis">Diagnosis</option>
            <option value="visit">Visit</option>
            <option value="scan">Scan / report</option>
          </select>
          <select aria-label="Category" className={input} value={category} onChange={e => setCategory(e.target.value)}>
            <option value="general">General</option>
            <option value="diabetes">Diabetes</option>
            <option value="cardiac">Heart / BP</option>
            <option value="mental">Mental health</option>
          </select>
          <input aria-label="Event date" className={input} type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-800">Healthcare provider</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input aria-label="Doctor" className={input} placeholder="Doctor name" value={doctor} onChange={e => setDoctor(e.target.value)} />
          <input aria-label="Clinic or lab" className={input} placeholder="Clinic / lab name" value={provider} onChange={e => setProvider(e.target.value)} />
        </div>
        <input aria-label="Record title" className={input} placeholder="Title (optional, auto-filled if empty)" value={title} onChange={e => setTitle(e.target.value)} />
      </div>

      {type === "prescription" && (
        <div className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 sm:p-5">
          <div>
            <h4 className="font-bold text-slate-900">Medicines</h4>
            <p className="mt-1 text-sm leading-6 text-slate-500">Enter the medicine details as prescribed.</p>
          </div>
          {meds.map((m, i) => (
            <div key={i} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input aria-label={`Medicine ${i + 1} brand`} className={input} placeholder="Brand (e.g. Glycomet)" value={m.brand_name} onChange={e => updateMed(i, "brand_name", e.target.value)} />
              <input aria-label={`Medicine ${i + 1} generic name`} className={input} placeholder="Generic name" value={m.generic_name} onChange={e => updateMed(i, "generic_name", e.target.value)} />
              <input aria-label={`Medicine ${i + 1} dose`} className={input} placeholder="Dose (e.g. 500 mg)" value={m.dose} onChange={e => updateMed(i, "dose", e.target.value)} />
              <input aria-label={`Medicine ${i + 1} frequency`} className={input} placeholder="Frequency" value={m.frequency} onChange={e => updateMed(i, "frequency", e.target.value)} />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setMeds([...meds, emptyMed()])}
            className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-50"
          >
            <span className="text-lg">+</span> Add another medicine
          </button>
        </div>
      )}

      {type === "lab" && (
        <div className="space-y-3 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 sm:p-5">
          <div>
            <h4 className="font-bold text-slate-900">Lab result</h4>
            <p className="mt-1 text-sm text-slate-500">Select the test and enter its result.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select aria-label="Lab test" className={input} value={lab.test_code} onChange={e => setLab({ ...lab, test_code: e.target.value })}>
              {rules.map(r => <option key={r.test_code} value={r.test_code}>{r.test_name}</option>)}
            </select>
            <input aria-label="Lab value" className={input} placeholder="Value" value={lab.value} onChange={e => setLab({ ...lab, value: e.target.value })} />
            <input aria-label="Lab unit" className={input} placeholder="Unit" value={lab.unit} onChange={e => setLab({ ...lab, unit: e.target.value })} />
          </div>
        </div>
      )}

      {type === "diagnosis" && (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-800" htmlFor="condition">Condition</label>
          <input id="condition" className={input} placeholder="Condition (e.g. Asthma)" value={condition} onChange={e => setCondition(e.target.value)} required />
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-800" htmlFor="record-notes">Notes</label>
        <textarea id="record-notes" className={`${input} resize-y`} placeholder="Add any relevant details..." rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      <div className="space-y-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <label className="block text-sm font-semibold text-slate-800">Attach report</label>
        <p className="text-xs leading-5 text-slate-500">PDF or image · Optional</p>
        <input
          type="file"
          accept="application/pdf,image/*"
          className="block w-full min-w-0 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:font-semibold file:text-teal-800 hover:file:bg-teal-100"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {warnings && warnings.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <h4 className="font-bold text-slate-900">Please review before saving</h4>
            <p className="mt-1 text-sm leading-6 text-slate-600">One or more safety checks need your attention.</p>
          </div>
          {warnings.map((w, i) => (
            <div key={i} className={`rounded-xl border p-3 text-sm leading-6 ${warnColor[w.kind]}`}>
              <p>
                <b className="mr-1 text-xs uppercase tracking-wide">{w.kind}</b>
                <span aria-hidden="true">·</span> {w.message}
              </p>
              {w.kind === "duplicate" && (
                <label className="mt-3 flex items-start gap-3 rounded-lg bg-white/70 p-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 accent-teal-700"
                    checked={endPrevious}
                    onChange={e => setEndPrevious(e.target.checked)}
                  />
                  <span>Record as a change: end the previous entry on this date (history is kept).</span>
                </label>
              )}
            </div>
          ))}
          <p className="text-xs leading-5 text-slate-500">Illustrative checks against a small demo dataset, not clinical advice.</p>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => { reset(); setOpen(false); }}
          className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-3 font-semibold text-white shadow-md shadow-teal-900/10 transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : warnings?.length ? "Save anyway" : "Save record"}
          {!saving && <span aria-hidden="true">→</span>}
        </button>
      </div>
    </form>
  );
}
