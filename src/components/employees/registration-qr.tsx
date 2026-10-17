"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

type RegistrationQrResponse = { qrCode: string; expiresAt: string };

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load registration QR artwork."));
    image.src = src;
  });
}

async function addLogoToQr(qrCode: string) {
  const [qrImage, logoImage] = await Promise.all([
    loadImage(qrCode),
    loadImage("/smarttimelog.png"),
  ]);
  const size = qrImage.naturalWidth;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to draw registration QR code.");

  context.drawImage(qrImage, 0, 0, size, size);
  const plateSize = Math.round(size * 0.2);
  const plateStart = Math.round((size - plateSize) / 2);
  const logoSize = Math.round(size * 0.16);
  const logoStart = Math.round((size - logoSize) / 2);

  context.fillStyle = "#fff";
  context.fillRect(plateStart, plateStart, plateSize, plateSize);
  context.drawImage(logoImage, logoStart, logoStart, logoSize, logoSize);

  return canvas.toDataURL("image/png");
}

export function RegistrationQr() {
  const [current, setCurrent] = useState<RegistrationQrResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let requestNumber = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      const request = ++requestNumber;
      try {
        const response = await fetch("/api/admin/registration-qr", { cache: "no-store" });
        if (!response.ok) throw new Error("Registration QR request failed.");
        const next = (await response.json()) as RegistrationQrResponse;
        const brandedQrCode = await addLogoToQr(next.qrCode);
        if (!active || request !== requestNumber) return;
        setCurrent({ ...next, qrCode: brandedQrCode });
        setError(false);
        const remaining = Date.parse(next.expiresAt) - Date.now();
        timer = setTimeout(load, Math.max(1000, Math.min(remaining + 1000, 30 * 60 * 1000)));
      } catch {
        if (!active || request !== requestNumber) return;
        setCurrent(null);
        setError(true);
        timer = setTimeout(load, 30 * 1000);
      }
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        if (timer) clearTimeout(timer);
        void load();
      }
    }

    void load();
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      active = false;
      requestNumber++;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  function downloadQr() {
    if (!current || Date.parse(current.expiresAt) <= Date.now()) return;
    const link = document.createElement("a");
    link.href = current.qrCode;
    link.download = "smarttimelog-registration-qr.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <section className="border-t border-white/8 px-5 py-5" aria-label="Employee registration QR code">
      <h2 className="text-sm font-semibold text-white">Employee registration QR code</h2>
      <p className="mt-2 text-xs text-slate-400">Scan this code during employee registration. It refreshes every 30 minutes.</p>
      {current ? (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* The image is a server-generated data URL, not a remote image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Current employee registration QR code" className="size-52 rounded-md bg-white p-2" src={current.qrCode} />
          <div className="flex flex-col items-start gap-3">
            <p className="text-xs text-slate-400">Expires {new Date(current.expiresAt).toLocaleString()}</p>
            <button className="focus-ring flex h-10 items-center gap-2 rounded-md border border-white/10 px-4 text-xs font-medium text-emerald-200 hover:border-emerald-300/50 hover:text-white" onClick={downloadQr} type="button"><Download className="size-4" />Download QR</button>
          </div>
        </div>
      ) : <p className="mt-4 text-xs text-slate-400">Loading QR code...</p>}
      {error ? <p className="mt-3 text-xs text-rose-300" role="alert">Unable to refresh the QR code. Retrying shortly.</p> : null}
    </section>
  );
}
