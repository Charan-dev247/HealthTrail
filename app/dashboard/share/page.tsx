import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ShareForm from "@/components/ShareForm";
import ShareList from "@/components/ShareList";

const fmtIST = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

const typeLabel: Record<string, { text: string; cls: string }> = {
  share: { text: "Doctor link", cls: "bg-teal-100 text-teal-800" },
  emergency_basic: { text: "Emergency QR scan", cls: "bg-red-100 text-red-700" },
  break_glass: { text: "Break-glass", cls: "bg-red-600 text-white" },
};

export default async function SharePage() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: shares }, { data: logs }] = await Promise.all([
    supabase.from("shares").select("id, doctor_label, scopes, expires_at, revoked_at, created_at").is("revoked_at", null).order("created_at", { ascending: false }),
    supabase.from("access_logs").select("*").order("accessed_at", { ascending: false }).limit(50),
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-3">
        <Link href="/dashboard" className="text-xl font-bold text-teal-700">← VCareMed</Link>
      </header>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <ShareForm />
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Your links</h2>
          <ShareList shares={shares ?? []} />
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Access log</h2>
          <p className="text-xs text-slate-500 mb-2">Every view of your record is recorded here. Viewer names are self-reported.</p>
          <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500 border-b">
                <tr>
                  <th className="p-2">When (IST)</th>
                  <th className="p-2">Viewer (self-reported)</th>
                  <th className="p-2">Reg. no</th>
                  <th className="p-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {(logs ?? []).length === 0 && (
                  <tr><td colSpan={4} className="p-3 text-slate-500">No one has viewed your record yet.</td></tr>
                )}
                {(logs ?? []).map(l => {
                  const t = typeLabel[l.access_type] ?? { text: l.access_type, cls: "bg-slate-100 text-slate-700" };
                  return (
                    <tr key={l.id} className="border-b last:border-0 text-slate-700">
                      <td className="p-2 whitespace-nowrap">{fmtIST(l.accessed_at)}</td>
                      <td className="p-2">{l.claimed_viewer_name ?? "—"}</td>
                      <td className="p-2">{l.claimed_reg_no ?? "—"}</td>
                      <td className="p-2"><span className={`text-xs px-2 py-0.5 rounded-full ${t.cls}`}>{t.text}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}