export type Med = {
  generic_name: string; brand_name: string | null; dose: string | null;
  frequency: string | null; start_date: string; end_date: string | null; category?: string;
};
export type Lab = { test_code: string; value: string | null; unit: string | null; tested_on: string; category?: string };
export type Rule = { test_code: string; test_name: string; review_interval_days: number };

export const toDate = (s: string) => new Date(s.length === 10 ? s + "T00:00:00" : s);

// A medicine is active at a moment if it started on/before it and hadn't ended yet
export function medsActiveAt(meds: Med[], at: Date) {
  return meds.filter(m => toDate(m.start_date) <= at && (!m.end_date || toDate(m.end_date) > at));
}

// Compare the medicine list at `since` with the list now, matched by generic name
export function diffMeds(meds: Med[], since: Date, now = new Date()) {
  const key = (m: Med) => m.generic_name.trim().toLowerCase();
  const before = new Map(medsActiveAt(meds, since).map(m => [key(m), m]));
  const after = new Map(medsActiveAt(meds, now).map(m => [key(m), m]));

  const added: Med[] = [], stopped: Med[] = [], unchanged: Med[] = [];
  const changed: { from: Med; to: Med }[] = [];

  for (const [k, m] of after) {
    const b = before.get(k);
    if (!b) added.push(m);
    else if (b.dose !== m.dose || b.frequency !== m.frequency) changed.push({ from: b, to: m });
    else unchanged.push(m);
  }
  for (const [k, m] of before) if (!after.has(k)) stopped.push(m);

  return { added, stopped, changed, unchanged };
}

// Latest result per test + days elapsed vs an illustrative review interval
export function testReviewStatus(labs: Lab[], rules: Rule[], now = new Date()) {
  const latest = new Map<string, Lab>();
  for (const l of labs) {
    const cur = latest.get(l.test_code);
    if (!cur || l.tested_on > cur.tested_on) latest.set(l.test_code, l);
  }
  return [...latest.values()].map(l => {
    const rule = rules.find(r => r.test_code === l.test_code);
    const daysAgo = Math.floor((now.getTime() - toDate(l.tested_on).getTime()) / 86400000);
    const interval = rule?.review_interval_days ?? null;
    return {
      test_code: l.test_code, test_name: rule?.test_name ?? l.test_code,
      last_done: l.tested_on, value: l.value, unit: l.unit, days_ago: daysAgo,
      interval, within_interval: interval !== null && daysAgo <= interval,
    };
  }).sort((a, b) => a.days_ago - b.days_ago);
}