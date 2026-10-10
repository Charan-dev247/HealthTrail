"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Timeline from "@/components/Timeline";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Data = any;

const fmt = (iso: string) =>
  new Date(iso.length === 10 ? iso + "T00:00:00+05:30" : iso).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric",
  });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

export default function DoctorView() {
  const { token } = useParams<{ token: string }>();
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [data, setData] = useState<Data>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastView, setLastView] = useState<string | null>(null);
  const [sinceChoice, setSinceChoice] = useState("");

  async function load(since?: string) {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/view/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, regNo, since }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setData(null);
      return setError(json.error ?? "Something went wrong");
    }
    if (!since) {
      const lv = json.diff.basis === "last_view" ? json.diff.since : null;
      setLastView(lv);
      setSinceChoice(lv ?? "");
    }
    setData(json);
  }

  // ---------- Step 1: doctor identifies themselves ----------
  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); load(); }}
          className="w-full max-w-sm bg-white p-6 rounded-xl shadow space-y-4"
        >
          <h1 className="text-2xl font-bold text-teal-700">HealthTrail</h1>
          <p className="text-sm text-slate-600">
            A patient has shared part of their medical record with you. Please identify yourself. This access is logged.
          </p>
          <input className="w-full border rounded p-2 text-slate-800" placeholder="Your name"
            value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="w-full border rounded p-2 text-slate-800" placeholder="Medical registration no."
            value={regNo} onChange={(e) => setRegNo(e.target.value)} required />
          {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
          <button disabled={loading} className="w-full bg-teal-600 text-white rounded p-2 disabled:opacity-50">
            {loading ? "Checking access..." : "View record"}
          </button>
        </form>
      </main>
    );
  }

  const d = data.diff;
  const nothingChanged =
    !d.added.length && !d.stopped.length && !d.changed.length && !d.newLabs.length && !d.newConditions.length;

  // ---------- Step 2: the shared record ----------
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xl font-bold text-teal-700">HealthTrail · Doctor view</span>
        <span className="text-xs text-slate-500">
          Shared: {data.scopes.join(", ")} · Access expires {fmtTime(data.expiresAt)}
        </span>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Patient + safety info */}
        <section className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">{data.patient?.full_name}</h2>
            <p className="text-sm text-slate-500">DOB {data.patient?.dob} · {data.patient?.blood_group}</p>
            {data.conditions.map((c: any) => (
              <p key={c.name} className="text-sm text-slate-700">{c.name}</p>
            ))}
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-700">Allergies</h3>
            {data.allergies.length ? (
              data.allergies.map((a: any) => (
                <p key={a.substance} className="text-sm text-red-800">{a.substance} ({a.reaction})</p>
              ))
            ) : (
              <p className="text-sm text-slate-500">None recorded</p>
            )}
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-slate-800">Current medicines</h3>
            {data.currentMeds.map((m: any) => (
              <p key={m.generic_name + m.dose} className="text-sm text-slate-700">
                <b>{m.generic_name}</b> {m.dose}, {m.frequency}
              </p>
            ))}
          </div>
        </section>

        {/* What changed (the diff) */}
        <section className="bg-white rounded-lg p-5 shadow-sm border-l-4 border-teal-500">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-xl font-bold text-slate-800">What changed</h2>
            <select
              className="border rounded p-1 text-sm text-slate-800"
              value={sinceChoice}
              onChange={(e) => { setSinceChoice(e.target.value); load(e.target.value || undefined); }}
            >
              {lastView && <option value={lastView}>Since your last view ({fmt(lastView)})</option>}
              {!lastView && <option value="">Last 6 months</option>}
              {data.visitDates.map((v: string) => (
                <option key={v} value={v}>Since visit on {fmt(v)}</option>
              ))}
            </select>
          </div>
          <p className="text-sm text-slate-500 mb-4">Comparing the record on {fmt(d.since)} with today.</p>

          {nothingChanged && <p className="text-slate-600">No changes in this period.</p>}

          <div className="space-y-2">
            {d.changed.map((c: any) => (
              <p key={"c" + c.to.generic_name} className="bg-amber-50 text-amber-900 rounded p-2 text-sm">
                <b>DOSE CHANGED</b> · {c.to.generic_name}: {c.from.dose} {c.from.frequency} → <b>{c.to.dose} {c.to.frequency}</b>
              </p>
            ))}
            {d.added.map((m: any) => (
              <p key={"a" + m.generic_name} className="bg-green-50 text-green-900 rounded p-2 text-sm">
                <b>STARTED</b> · {m.generic_name} {m.dose}, {m.frequency} (since {fmt(m.start_date)})
              </p>
            ))}
            {d.stopped.map((m: any) => (
              <p key={"s" + m.generic_name} className="bg-red-50 text-red-900 rounded p-2 text-sm">
                <b>STOPPED</b> · {m.generic_name} {m.dose}{m.end_date ? ` (on ${fmt(m.end_date)})` : ""}
              </p>
            ))}
            {d.newConditions.map((c: any) => (
              <p key={"n" + c.name} className="bg-purple-50 text-purple-900 rounded p-2 text-sm">
                <b>NEW DIAGNOSIS</b> · {c.name} ({fmt(c.diagnosed_on)})
              </p>
            ))}
            {d.newLabs.length > 0 && (
              <div className="bg-slate-50 rounded p-2 text-sm text-slate-800">
                <b>NEW LAB RESULTS</b>
                {d.newLabs.map((l: any, i: number) => (
                  <p key={i}>{fmt(l.tested_on)} · {l.test_code}: {l.value} {l.unit ?? ""}</p>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Recent tests with illustrative review intervals */}
        <section className="bg-white rounded-lg p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-3">Recent tests</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {data.tests.map((t: any) => (
              <div key={t.test_code}
                className={`rounded p-3 text-sm ${t.within_interval ? "bg-green-50 text-green-900" : "bg-slate-100 text-slate-700"}`}>
                <p className="font-semibold">{t.test_name}: {t.value} {t.unit ?? ""}</p>
                <p>Last done {fmt(t.last_done)} ({t.days_ago} days ago)</p>
                {t.interval && (
                  <p className="text-xs">
                    {t.within_interval ? "Within" : "Beyond"} illustrative review interval of {t.interval} days
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Review intervals are illustrative, not clinical guidance. Whether to repeat a test is the clinician&apos;s decision.
          </p>
        </section>

        {/* Timeline (only shared categories) */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-3">Timeline (shared categories only)</h2>
          <Timeline events={data.timeline} />
        </section>

        {error && <p className="text-red-600 font-medium">{error}</p>}
      </div>
    </main>
  );
}