import { redirect } from "next/navigation";
import { connection } from "next/server";       
import { createClient } from "@/lib/supabase/server";

export default async function Dashboard() {
   await connection();      
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <h1 className="text-2xl font-bold text-slate-800">
        Welcome, {profile?.full_name ?? user.email}
      </h1>
      <p className="text-slate-500">{user.email}</p>
    </main>
  );
}