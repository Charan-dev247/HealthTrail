type Event = {
  id: string; type: string; category: string; title: string;
  doctor_name: string | null; provider: string | null;
  event_date: string; notes: string | null; supersedes_id: string | null; file_path?: string | null;
};

const badge: Record<string, string> = {
  prescription: "bg-blue-100 text-blue-700",
  lab: "bg-purple-100 text-purple-700",
  diagnosis: "bg-amber-100 text-amber-800",
  visit: "bg-green-100 text-green-700",
  scan: "bg-slate-200 text-slate-700",
};

export default function Timeline({ events, fileUrls = {} }: { events: Event[]; fileUrls?: Record<string, string> }) {
  const supersededIds = new Set(events.map(e => e.supersedes_id).filter(Boolean));

  return (
    <ol className="relative border-l-2 border-slate-200 ml-3 space-y-5">
      {events.map(e => {
        const superseded = supersededIds.has(e.id);
        const url = e.file_path ? fileUrls[e.file_path] : undefined;
        return (
          <li key={e.id} className="ml-6">
            <span className="absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full bg-teal-500 border-2 border-white" />
            <div className={`bg-white rounded-lg p-4 shadow-sm ${superseded ? "opacity-50" : ""}`}>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500 font-mono">{e.event_date}</span>
                <span className={`px-2 py-0.5 rounded-full font-medium ${badge[e.type] ?? ""}`}>{e.type}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{e.category}</span>
                {superseded && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700">superseded by correction</span>}
                {e.supersedes_id && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">correction</span>}
              </div>
              <h3 className={`mt-1 font-semibold text-slate-800 ${superseded ? "line-through" : ""}`}>{e.title}</h3>
              {(e.doctor_name || e.provider) && (
                <p className="text-sm text-slate-500">{[e.doctor_name, e.provider].filter(Boolean).join(" · ")}</p>
              )}
              {e.notes && <p className="text-sm text-slate-700 mt-1">{e.notes}</p>}
              {url && (
                <a href={url} target="_blank" className="inline-block mt-2 text-sm text-teal-700 underline">
                  📎 View attached report (link valid 5 min)
                </a>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}