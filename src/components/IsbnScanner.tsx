import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";

interface IsbnScannerProps {
  onDetected: (isbn: string) => void;
  onClose: () => void;
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
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const instance = new Html5Qrcode(REGION_ID, { verbose: false });
    scannerRef.current = instance;

    instance
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 140 } },
        (decoded) => {
          if (handledRef.current) return;
          const cleaned = decoded.replace(/[^0-9Xx]/g, "");
          if (cleaned.length !== 13 || !cleaned.startsWith("97")) return;
          handledRef.current = true;
          beep();
          setFlash(true);
          setTimeout(() => {
            instance
              .stop()
              .catch(() => undefined)
              .finally(() => {
                instance.clear();
                onDetected(cleaned);
              });
          }, 180);
        },
        () => undefined,
      )
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Camera unavailable";
        setError(msg);
        toast.error("Could not start camera: " + msg);
      });

    return () => {
      const s = scannerRef.current;
      if (!s) return;
      s.stop()
        .catch(() => undefined)
        .finally(() => {
          try {
            s.clear();
          } catch {
            /* noop */
          }
        });
    };
  }, [onDetected]);

  return (
    <div className="rounded-xl border border-border bg-black/90 p-2 flex flex-col gap-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <div id={REGION_ID} className="absolute inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[40%] w-[70%] rounded-md border-2 border-primary/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
        </div>
        {flash && <div className="absolute inset-0 bg-white animate-in fade-in-0 fade-out-0" />}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-white">
            {error}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-xs text-white/80">Point camera at the ISBN barcode</span>
        <Button type="button" size="sm" variant="secondary" onClick={onClose} className="gap-1.5">
          <X className="size-3.5" /> Close camera
        </Button>
      </div>
    </div>
  );
}