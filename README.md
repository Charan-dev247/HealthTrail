# VCareMed — Your medical history, version-controlled

> VCareMed doesn't just store medical records. It shows **what changed**, **what the next doctor needs to know**, and **exactly who was allowed to see it**.

**Live demo:** : https://health-trail.vercel.app/

**Demo video:** : https://drive.google.com/file/d/1zS7BxtBLVs0lWmGbOwgd2kY0-pFe1Tyu/view?usp=sharing

**Domain:** HealthTech
**Problem statement:** *Lost in Transit: Fragmented Medical Records and Repeated Care Across Providers*

---

## The problem
Patients with long-term conditions such as diabetes or hypertension see many doctors, labs and pharmacies over the years. Their history ends up scattered across paper prescriptions, PDF reports and photos shared on messaging apps. As a result:

- New doctors start from scratch and rely on the patient's memory.
- Tests are repeated because earlier results aren't available.
- Different doctors may prescribe overlapping or interacting medicines.
- Sharing records means forwarding sensitive files over chat, with no way to limit or take back access.
- In an emergency, critical information like allergies is unavailable.

## Our solution
VCareMed treats a patient's medical history like **version-controlled code**:

- Every prescription, lab result, diagnosis and visit is an **immutable entry** with a date, doctor and source.
- A dose change never overwrites the old dose. The old medicine entry is ended and a new one starts, so the **exact medicine list on any past date can be reconstructed**.
- That lets a doctor see a **diff**: *what has changed since I last saw this patient?*
- The patient controls **who sees which part** of the record, **for how long**, and can see **every access**.

## Features

| Feature | What it does | Problem it addresses |
|---|---|---|
| **Unified timeline** | One chronological history across doctors, clinics and labs, with attached reports (PDF / images) | Scattered records |
| **"What changed" diff** | Doctors see medicines started, stopped or dose-changed, new diagnoses and new lab results since their last view, or since any past visit | Unreliable recall, broken continuity |
| **Version history with corrections** | Entries are never edited. A correction is a new entry linked to the original, which stays visible as *superseded* | Trust, traceability |
| **Audited removal** | A wrongly added entry can be removed: it is hidden from the patient and doctors, but the removal and its reason are kept in an insert-only audit table | Data quality without losing accountability |
| **Safety checks before saving a prescription** | Warns about the same molecule under a different brand (Glycomet = Metformin), recorded allergies (Augmentin vs penicillin) and known interactions. A dose change ends the previous entry instead of overwriting it | Conflicting treatment |
| **Scoped sharing** | The patient chooses categories to share: General, Diabetes, Heart/BP, Mental health. Allergies and current medicines are always included for safety | Insecure sharing, privacy |
| **Expiring, revocable links + QR** | Links last 1 hour, 24 hours or 7 days. Revoking is instant; revoked links disappear from the patient's list and the doctor sees "Access revoked" | Insecure sharing |
| **Access log** | Every doctor view and emergency scan is recorded and visible to the patient | Accountability |
| **Recent tests** | Latest result per test and days elapsed, compared with an illustrative review interval | Repeated tests |
| **Emergency QR card** | No-login page with only blood group, allergies, current medicines, conditions and emergency contact. Each scan triggers an alert on the patient's dashboard | Emergencies |

## Architecture

```
Browser (Next.js pages)
   │
   ├── Patient pages ──► Supabase (anon key + Row Level Security:
   │                     each patient can only read/write their own rows)
   │
   └── Doctor / emergency pages ──► Next.js server routes ──► Supabase (service role, server only)
                                     • hash token and look up the share
                                     • check expiry and revocation
                                     • log the access
                                     • return only the shared categories
                                     • compute the diff and test review
```

### Data model (main tables)
| Table | Purpose |
|---|---|
| `profiles` | Patient profile, blood group, emergency contact, emergency token |
| `events` | Timeline entries ("commits"); `supersedes_id` links a correction to the original |
| `medications` | Medicines with `start_date` / `end_date`, which makes point-in-time reconstruction possible |
| `lab_results`, `conditions`, `allergies` | Structured clinical data |
| `shares` | Hashed share tokens, scopes, expiry, revocation |
| `access_logs` | Every doctor view and emergency scan |
| `event_removals` | Insert-only audit trail of removed entries and reasons |
| `test_review_rules` | Illustrative review intervals per test |

### How the diff works
1. A medicine is *active* on a date if it started on or before that date and hadn't ended yet.
2. The app builds the active medicine list at the comparison date and today, matched by generic name.
3. It reports medicines **added**, **stopped** and **dose / frequency changed**, plus new diagnoses and lab results after the comparison date.
4. The comparison date is the doctor's previous view (looked up by registration number), any past visit date the doctor picks, or the last 6 months by default.

## Security model
- **Share tokens:** 256-bit random tokens. Only their **SHA-256 hash** is stored, so a database leak does not expose working links. The raw link is shown to the patient once.
- **Server-side checks on every request:** expiry, revocation and category scope are enforced in the server route, never in the browser.
- **Service-role key** is used only in server code and is never sent to the browser.
- **Row Level Security** on every table. The `events` and `event_removals` tables have **insert and select policies only**, so history cannot be edited or deleted, even by a buggy client.
- **Private file storage:** attached reports are served through **signed URLs valid for 5 minutes**, and doctors only receive links for shared categories.
- **Audit trail** for every doctor view, emergency scan and removal.

### Known limitations
- Clinician identity (name, registration number) is **self-reported**, not verified.
- Safety checks use a **small illustrative dataset**, not a clinical drug database.
- Test review intervals are **illustrative**, not clinical guidance; whether to repeat a test is the clinician's decision.
- Emergency card tokens are stored directly (not hashed) so the printed QR stays valid; production would add rotation.
- All patient data in the demo is **simulated**.

## Tech stack
- **Next.js 16** (App Router, TypeScript): frontend and server routes
- **Tailwind CSS 4**: styling
- **Supabase**: Postgres, Auth, Row Level Security, private Storage
- **Vercel**: hosting

### Open-source libraries and services used
| Library / service | Purpose |
|---|---|
| `next`, `react`, `react-dom` | Web framework |
| `@supabase/supabase-js`, `@supabase/ssr` | Database, auth and storage client |
| `qrcode.react` | QR codes for share links and the emergency card |
| `date-fns` | Date utilities |
| `tailwindcss`, `@tailwindcss/postcss` | Styling |
| Node.js `crypto` (built-in) | Secure random tokens and SHA-256 hashing |
| Supabase (hosted) | Database, authentication, storage |
| Vercel (hosted) | Deployment |

## Try the demo
1. Open the live link and sign in as `ravi@test.com` / `ravi123`.
2. Explore Ravi's 3.5-year history across 3 doctors in 2 cities, including a corrected lab entry shown as superseded.
3. Click **+ Add record** and try a prescription with brand **Glycomet** to see the duplicate-medicine warning, or **Augmentin** to see the allergy warning. (Click **Cancel** to avoid changing the demo data.)
4. Click **Share with a doctor**, choose categories and an expiry, and open the link in another browser or on your phone.
5. Enter any name and a registration number. Use `TN-45821` (Dr. Arun Prakash, who last viewed in Feb 2025 in the seed data) to see the "since your last view" diff. Other numbers default to the last 6 months, and any past visit can be picked from the dropdown.
6. Revoke the link and reload the doctor page: access is denied.
7. Click **Preview** on the emergency card, then return to the dashboard to see the scan alert.

## Run locally
```bash
git clone https://github.com/Charan-dev247/VCareMed.git
cd VCareMed
npm install
```

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_STORAGE_BUCKET=Project_Bucket
```

Set up Supabase:
1. In the SQL Editor, run `supabase/schema.sql`.
2. In Storage, create a **private** bucket named `Project_Bucket`.
3. Under Authentication → Providers → Email, turn off "Confirm email".

Run:
```bash
npm run dev
```
Open http://localhost:3000, sign up as `ravi@test.com`, then run `supabase/seed.sql` in the SQL Editor to load the demo history.

## Project structure
```
app/
  page.tsx                    Landing page
  login/                      Sign in / sign up
  dashboard/                  Patient timeline, add / correct / remove records
  dashboard/share/            Create and revoke links, access log
  view/[token]/               Doctor view (diff, tests, timeline)
  emergency/[token]/          Emergency summary
  api/shares/                 Create / revoke share links
  api/view/[token]/           Validate token, log access, return scoped data
components/                   Timeline, forms, QR, share list
lib/health.ts                 Point-in-time medicines, diff, test review
lib/drugs.ts                  Brand → generic map, allergy and interaction checks
lib/tokens.ts                 Token generation and hashing
supabase/schema.sql           Tables, Row Level Security, triggers
supabase/seed.sql             Demo patient data
```

## Future scope
- Integration with India's **ABHA / ABDM** health ID for verified records and clinician identity
- OCR to extract medicines and lab values from photos of prescriptions and reports
- A full drug-interaction database
- SMS / WhatsApp alerts to family on emergency access
- Break-glass emergency access with verified clinician credentials
- Offline emergency card with digitally signed data

## Team
Charan Sai S - CS24B2026
Varshith Reddy D - CS24B2027
R.K Vamsi - CS24B2034
Shanmukha Sai - CS24B2020
