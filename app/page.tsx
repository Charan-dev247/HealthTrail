import Link from "next/link";

const features = [
  { title: "What changed since your last visit", text: "Doctors see medicines started, stopped or dose-changed, new diagnoses and new lab results — not a 40-page history." },
  { title: "Version-controlled history", text: "Records are never edited or deleted. Corrections are new entries linked to the original, enforced by the database." },
  { title: "Scoped, expiring, revocable sharing", text: "Share only the categories a doctor needs, for 1 hour to 7 days. Revoke anytime. Every view is logged." },
  { title: "Safety checks before saving", text: "Warns about duplicate medicines under different brand names, recorded allergies and known interactions." },
  { title: "Recent tests at a glance", text: "Shows when each test was last done against an illustrative review interval, to help avoid unnecessary repeats." },
  { title: "Emergency card", text: "A QR code shows only blood group, allergies, current medicines and emergency contact. Every scan alerts the patient." },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <span className="text-xl font-bold text-teal-700">HealthTrail</span>
        <Link href="/login" className="text-sm bg-teal-600 text-white rounded px-4 py-2">Sign in</Link>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
          Your medical history, <span className="text-teal-600">version-controlled.</span>
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          HealthTrail doesn&apos;t just store medical records. It shows what changed, what the next doctor needs to know,
          and exactly who was allowed to see it.
        </p>
        <div className="mt-8 inline-block bg-white rounded-xl shadow p-5 text-left">
          <p className="font-semibold">Try the demo patient</p>
          <p className="text-sm text-slate-600 mt-1">Email: <code className="bg-slate-100 px-1 rounded">ravi@test.com</code></p>
          <p className="text-sm text-slate-600">Password: <code className="bg-slate-100 px-1 rounded">ravi123</code></p>
          <Link href="/login" className="mt-3 inline-block bg-teal-600 text-white rounded px-4 py-2">Open demo →</Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(f => (
          <div key={f.title} className="bg-white rounded-lg p-5 shadow-sm">
            <h3 className="font-semibold text-teal-700">{f.title}</h3>
            <p className="text-sm text-slate-600 mt-1">{f.text}</p>
          </div>
        ))}
      </section>

      <footer className="text-center text-xs text-slate-400 pb-8 px-6">
        Prototype built for a hackathon. All patient data is simulated. Safety checks and review intervals are illustrative, not clinical advice.
        Clinician identity is self-reported and not verified.
      </footer>
    </main>
  );
}