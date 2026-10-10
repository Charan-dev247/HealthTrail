"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

const CATEGORIES = [
  { id: "general", label: "General" },
  { id: "diabetes", label: "Diabetes" },
  { id: "cardiac", label: "Heart / BP" },
  { id: "mental", label: "Mental health" },
];

export default function ShareForm() {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [scopes, setScopes] = useState<string[]>(["general"]);
  const [hours, setHours] = useState(24);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) =>
    setScopes(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await fetch("/api/shares", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorLabel: label, scopes, hours }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) return setError(json.error);
    setUrl(json.url);
    router.refresh();
  }

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <form onSubmit={create} className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6"
            >
              <path d="M12 16V4m0 0L7 9m5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Create a share link
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Give your doctor temporary access to selected medical records.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="doctor-label"
            className="block text-sm font-semibold text-slate-700"
          >
            Doctor or recipient
          </label>
          <input
            id="doctor-label"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            placeholder="e.g. Dr. Arun Prakash, cardiologist"
            value={label}
            onChange={e => setLabel(e.target.value)}
          />
          <p className="text-xs text-slate-500">
            Add a name to help identify who the link is intended for.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">
              What can they see?
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Select the categories of records you want to share.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CATEGORIES.map(c => (
              <label
                key={c.id}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                  scopes.includes(c.id)
                    ? "border-teal-600 bg-teal-50 text-teal-800 ring-1 ring-teal-600"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 accent-teal-600 focus:ring-teal-500"
                  checked={scopes.includes(c.id)}
                  onChange={() => toggle(c.id)}
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 3h.01M10.3 4.7 2.9 17.5A1.7 1.7 0 0 0 4.4 20h15.2a1.7 1.7 0 0 0 1.5-2.5L13.7 4.7a2 2 0 0 0-3.4 0Z" />
            </svg>
            <p className="text-xs leading-5 text-amber-800">
              Allergies and current medicines are always included for safety.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="share-expiry"
            className="block text-sm font-semibold text-slate-700"
          >
            Link expiration
          </label>
          <select
            id="share-expiry"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 sm:w-56"
            value={hours}
            onChange={e => setHours(Number(e.target.value))}
          >
            <option value={1}>1 hour</option>
            <option value={24}>24 hours</option>
            <option value={168}>7 days</option>
          </select>
          <p className="text-xs text-slate-500">
            The link is intended for temporary access to your records.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="mt-0.5 h-5 w-5 shrink-0"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5m0 3h.01" strokeLinecap="round" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loading && (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 animate-spin"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="3"
                opacity="0.25"
              />
              <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          )}
          {loading ? "Creating..." : "Create share link"}
        </button>
      </form>

      {url && (
        <div className="border-t border-slate-200 pt-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Share link created
              </h3>
              <p className="text-xs text-slate-500">
                Share it securely with your doctor.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-start sm:p-5">
            <div className="shrink-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <QRCodeSVG
                value={url}
                size={140}
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="M"
                title="Medical record sharing QR code"
              />
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-sm font-semibold text-slate-800">
                Share this link with your doctor
              </p>

              <p className="break-all rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs leading-5 text-slate-700">
                {url}
              </p>

              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(url)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-500/10"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                >
                  <rect x="8" y="8" width="12" height="12" rx="2" />
                  <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
                </svg>
                Copy link
              </button>

              <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />
                  <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-xs leading-5 text-amber-800">
                  Shown only once. We store only a hash of this link. Keep the
                  link private and share it only with the intended recipient.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}