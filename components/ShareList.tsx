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

  if (!shares.length)
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-6 w-6"
          >
            <path d="M12 8v8m-4-4h8" strokeLinecap="round" />
            <rect x="3" y="3" width="18" height="18" rx="4" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-800">No share links yet</p>
        <p className="mt-1 max-w-xs text-sm leading-5 text-slate-500">
          Links you create to share medical records with your doctor will appear here.
        </p>
      </div>
    );

  return (
    <ul className="space-y-3">
      {shares.map(s => {
        const status = s.revoked_at ? "revoked" : new Date(s.expires_at) < new Date() ? "expired" : "active";
        const color = {
          active: "border-emerald-200 bg-emerald-50 text-emerald-700",
          revoked: "border-red-200 bg-red-50 text-red-700",
          expired: "border-slate-200 bg-slate-100 text-slate-600",
        }[status];

        return (
          <li
            key={s.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 sm:p-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="h-5 w-5"
                  >
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
                    <path d="M12 14v3" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="break-words font-semibold text-slate-900">
                    {s.doctor_label || "Unnamed recipient"}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${color}`}>
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          status === "active"
                            ? "bg-emerald-500"
                            : status === "revoked"
                              ? "bg-red-500"
                              : "bg-slate-400"
                        }`}
                      />
                      {status}
                    </span>
                    <span className="text-xs text-slate-400">
                      Created {fmtIST(s.created_at)}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Shared categories
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {s.scopes.map(scope => (
                          <span
                            key={scope}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium capitalize text-slate-600"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs leading-5 text-slate-500">
                      <span className="font-medium text-slate-600">
                        Expires:
                      </span>{" "}
                      {fmtIST(s.expires_at)}
                    </p>

                    {s.revoked_at && (
                      <p className="text-xs leading-5 text-red-600">
                        <span className="font-medium">Revoked:</span>{" "}
                        {fmtIST(s.revoked_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center sm:justify-end">
                {status === "active" && (
                  <button
                    type="button"
                    onClick={() => revoke(s.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-500/10"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-4 w-4"
                    >
                      <path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Revoke access
                  </button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}