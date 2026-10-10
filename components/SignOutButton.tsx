"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => { await createClient().auth.signOut(); router.push("/login"); router.refresh(); }}
      className="text-sm text-slate-600 border rounded px-3 py-1 hover:bg-slate-100">
      Sign out
    </button>
  );
}