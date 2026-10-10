"use client";
import { useRouter } from "next/navigation";

type Share = { id: string; doctor_label: string; scopes: string[]; expires_at: string; revoked_at: string | null; created_at: string };

const fmtIST = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

export default function ShareList({ shares }: { shares: Share[] }) {
  const router = useRouter();

  async function revoke(id: string) {
    await fetch("/api/shares", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    router.refresh();
  }

  if (!shares.length) return <p className="text-sm text-slate-500">No links yet.</p>;

  return (
    <ul className="space-y-2">
      {shares.map(s => {
        const status = s.revoked_at ? "revoked" : new Date(s.expires_at) < new Date() ? "expired" : "active";
        const color = { active: "bg-green-100 text-green-700", revoked: "bg-red-100 text-red-700", expired: "bg-slate-200 text-slate-600" }[status];
        return (
          <li key={s.id} className="bg-white rounded-lg p-3 shadow-sm flex items-center justify-between gap-2">
            <div>
              <p className="font-medium text-slate-800">{s.doctor_label}</p>
              <p className="text-xs text-slate-500">
                {s.scopes.join(", ")} · expires {fmtIST(s.expires_at)}
                {s.revoked_at && <> · revoked {fmtIST(s.revoked_at)}</>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{status}</span>
              {status === "active" && (
                <button onClick={() => revoke(s.id)} className="text-sm text-red-600 border border-red-300 rounded px-2 py-1 hover:bg-red-50">Revoke</button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}