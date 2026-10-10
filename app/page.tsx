
import Link from "next/link";

const features = [
  { title: "What changed since your last visit", text: "Doctors see medicines started, stopped or dose-changed, new diagnoses and new lab results — not a 40-page history." },
  { title: "Version-controlled history", text: "Records are never edited or deleted. Corrections are new entries linked to the original, enforced by the database." },
  { title: "Scoped, expiring, revocable sharing", text: "Share only the categories a doctor needs, for 1 hour to 7 days. Revoke anytime. Every view is logged." },
  { title: "Safety checks before saving", text: "Warns about duplicate medicines under different brand names, recorded allergies and known interactions." },
  { title: "Recent tests at a glance", text: "Shows when each test was last done against an illustrative review interval, to help avoid unnecessary repeats." },
  { title: "Emergency card", text: "A QR code shows only blood group, allergies, current medicines and emergency contact. Every scan alerts the patient." },
];

const icons = ["↗", "◷", "⌁", "✚", "▤", "♡"];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-800">
      {/* Navigation */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-xl font-bold text-white shadow-sm">
              H
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Health<span className="text-teal-700">Trail</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Your health, connected
            </span>
            <Link
              href="/login"
              className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Sign in <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-teal-50 via-slate-50 to-slate-50" />
        <div className="pointer-events-none absolute -right-32 top-12 -z-10 h-80 w-80 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-52 -z-10 h-72 w-72 rounded-full bg-emerald-100/50 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-28">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-4 py-2 text-sm font-medium text-teal-800 shadow-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100">
                ✦
              </span>
              A clearer picture of your health
            </div>

            <h1 className="text-4xl font-bold leading-[1.12] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Your medical history,
              <span className="mt-2 block text-teal-700">
                version-controlled.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              HealthTrail doesn&apos;t just store medical records. It shows what
              changed, what the next doctor needs to know, and exactly who was
              allowed to see it.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-3.5 font-semibold text-white shadow-lg shadow-teal-900/10 transition hover:-translate-y-0.5 hover:bg-teal-800"
              >
                Get started <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-semibold text-slate-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50"
              >
                Explore features
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <span className="font-bold text-teal-700">✓</span>
                Controlled sharing
              </span>
              <span className="flex items-center gap-2">
                <span className="font-bold text-teal-700">✓</span>
                Traceable changes
              </span>
              <span className="flex items-center gap-2">
                <span className="font-bold text-teal-700">✓</span>
                Patient-focused
              </span>
            </div>
          </div>

          {/* Product preview */}
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-teal-200/40 to-emerald-100/30 blur-2xl" />

            <div className="relative rounded-3xl border border-white bg-white p-5 shadow-2xl shadow-slate-900/10 sm:p-7">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100 text-lg font-bold text-teal-800">
                    H
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Health overview</p>
                    <p className="text-xs text-slate-500">Your medical timeline</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  ● Up to date
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-lg text-blue-700">
                    +
                  </div>
                  <p className="mt-4 text-2xl font-bold text-slate-900">Records</p>
                  <p className="mt-1 text-xs text-slate-500">
                    One organized history
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-lg text-emerald-700">
                    ↗
                  </div>
                  <p className="mt-4 text-2xl font-bold text-slate-900">Changes</p>
                  <p className="mt-1 text-xs text-slate-500">
                    A clearer visit summary
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50/70 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-lg text-teal-800">
                    ◷
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">
                      Your health, over time
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Track additions, corrections, and updates in your medical
                      history.
                    </p>
                  </div>
                </div>

                <div className="ml-4 mt-5 space-y-4 border-l-2 border-teal-200 pl-5">
                  <div className="relative">
                    <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-teal-600 ring-2 ring-teal-100" />
                    <p className="text-sm font-semibold text-slate-800">
                      Record updated
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Changes recorded in the timeline
                    </p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 ring-2 ring-emerald-100" />
                    <p className="text-sm font-semibold text-slate-800">
                      Sharing under your control
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Set access and revoke when needed
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  ♧
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    Access transparency
                  </p>
                  <p className="text-xs text-slate-500">
                    Review who can see your records
                  </p>
                </div>
                <span className="text-lg text-slate-400">→</span>
              </div>

              <p className="mt-4 text-center text-xs text-slate-400">
                Illustrative preview · Not a live patient record
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-slate-200/70 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">
              Built around your health
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              More clarity. Less digging.
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Medical history should be easy to understand, simple to share,
              and transparent to manage.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, index) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-slate-900/5 sm:p-7"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-xl font-semibold text-teal-700 transition group-hover:bg-teal-100">
                  {icons[index]}
                </div>
                <h3 className="mt-5 text-lg font-bold leading-snug text-slate-900">
                  {f.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {f.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo access */}
      <section className="bg-slate-50 px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-slate-900 shadow-xl">
          <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center lg:p-12">
            <div>
              <span className="inline-flex rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs font-semibold text-teal-300">
                HACKATHON DEMO
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Take HealthTrail for a test drive.
              </h2>
              <p className="mt-3 max-w-xl leading-7 text-slate-300">
                Explore the prototype using the demo patient account and see
                how medical history and controlled sharing work.
              </p>

              <div className="mt-6 space-y-3">
                <p className="text-sm text-slate-300">
                  Email:{" "}
                  <code className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-teal-200">
                    ravi@test.com
                  </code>
                </p>
                <p className="text-sm text-slate-300">
                  Password:{" "}
                  <code className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-teal-200">
                    ravi123
                  </code>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:min-w-48">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-6 py-3.5 font-semibold text-white transition hover:bg-teal-400"
              >
                Open demo <span aria-hidden="true">→</span>
              </Link>
              <p className="text-center text-xs leading-5 text-slate-400">
                Use the provided demo credentials
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-bold tracking-tight text-slate-800">
              Health<span className="text-teal-700">Trail</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              A prototype for clearer, more transparent medical histories.
            </p>
          </div>
          <p className="max-w-2xl text-xs leading-6 text-slate-500 sm:text-right">
            Prototype built for a hackathon. All patient data is simulated.
            Safety checks and review intervals are illustrative, not clinical
            advice. Clinician identity is self-reported and not verified.
          </p>
        </div>
      </footer>
    </main>
  );
}
