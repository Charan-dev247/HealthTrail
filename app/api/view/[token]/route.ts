import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/tokens";
import { diffMeds, medsActiveAt, testReviewStatus, toDate } from "@/lib/health";

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim().slice(0, 100);
  const regNo = String(body.regNo ?? "").trim().slice(0, 50);
  if (!name || !regNo)
    return NextResponse.json({ error: "Name and registration number are required." }, { status: 400 });

  const db = createAdminClient();

  // 1. Validate the token on the server, every request
  const { data: share } = await db.from("shares").select("*")
    .eq("token_hash", hashToken(token)).maybeSingle();
  if (!share) return NextResponse.json({ error: "This link is invalid." }, { status: 404 });
  if (share.revoked_at) return NextResponse.json({ error: "Access revoked by the patient." }, { status: 403 });
  if (new Date(share.expires_at) < new Date())
    return NextResponse.json({ error: "This link has expired." }, { status: 403 });

  const pid = share.patient_id;
  const scopes: string[] = share.scopes;
  const now = new Date();

  // 2. When did this doctor (by reg no) last view? Look it up BEFORE logging this view
  const { data: prev } = await db.from("access_logs").select("accessed_at")
    .eq("patient_id", pid).eq("claimed_reg_no", regNo)
    .order("accessed_at", { ascending: false }).limit(1).maybeSingle();

  // 3. Log this access
  await db.from("access_logs").insert({
    patient_id: pid, share_id: share.id, claimed_viewer_name: name,
    claimed_reg_no: regNo, access_type: "share",
  });

  // 4. Fetch ONLY the allowed categories (allergies + current meds always shown for safety)
  const [{ data: profile }, { data: allergies }, { data: conditions }, { data: meds },
         { data: events }, { data: labs }, { data: rules }] = await Promise.all([
    db.from("profiles").select("full_name, dob, blood_group").eq("id", pid).single(),
    db.from("allergies").select("substance, reaction, severity").eq("patient_id", pid),
    db.from("conditions").select("name, diagnosed_on, category").eq("patient_id", pid).in("category", scopes),
    db.from("medications").select("generic_name, brand_name, dose, frequency, start_date, end_date, category").eq("patient_id", pid),
    db.from("events").select("id, type, category, title, doctor_name, provider, event_date, notes, supersedes_id, file_path")
      .eq("patient_id", pid).in("category", scopes)
      .order("event_date", { ascending: false }).order("created_at", { ascending: false }),
    db.from("lab_results").select("test_code, value, unit, tested_on, category").eq("patient_id", pid).in("category", scopes),
    db.from("test_review_rules").select("*"),
  ]);

  // 5. Decide the comparison point
  let since: Date;
  let basis: "chosen" | "last_view" | "default";
  if (body.since && !isNaN(Date.parse(body.since))) { since = new Date(body.since); basis = "chosen"; }
  else if (prev) { since = new Date(prev.accessed_at); basis = "last_view"; }
  else { since = new Date(now.getTime() - 180 * 86400000); basis = "default"; }
  // 6. Short-lived signed links for attached files in shared categories only
  const paths = (events ?? []).filter(e => e.file_path).map(e => e.file_path as string);
  const fileUrls: Record<string, string> = {};
  if (paths.length) {
    const { data: signed } = await db.storage
      .from(process.env.NEXT_PUBLIC_STORAGE_BUCKET!)
      .createSignedUrls(paths, 300);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) fileUrls[s.path] = s.signedUrl;
    }
  }
  const visitDates = [...new Set((events ?? [])
    .filter(e => ["prescription", "diagnosis", "visit"].includes(e.type))
    .map(e => e.event_date))];

  return NextResponse.json({
    patient: profile,
    allergies: allergies ?? [],
    conditions: conditions ?? [],
    currentMeds: medsActiveAt(meds ?? [], now),
    diff: {
      since: since.toISOString(), basis,
      ...diffMeds(meds ?? [], since, now),
      newLabs: (labs ?? []).filter(l => toDate(l.tested_on) > since)
        .sort((a, b) => b.tested_on.localeCompare(a.tested_on)),
      newConditions: (conditions ?? []).filter(c => c.diagnosed_on && toDate(c.diagnosed_on) > since),
    },
    tests: testReviewStatus(labs ?? [], rules ?? [], now),
    timeline: events ?? [],
    fileUrls,
    scopes, expiresAt: share.expires_at, visitDates,
  });
}