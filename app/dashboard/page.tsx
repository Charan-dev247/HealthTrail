import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Timeline from "@/components/Timeline";
import SignOutButton from "@/components/SignOutButton";
import EmergencyQR from "@/components/EmergencyQR";
import AddRecordForm from "@/components/AddRecordForm";

export default async function Dashboard() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profile }, { data: events }, { data: meds }, { data: conditions },
    { data: allergies }, { data: emergencyLogs }, { data: rules },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("events").select("*").order("event_date", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("medications").select("*").is("end_date", null).order("start_date"),
    supabase.from("conditions").select("*").order("diagnosed_on"),
    supabase.from("allergies").select("*"),
    supabase.from("access_logs").select("accessed_at, access_type")
      .in("access_type", ["emergency_basic", "break_glass"])
      .order("accessed_at", { ascending: false }).limit(1),
    supabase.from("test_review_rules").select("test_code, test_name").order("test_name"),
  ]);

  // Short-lived signed links for attached files (bucket is private)
  const paths = (events ?? []).filter(e => e.file_path).map(e => e.file_path as string);
  const fileUrls: Record<string, string> = {};
  if (paths.length) {
    const { data: signed } = await supabase.storage
      .from(process.env.NEXT_PUBLIC_STORAGE_BUCKET!)
      .createSignedUrls(paths, 300);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) fileUrls[s.path] = s.signedUrl;
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-teal-700">HealthTrail</Link>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/share" className="text-sm bg-teal-600 text-white rounded px-3 py-1">Share with a doctor</Link>
          <SignOutButton />
        </div>
      </header>

      {emergencyLogs?.[0] && (
        <div className="bg-red-600 text-white px-6 py-2 text-sm">
          ⚠ Your emergency card was accessed on{" "}
          {new Date(emergencyLogs[0].accessed_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}.{" "}
          <Link href="/dashboard/share" className="underline">See access log</Link>
        </div>
      )}

      <div className="max-w-5xl mx-auto p-6 grid md:grid-cols-3 gap-6">
        <aside className="space-y-4">
          <section className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">{profile?.full_name}</h2>
            <p className="text-sm text-slate-500">DOB {profile?.dob ?? "—"} · Blood group {profile?.blood_group ?? "—"}</p>
            <p className="text-sm text-slate-500 mt-1">Emergency: {profile?.emergency_contact ?? "—"}</p>
          </section>

          <section className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-700 mb-1">Allergies</h3>
            {allergies?.length ? allergies.map(a => (
              <p key={a.id} className="text-sm text-red-800">{a.substance} ({a.reaction}, {a.severity})</p>
            )) : <p className="text-sm text-slate-500">None recorded</p>}
          </section>

          <section className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-1">Conditions</h3>
            {conditions?.length ? conditions.map(c => (
              <p key={c.id} className="text-sm text-slate-700">{c.name} <span className="text-slate-400">since {c.diagnosed_on}</span></p>
            )) : <p className="text-sm text-slate-500">None recorded</p>}
          </section>

          <section className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-1">Current medicines</h3>
            {meds?.length ? meds.map(m => (
              <p key={m.id} className="text-sm text-slate-700">
                <b>{m.generic_name}</b> {m.dose}{m.frequency ? `, ${m.frequency}` : ""}{" "}
                {m.brand_name && <span className="text-slate-400">({m.brand_name})</span>}
              </p>
            )) : <p className="text-sm text-slate-500">None recorded</p>}
          </section>

          <EmergencyQR token={profile?.emergency_token} />
        </aside>

        <section className="md:col-span-2">
          <AddRecordForm
            userId={user.id}
            currentMeds={meds ?? []}
            allergies={allergies ?? []}
            rules={rules ?? []}
          />
          <h2 className="text-lg font-bold text-slate-800 mb-4">Health timeline</h2>
          <Timeline events={events ?? []} fileUrls={fileUrls} canCorrect />
        </section>
      </div>
    </main>
  );
}