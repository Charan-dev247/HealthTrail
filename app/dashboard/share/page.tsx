import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ShareForm from "@/components/ShareForm";
import ShareList from "@/components/ShareList";

export default async function SharePage() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: shares }, { data: logs }] = await Promise.all([
    supabase.from("shares").select("id, doctor_label, scopes, expires_at, revoked_at, created_at").order("created_at", { ascending: false }),
    supabase.from("access_logs").select("*").order("accessed_at", { ascending: false }).limit(50),
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-3">
        <Link href="/dashboard" className="text-xl font-bold text-teal-700">← HealthTrail</Link>
      </header>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <ShareForm />
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Your links</h2>
          <ShareList shares={shares ?? []} />
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Access log</h2>
          <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500 border-b">
                <tr><th className="p-2">When</th><th className="p-2">Viewer (self-reported)</th><th className="p-2">Reg. no</th><th className="p-2">Type</th></tr>
              </thead>
              <tbody>
                {(logs ?? []).map(l => (
                  <tr key={l.id} className="border-b last:border-0 text-slate-700">
                    <td className="p-2">{new Date(l.accessed_at).toLocaleString()}</td>
                    <td className="p-2">{l.claimed_viewer_name}</td>
                    <td className="p-2">{l.claimed_reg_no}</td>
                    <td className="p-2">{l.access_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}