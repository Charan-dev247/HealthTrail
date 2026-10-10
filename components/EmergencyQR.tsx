"use client";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function EmergencyQR({ token }: { token: string }) {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  if (!origin || !token) return null;
  const url = `${origin}/emergency/${token}`;

  return (
    <section className="bg-white rounded-lg p-4 shadow-sm text-center space-y-2">
      <h3 className="font-semibold text-slate-800">Emergency card</h3>
      <div className="flex justify-center"><QRCodeSVG value={url} size={140} /></div>
      <p className="text-xs text-slate-500">
        Shows only blood group, allergies, conditions, current medicines and emergency contact. Every scan is logged.
      </p>
      <a href={url} target="_blank" className="text-sm text-teal-700 underline">Preview</a>
    </section>
  );
}