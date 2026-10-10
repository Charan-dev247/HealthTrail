
"use client";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function EmergencyQR({ token }: { token: string }) {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  if (!origin || !token) return null;
  const url = `${origin}/emergency/${token}`;

  return (
    <section className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-orange-400" />

      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start gap-3 text-left">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-lg text-red-700 ring-1 ring-inset ring-red-100">
            !
          </span>
          <div>
            <h3 className="font-bold text-slate-900">Emergency card</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Quick access to essential health information.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mx-auto flex w-fit items-center justify-center rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
            <QRCodeSVG
              value={url}
              size={160}
              bgColor="#ffffff"
              fgColor="#0f172a"
              level="M"
              marginSize={2}
              title="Emergency medical information QR code"
            />
          </div>
          <p className="mt-3 text-center text-xs font-medium text-slate-500">
            Scan to open emergency information
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
          <p className="text-xs font-semibold text-amber-900">
            Important privacy information
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            The card shows blood group, allergies, conditions, current medicines
            and emergency contact. Every scan is logged.
          </p>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800 transition hover:border-teal-300 hover:bg-teal-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          Preview emergency card
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </section>
  );
}
