import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  BarcodeFormat,
  DecodeHintType,
  type Result,
} from "@zxing/library";
import { Button } from "@/components/ui/button";
import { X, Keyboard } from "lucide-react";
import { toast } from "sonner";

interface IsbnScannerProps {
  onDetected: (isbn: string) => void;
  onClose: () => void;
  onManualFallback?: () => void;
}

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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handledRef = useRef(false);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });
    let cancelled = false;

    const applyAutofocus = (stream: MediaStream) => {
      const track = stream.getVideoTracks()[0];
      if (!track) return;
      const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & {
        focusMode?: string[];
      };
      const advanced: MediaTrackConstraintSet[] = [];
      if (caps.focusMode?.includes("continuous")) {
        advanced.push({ focusMode: "continuous" } as MediaTrackConstraintSet);
      }
      if (advanced.length) {
        track.applyConstraints({ advanced }).catch(() => undefined);
      }
    };

    const handleResult = (result: Result | undefined) => {
      if (handledRef.current || !result) return;
      const cleaned = result.getText().replace(/[^0-9Xx]/g, "");
      if (cleaned.length !== 13 || !cleaned.startsWith("97")) return;
      handledRef.current = true;
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate?.(120); } catch { /* noop */ }
      }
      beep();
      setFlash(true);
      setTimeout(() => {
        stopAll();
        onDetected(cleaned);
      }, 180);
    };

    const stopAll = () => {
      try { controlsRef.current?.stop(); } catch { /* noop */ }
      controlsRef.current = null;
      const s = streamRef.current;
      if (s) {
        s.getTracks().forEach((t) => { try { t.stop(); } catch { /* noop */ } });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        applyAutofocus(stream);
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        await video.play().catch(() => undefined);
        const controls = await reader.decodeFromVideoElement(video, (res) => {
          if (res) handleResult(res);
        });
        controlsRef.current = controls;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Camera unavailable";
        setError(msg);
        toast.error("Camera permission denied or unavailable. Please type the ISBN manually.");
      }
    })();

    return () => {
      cancelled = true;
      stopAll();
    };
  }, [onDetected]);

  return (
    <div className="rounded-xl border border-border bg-black/90 p-2 flex flex-col gap-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
        />
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
          s?.stop().catch(() => undefined).finally(() => {
            try { s?.clear(); } catch { /* noop */ }
            onManualFallback?.();
            onClose();
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