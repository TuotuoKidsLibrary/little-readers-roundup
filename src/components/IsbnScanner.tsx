import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { X, Keyboard } from "lucide-react";
import { toast } from "sonner";

interface IsbnScannerProps {
  onDetected: (isbn: string) => void;
  onClose: () => void;
  onManualFallback?: () => void;
}

const REGION_ID = "isbn-scanner-region";

function beep() {
  try {
    const Ctx =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 140);
  } catch {
    /* noop */
  }
}

export function IsbnScanner({ onDetected, onClose, onManualFallback }: IsbnScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const lastDecodeRef = useRef(0);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const instance = new Html5Qrcode(REGION_ID, {
      verbose: false,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
      ],
      useBarCodeDetectorIfSupported: true,
    });
    scannerRef.current = instance;

    const stopAndClear = () => {
      const s = scannerRef.current;
      if (!s) return Promise.resolve();
      return s
        .stop()
        .catch(() => undefined)
        .finally(() => {
          try {
            s.clear();
          } catch {
            /* noop */
          }
          // Force-release any lingering MediaStream tracks
          try {
            const video = document.querySelector(
              `#${REGION_ID} video`,
            ) as HTMLVideoElement | null;
            const stream = video?.srcObject as MediaStream | null;
            stream?.getTracks().forEach((t) => t.stop());
            if (video) video.srcObject = null;
          } catch {
            /* noop */
          }
          scannerRef.current = null;
        });
    };

    instance
      .start(
        { facingMode: "environment" },
        {
          fps: 4,
          qrbox: { width: 280, height: 120 },
          aspectRatio: 1.7777,
          disableFlip: true,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        },
        (decoded) => {
          if (handledRef.current) return;
          const now = Date.now();
          if (now - lastDecodeRef.current < 250) return;
          lastDecodeRef.current = now;
          const cleaned = decoded.replace(/[^0-9Xx]/g, "");
          if (cleaned.length !== 13 || !cleaned.startsWith("97")) return;
          handledRef.current = true;
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            try { navigator.vibrate?.(120); } catch { /* noop */ }
          }
          beep();
          setFlash(true);
          setTimeout(() => {
            stopAndClear().finally(() => onDetected(cleaned));
          }, 180);
        },
        () => undefined,
      )
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Camera unavailable";
        setError(msg);
        toast.error("Camera permission denied or unavailable. Please type the ISBN manually.");
      });

    return () => {
      stopAndClear();
    };
  }, [onDetected]);

  return (
    <div className="rounded-xl border border-border bg-black/90 p-2 flex flex-col gap-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
        <div id={REGION_ID} className="absolute inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-[70%] w-[70%] rounded-lg border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
            <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
          </div>
        </div>
        {flash && <div className="absolute inset-0 bg-white animate-in fade-in-0 fade-out-0" />}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-white">
            {error}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-xs text-white/80">Align the barcode within the red line</span>
        <Button type="button" size="sm" variant="secondary" onClick={onClose} className="gap-1.5">
          <X className="size-3.5" /> Close camera
        </Button>
      </div>
      <button
        type="button"
        onClick={() => {
          const s = scannerRef.current;
          const done = () => {
            try {
              const video = document.querySelector(
                `#${REGION_ID} video`,
              ) as HTMLVideoElement | null;
              const stream = video?.srcObject as MediaStream | null;
              stream?.getTracks().forEach((t) => t.stop());
              if (video) video.srcObject = null;
            } catch { /* noop */ }
            scannerRef.current = null;
            onManualFallback?.();
            onClose();
          };
          if (!s) return done();
          s.stop().catch(() => undefined).finally(() => {
            try { s.clear(); } catch { /* noop */ }
            done();
          });
        }}
        className="mt-1 flex items-center justify-center gap-1.5 rounded-md bg-white/90 hover:bg-white text-foreground text-xs font-medium py-2 transition-colors"
      >
        <Keyboard className="size-3.5" />
        Camera having trouble autofocusing? Click here to type ISBN manually
      </button>
    </div>
  );
}