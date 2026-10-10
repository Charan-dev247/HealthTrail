import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { newToken, hashToken } from "@/lib/tokens";

const ALLOWED = ["general", "diabetes", "cardiac", "mental"];
const HOURS = [1, 24, 168];

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const scopes = (Array.isArray(body.scopes) ? body.scopes : []).filter((s: string) => ALLOWED.includes(s));
  if (!scopes.length) return NextResponse.json({ error: "Pick at least one category" }, { status: 400 });
  const hours = HOURS.includes(Number(body.hours)) ? Number(body.hours) : 24;
  const label = String(body.doctorLabel ?? "").trim().slice(0, 100) || "Doctor";

  const token = newToken();
  const { error } = await supabase.from("shares").insert({
    patient_id: user.id,
    token_hash: hashToken(token),
    doctor_label: label,
    scopes,
    expires_at: new Date(Date.now() + hours * 3600 * 1000).toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // The raw token is returned once and never stored
  return NextResponse.json({ url: `${new URL(req.url).origin}/view/${token}` });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await req.json().catch(() => ({}));
  const { error } = await supabase.from("shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id).is("revoked_at", null); // RLS ensures it's the patient's own share
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}