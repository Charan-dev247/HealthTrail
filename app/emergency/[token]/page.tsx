import { connection } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { medsActiveAt } from "@/lib/health";

export default async function EmergencyPage({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const db = createAdminClient();

  const { data: profile } = await db.from("profiles")
    .select("id, full_name, dob, blood_group, emergency_contact")
    .eq("emergency_token", token).maybeSingle();

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <p className="text-red-600 font-medium">Invalid emergency card.</p>
      </main>
    );
  }

  const [{ data: allergies }, { data: conditions }, { data: meds }] = await Promise.all([
    db.from("allergies").select("substance, reaction, severity").eq("patient_id", profile.id),
    db.from("conditions").select("name").eq("patient_id", profile.id),
    db.from("medications").select("generic_name, brand_name, dose, frequency, start_date, end_date").eq("patient_id", profile.id),
  ]);

  // Every scan is logged and shown to the patient
  await db.from("access_logs").insert({
    patient_id: profile.id, access_type: "emergency_basic", claimed_viewer_name: "Emergency QR scan",
  });

  const current = medsActiveAt(meds ?? [], new Date());

  return (
    <main className="min-h-screen bg-red-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-red-600 text-white rounded-lg p-4">
          <p className="text-xs uppercase tracking-wide">VCareMed · Emergency summary</p>
          <h1 className="text-2xl font-bold">{profile.full_name}</h1>
          <p>DOB {profile.dob ?? "—"}</p>
          <p className="text-3xl font-bold mt-2">Blood group {profile.blood_group ?? "—"}</p>
        </div>

        <section className="bg-white rounded-lg p-4 border-2 border-red-300">
          <h2 className="font-bold text-red-700 text-lg">⚠ Allergies</h2>
          {allergies?.length ? allergies.map(a => (
            <p key={a.substance} className="text-red-800 font-medium">{a.substance}: {a.reaction} ({a.severity})</p>
          )) : <p className="text-slate-500">None recorded</p>}
        </section>

        <section className="bg-white rounded-lg p-4">
          <h2 className="font-bold text-slate-800">Current medicines</h2>
          {current.map(m => (
            <p key={m.generic_name + m.dose} className="text-slate-700"><b>{m.generic_name}</b> {m.dose}, {m.frequency}</p>
          ))}
        </section>

        <section className="bg-white rounded-lg p-4">
          <h2 className="font-bold text-slate-800">Conditions</h2>
          {conditions?.map(c => <p key={c.name} className="text-slate-700">{c.name}</p>)}
        </section>

        <section className="bg-white rounded-lg p-4">
          <h2 className="font-bold text-slate-800">Emergency contact</h2>
          <p className="text-slate-700">{profile.emergency_contact ?? "—"}</p>
        </section>

        <p className="text-xs text-slate-500 text-center">
          Limited summary chosen by the patient. This scan has been logged and the patient will see it.
        </p>
      </div>
    </main>
  );
}