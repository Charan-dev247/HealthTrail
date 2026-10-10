"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
        : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-6 rounded-xl shadow space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">HealthTrail</h1>
        <p className="text-sm text-slate-500">
          {mode === "signin" ? "Sign in to your health record" : "Create your account"}
        </p>

        {mode === "signup" && (
          <input className="w-full border rounded p-2 text-slate-800" placeholder="Full name"
            value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        )}
        <input className="w-full border rounded p-2 text-slate-800" type="email" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full border rounded p-2 text-slate-800" type="password" placeholder="Password (min 6 chars)"
          value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button disabled={loading} className="w-full bg-teal-600 text-white rounded p-2 font-medium disabled:opacity-50">
          {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Sign up"}
        </button>
        <button type="button" className="w-full text-sm text-teal-700"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}