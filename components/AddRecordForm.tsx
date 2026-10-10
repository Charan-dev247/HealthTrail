"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { checkMeds, toGeneric, type Warning } from "@/lib/drugs";

type MedRow = { brand_name: string; generic_name: string; dose: string; frequency: string };
type CurrentMed = { id: string; generic_name: string; dose: string | null; brand_name: string | null };

const emptyMed = (): MedRow => ({ brand_name: "", generic_name: "", dose: "", frequency: "" });
const input = "border rounded p-2 text-slate-800 w-full";

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
        const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
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
      <button onClick={() => setOpen(true)} className="w-full bg-teal-600 text-white rounded-lg p-3 font-medium mb-4">
        + Add record
      </button>
    );
  }

  const warnColor = {
    allergy: "bg-red-50 text-red-800 border-red-300",
    interaction: "bg-amber-50 text-amber-900 border-amber-300",
    duplicate: "bg-blue-50 text-blue-900 border-blue-300",
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-lg p-5 shadow-sm space-y-3 mb-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">Add record</h3>
        <button type="button" onClick={() => { reset(); setOpen(false); }} className="text-sm text-slate-500">Cancel</button>
      </div>

      <div className="grid sm:grid-cols-3 gap-2">
        <select className={input} value={type} onChange={e => { setType(e.target.value); setWarnings(null); }}>
          <option value="prescription">Prescription</option>
          <option value="lab">Lab result</option>
          <option value="diagnosis">Diagnosis</option>
          <option value="visit">Visit</option>
          <option value="scan">Scan / report</option>
        </select>
        <select className={input} value={category} onChange={e => setCategory(e.target.value)}>
          <option value="general">General</option>
          <option value="diabetes">Diabetes</option>
          <option value="cardiac">Heart / BP</option>
          <option value="mental">Mental health</option>
        </select>
        <input className={input} type="date" value={date} onChange={e => setDate(e.target.value)} required />
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        <input className={input} placeholder="Doctor" value={doctor} onChange={e => setDoctor(e.target.value)} />
        <input className={input} placeholder="Clinic / lab" value={provider} onChange={e => setProvider(e.target.value)} />
      </div>
      <input className={input} placeholder="Title (optional, auto-filled if empty)" value={title} onChange={e => setTitle(e.target.value)} />

      {type === "prescription" && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Medicines</p>
          {meds.map((m, i) => (
            <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input className={input} placeholder="Brand (e.g. Glycomet)" value={m.brand_name} onChange={e => updateMed(i, "brand_name", e.target.value)} />
              <input className={input} placeholder="Generic" value={m.generic_name} onChange={e => updateMed(i, "generic_name", e.target.value)} />
              <input className={input} placeholder="Dose (500 mg)" value={m.dose} onChange={e => updateMed(i, "dose", e.target.value)} />
              <input className={input} placeholder="Frequency" value={m.frequency} onChange={e => updateMed(i, "frequency", e.target.value)} />
            </div>
          ))}
          <button type="button" onClick={() => setMeds([...meds, emptyMed()])} className="text-sm text-teal-700">+ another medicine</button>
        </div>
      )}

      {type === "lab" && (
        <div className="grid grid-cols-3 gap-2">
          <select className={input} value={lab.test_code} onChange={e => setLab({ ...lab, test_code: e.target.value })}>
            {rules.map(r => <option key={r.test_code} value={r.test_code}>{r.test_name}</option>)}
          </select>
          <input className={input} placeholder="Value" value={lab.value} onChange={e => setLab({ ...lab, value: e.target.value })} />
          <input className={input} placeholder="Unit" value={lab.unit} onChange={e => setLab({ ...lab, unit: e.target.value })} />
        </div>
      )}

      {type === "diagnosis" && (
        <input className={input} placeholder="Condition (e.g. Asthma)" value={condition} onChange={e => setCondition(e.target.value)} required />
      )}

      <textarea className={input} placeholder="Notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
      <div>
        <label className="text-sm text-slate-700">Attach report (PDF / image, optional)</label>
        <input type="file" accept="application/pdf,image/*" className="block text-sm text-slate-700 mt-1"
          onChange={e => setFile(e.target.files?.[0] ?? null)} />
      </div>

      {warnings && warnings.length > 0 && (
        <div className="space-y-2">
          <p className="font-semibold text-slate-800">Please review before saving</p>
          {warnings.map((w, i) => (
            <div key={i} className={`border rounded p-2 text-sm ${warnColor[w.kind]}`}>
              <b className="uppercase">{w.kind}</b> · {w.message}
              {w.kind === "duplicate" && (
                <label className="flex items-center gap-2 mt-1">
                  <input type="checkbox" checked={endPrevious} onChange={e => setEndPrevious(e.target.checked)} />
                  Record as a change: end the previous entry on this date (history is kept)
                </label>
              )}
            </div>
          ))}
          <p className="text-xs text-slate-500">Illustrative checks against a small demo dataset, not clinical advice.</p>
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button disabled={saving} className="bg-teal-600 text-white rounded px-4 py-2 disabled:opacity-50">
        {saving ? "Saving..." : warnings?.length ? "Save anyway" : "Save record"}
      </button>
    </form>
  );
}