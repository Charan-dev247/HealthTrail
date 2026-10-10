
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Timeline from "@/components/Timeline";
import SignOutButton from "@/components/SignOutButton";
import EmergencyQR from "@/components/EmergencyQR";
import AddRecordForm from "@/components/AddRecordForm";
import ProfileEditor from "@/components/ProfileEditor";

export default async function Dashboard() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profile }, { data: events }, { data: meds }, { data: conditions },
    { data: allergies }, { data: emergencyLogs }, { data: rules }, { data: removals },
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
    supabase.from("event_removals").select("event_id"),
  ]);

  // Hide removed entries (the removal itself stays in the audit table)
  const removedIds = new Set((removals ?? []).map(r => r.event_id));
  const visibleEvents = (events ?? []).filter(e => !removedIds.has(e.id));

  // Short-lived signed links for attached files (bucket is private)
  const paths = visibleEvents.filter(e => e.file_path).map(e => e.file_path as string);
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
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-xl font-bold text-white shadow-sm">
              H
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              Health<span className="text-teal-700">Trail</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard/share"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 sm:px-4 sm:text-sm"
            >
              <span aria-hidden="true">↗</span>
              <span className="hidden sm:inline">Share with a doctor</span>
              <span className="sm:hidden">Share</span>
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      {emergencyLogs?.[0] && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium">
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-700">
                !
              </span>
              Your emergency card was accessed on{" "}
              <span className="font-semibold">
                {new Date(emergencyLogs[0].accessed_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}
              </span>.
            </p>
            <Link
              href="/dashboard/share"
              className="font-semibold underline decoration-red-300 underline-offset-4 hover:text-red-950"
            >
              See access log →
            </Link>
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 sm:py-8 md:grid-cols-3 lg:gap-8 lg:px-8">
        <aside className="min-w-0 space-y-5">
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md">
            <div className="h-2 bg-gradient-to-r from-teal-700 via-teal-500 to-emerald-400" />
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-xl font-bold text-teal-800 ring-1 ring-teal-100">
                  {profile?.full_name?.charAt(0)?.toUpperCase() ?? "P"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                    Patient profile
                  </p>
                  <h2 className="mt-1 break-words text-lg font-bold leading-snug text-slate-900">
                    {profile?.full_name}
                  </h2>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">Date of birth</p>
                  <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                    {profile?.dob ?? "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">Blood group</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {profile?.blood_group ?? "—"}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-slate-100 px-3 py-3">
                <p className="text-xs font-medium text-slate-500">Emergency contact</p>
                <p className="mt-1 break-words text-sm font-medium text-slate-800">
                  {profile?.emergency_contact ?? "—"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-red-200/80 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-red-100 bg-red-50/80 px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-700">
                !
              </span>
              <div>
                <h3 className="font-bold text-red-800">Allergies</h3>
                <p className="text-xs text-red-700/80">Important safety information</p>
              </div>
            </div>
            <div className="space-y-2 p-4">
              {allergies?.length ? allergies.map(a => (
                <div key={a.id} className="rounded-xl border border-red-100 bg-red-50/50 px-3 py-2.5">
                  <p className="break-words text-sm font-semibold text-red-900">{a.substance}</p>
                  <p className="mt-1 break-words text-xs leading-5 text-red-700">
                    {a.reaction} · {a.severity}
                  </p>
                </div>
              )) : <p className="text-sm text-slate-500">No allergies recorded.</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-lg text-violet-700">
                ♡
              </span>
              <h3 className="font-bold text-slate-900">Conditions</h3>
            </div>
            <div className="space-y-3">
              {conditions?.length ? conditions.map(c => (
                <div key={c.id} className="border-l-2 border-violet-200 pl-3">
                  <p className="break-words text-sm font-semibold text-slate-800">{c.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Diagnosed {c.diagnosed_on ?? "date unavailable"}
                  </p>
                </div>
              )) : <p className="text-sm text-slate-500">No conditions recorded.</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-700">
                +
              </span>
              <h3 className="font-bold text-slate-900">Current medicines</h3>
            </div>
            <div className="space-y-3">
              {meds?.length ? meds.map(m => (
                <div key={m.id} className="rounded-xl bg-slate-50 p-3">
                  <p className="break-words text-sm font-semibold text-slate-800">
                    {m.generic_name}
                  </p>
                  <p className="mt-1 break-words text-sm text-slate-600">
                    {m.dose}{m.frequency ? ` · ${m.frequency}` : ""}
                  </p>
                  {m.brand_name && (
                    <p className="mt-1 break-words text-xs text-slate-500">
                      Brand: {m.brand_name}
                    </p>
                  )}
                </div>
              )) : <p className="text-sm text-slate-500">No current medicines recorded.</p>}
            </div>
          </section>

          {profile && <ProfileEditor profile={profile} allergies={allergies ?? []} />}
          <EmergencyQR token={profile?.emergency_token} />
        </aside>

        <section className="min-w-0 space-y-6 md:col-span-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
                Health records
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Your health timeline
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Add medical events and review your history in one place.
              </p>
            </div>
            <AddRecordForm
              userId={user.id}
              currentMeds={meds ?? []}
              allergies={allergies ?? []}
              rules={rules ?? []}
            />
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Medical history
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your recorded events, ordered by date.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800">
                <span className="h-2 w-2 rounded-full bg-teal-600" />
                Timeline
              </span>
            </div>
            <Timeline events={visibleEvents} fileUrls={fileUrls} canCorrect />
          </div>
        </section>
      </div>
    </main>
  );
}
