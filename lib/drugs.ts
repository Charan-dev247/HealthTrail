// Small illustrative dataset for the demo, not a clinical drug database.
export const BRAND_TO_GENERIC: Record<string, string> = {
  glycomet: "Metformin", glucophage: "Metformin", gluconorm: "Metformin",
  amlong: "Amlodipine", amlokind: "Amlodipine", stamlo: "Amlodipine",
  atorva: "Atorvastatin", lipitor: "Atorvastatin", storvas: "Atorvastatin",
  rosuvas: "Rosuvastatin", crestor: "Rosuvastatin",
  januvia: "Sitagliptin", istavel: "Sitagliptin",
  ecosprin: "Aspirin", disprin: "Aspirin",
  warf: "Warfarin", coumadin: "Warfarin",
  azithral: "Azithromycin", azee: "Azithromycin",
  augmentin: "Amoxicillin + Clavulanate", mox: "Amoxicillin",
  telma: "Telmisartan", losar: "Losartan", envas: "Enalapril",
  septran: "Cotrimoxazole",
};

export const INTERACTIONS: [string, string, string][] = [
  ["warfarin", "aspirin", "Increased bleeding risk"],
  ["atorvastatin", "rosuvastatin", "Two statins together: likely duplicate therapy"],
  ["enalapril", "telmisartan", "ACE inhibitor + ARB: kidney / potassium risk"],
  ["enalapril", "losartan", "ACE inhibitor + ARB: kidney / potassium risk"],
];

export const ALLERGY_CLASSES: Record<string, string[]> = {
  penicillin: ["penicillin", "amoxicillin", "ampicillin"],
  sulfonamides: ["cotrimoxazole", "sulfamethoxazole"],
};

export type Warning = { kind: "allergy" | "interaction" | "duplicate"; message: string; existingId?: string };

const norm = (s: string) => s.trim().toLowerCase();

export function toGeneric(nameOrBrand: string) {
  return BRAND_TO_GENERIC[norm(nameOrBrand)] ?? null;
}

export function checkMeds(
  newMeds: { generic_name: string; brand_name: string; dose: string }[],
  current: { id: string; generic_name: string; dose: string | null; brand_name: string | null }[],
  allergies: { substance: string }[],
): Warning[] {
  const warnings: Warning[] = [];
  for (const m of newMeds) {
    const g = norm(m.generic_name);

    for (const a of allergies) {
      const cls = ALLERGY_CLASSES[norm(a.substance)] ?? [norm(a.substance)];
      if (cls.some(c => g.includes(c)))
        warnings.push({ kind: "allergy", message: `${m.brand_name || m.generic_name} (${m.generic_name}) may conflict with recorded allergy: ${a.substance}` });
    }

    const dup = current.find(c => norm(c.generic_name) === g);
    if (dup)
      warnings.push({
        kind: "duplicate", existingId: dup.id,
        message: `${m.brand_name || m.generic_name} is ${dup.generic_name}, which is already being taken (${dup.dose ?? ""}${dup.brand_name ? `, as ${dup.brand_name}` : ""}).`,
      });

    const others = [
      ...current.map(c => norm(c.generic_name)),
      ...newMeds.map(n => norm(n.generic_name)),
    ].filter(x => x !== g);
    for (const [a, b, why] of INTERACTIONS) {
      if ((g === a && others.includes(b)) || (g === b && others.includes(a)))
        warnings.push({ kind: "interaction", message: `${a} + ${b}: ${why}` });
    }
  }
  return warnings.filter((w, i, arr) => arr.findIndex(x => x.message === w.message) === i);
}