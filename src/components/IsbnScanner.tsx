import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
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

export function IsbnScanner({ onDetected, onClose }: IsbnScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const lastDecodeRef = useRef(0);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDetectedRef = useRef(onDetected);
  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let isMounted = true;

    const instance = new Html5Qrcode(REGION_ID, {
      verbose: false,
      formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13],
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true,
      },
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
          try {
            const video = document.querySelector(`#${REGION_ID} video`) as HTMLVideoElement | null;
            const stream = video?.srcObject as MediaStream | null;
            stream?.getTracks().forEach((t) => t.stop());
            if (video) video.srcObject = null;
          } catch {
            /* noop */
          }
          scannerRef.current = null;
        });
    };

    const initTimeout = setTimeout(() => {
      if (!isMounted) return;
      instance
        .start(
          { facingMode: "environment" },
          {
            fps: 15,
            /* 🛠️ Adjusted the engine's capture bounding box properties to match your layout frame */
            qrbox: (vw: number, vh: number) => {
              const width = Math.min(vw * 0.90, 340);
              const height = Math.min(vh * 0.20, 80);
              return { width, height };
            },
            disableFlip: true,
          },
          (decoded) => {
            if (handledRef.current) return;
            const now = Date.now();
            if (now - lastDecodeRef.current < 200) return;
            lastDecodeRef.current = now;
            const cleaned = decoded.replace(/[^0-9Xx]/g, "");
            if (cleaned.length >= 12 && cleaned.startsWith("97")) {
              handledRef.current = true;
              if (typeof navigator !== "undefined" && "vibrate" in navigator) {
                try {
                  navigator.vibrate?.(120);
                } catch {
                  /* noop */
                }
              }
              beep();
              setFlash(true);
              setTimeout(() => {
                stopAndClear().finally(() => onDetectedRef.current(cleaned));
              }, 100);
            }
          },
          () => undefined,
        )
        .catch((err: unknown) => {
          if (!isMounted) return;
          const msg = err instanceof Error ? err.message : "Camera unavailable";
          setError(msg);
          toast.error("Camera permission denied or unavailable. Please type the ISBN manually.");
        });
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
      stopAndClear();
    };
  }, []);

  return (
    <div className="rounded-xl border border-border bg-black/90 p-2 flex flex-col gap-2">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-black">
        <div id={REGION_ID} className="absolute inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />

        {/* 🛠️ Aligned the visual overlay borders to use identical width/height configurations */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
          <div className="relative h-[20%] w-[90%] rounded-xl border-2 border-emerald-400 bg-emerald-500/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
            <div className="absolute left-0 right-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)]" />
          </div>
        </div>

        {flash && <div className="absolute inset-0 bg-white animate-in fade-in-0 fade-out-0" />}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center text-xs text-white">
            {error}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 px-1 mt-1">
        <span className="text-[11px] font-medium text-white/90 leading-tight">
          Center barcode on red line
          <br />
          <span className="text-white/60 font-normal">请将条形码对准红线</span>
        </span>
        <Button type="button" size="sm" variant="secondary" onClick={onClose} className="h-8 text-xs gap-1">
          Close / 关闭
        </Button>
      </div>
    </div>
  );
}
