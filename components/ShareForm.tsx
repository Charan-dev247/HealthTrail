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
    <div className="bg-white rounded-lg p-5 shadow-sm space-y-4">
      <form onSubmit={create} className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Create a share link</h2>
        <input className="w-full border rounded p-2 text-slate-800" placeholder="Doctor (e.g. Dr. Arun Prakash, cardiologist)"
          value={label} onChange={e => setLabel(e.target.value)} />
        <div>
          <p className="text-sm font-medium text-slate-700 mb-1">What can they see?</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <label key={c.id} className={`cursor-pointer px-3 py-1 rounded-full border text-sm ${scopes.includes(c.id) ? "bg-teal-600 text-white border-teal-600" : "text-slate-700"}`}>
                <input type="checkbox" className="hidden" checked={scopes.includes(c.id)} onChange={() => toggle(c.id)} />
                {c.label}
              </label>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1">Allergies and current medicines are always included for safety.</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700 mb-1">Expires after</p>
          <select className="border rounded p-2 text-slate-800" value={hours} onChange={e => setHours(Number(e.target.value))}>
            <option value={1}>1 hour</option><option value={24}>24 hours</option><option value={168}>7 days</option>
          </select>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={loading} className="bg-teal-600 text-white rounded px-4 py-2 disabled:opacity-50">
          {loading ? "Creating..." : "Create link"}
        </button>
      </form>

      {url && (
        <div className="border-t pt-4 flex flex-col sm:flex-row gap-4 items-start">
          <QRCodeSVG value={url} size={140} />
          <div className="space-y-2 break-all">
            <p className="text-sm font-medium text-slate-800">Share this link with your doctor:</p>
            <p className="text-sm bg-slate-100 rounded p-2 text-slate-700">{url}</p>
            <button onClick={() => navigator.clipboard.writeText(url)} className="text-sm border rounded px-3 py-1">Copy link</button>
            <p className="text-xs text-amber-700">Shown only once. We store only a hash of this link.</p>
          </div>
        </div>
      )}
    </div>
  );
}