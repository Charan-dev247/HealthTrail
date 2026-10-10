
import CorrectEntry from "@/components/CorrectEntry";
import RemoveEntry from "@/components/RemoveEntry";

type Event = {
  id: string; type: string; category: string; title: string;
  doctor_name: string | null; provider: string | null;
  event_date: string; notes: string | null; supersedes_id: string | null; file_path?: string | null;
};

const badge: Record<string, string> = {
  prescription: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  lab: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
  diagnosis: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200",
  visit: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  scan: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
};

export default function Timeline({ events, fileUrls = {}, canCorrect = false }: {
  events: Event[]; fileUrls?: Record<string, string>; canCorrect?: boolean;
}) {
  const supersededIds = new Set(events.map(e => e.supersedes_id).filter(Boolean));

  if (!events.length) return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-2xl text-teal-700">
        +
      </span>
      <p className="mt-3 font-semibold text-slate-800">No records yet</p>
      <p className="mt-1 text-sm text-slate-500">Your medical history will appear here when records are added.</p>
    </div>
  );

  return (
    <ol className="relative ml-3 space-y-5 border-l-2 border-teal-100 pl-0 sm:ml-4 sm:space-y-6">
      {events.map(e => {
        const superseded = supersededIds.has(e.id);
        const url = e.file_path ? fileUrls[e.file_path] : undefined;
        return (
          <li key={e.id} className="relative ml-5 min-w-0 sm:ml-7">
            <span className="absolute -left-[31px] top-5 flex h-4 w-4 items-center justify-center rounded-full border-[3px] border-white bg-teal-600 ring-2 ring-teal-100 sm:-left-[39px]">
              <span className="h-1 w-1 rounded-full bg-white" />
            </span>

            <div className={`min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:border-teal-200 hover:shadow-md sm:p-5 ${superseded ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-medium text-slate-600">
                  <span aria-hidden="true">◷</span>
                  {e.event_date}
                </span>

                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badge[e.type] ?? "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200"}`}>
                  {e.type}
                </span>

                <span className="inline-flex rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                  {e.category}
                </span>

                {superseded && (
                  <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                    Superseded by correction
                  </span>
                )}

                {e.supersedes_id && (
                  <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    Correction
                  </span>
                )}
              </div>

              <h3 className={`mt-3 break-words text-base font-bold leading-snug text-slate-900 sm:text-lg ${superseded ? "line-through" : ""}`}>
                {e.title}
              </h3>

              {(e.doctor_name || e.provider) && (
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-slate-500">
                  <span aria-hidden="true" className="text-teal-700">●</span>
                  {[e.doctor_name, e.provider].filter(Boolean).join(" · ")}
                </p>
              )}

              {e.notes && (
                <div className="mt-4 rounded-xl bg-slate-50 px-3.5 py-3 sm:px-4">
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                    {e.notes}
                  </p>
                </div>
              )}

              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex max-w-full items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2.5 text-sm font-semibold text-teal-800 transition hover:bg-teal-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                >
                  <span aria-hidden="true">↗</span>
                  <span className="break-words">View attached report (link valid 5 min)</span>
                </a>
              )}

              {canCorrect && !superseded && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <CorrectEntry event={e} />
                  <RemoveEntry eventId={e.id} type={e.type} />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
