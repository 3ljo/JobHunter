'use client';

import { useRef, useState } from 'react';
import { Upload, X, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_PHOTO_BYTES = 500 * 1024;
const MAX_DIMENSION = 600;

interface PhotoUploadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

export default function PhotoUpload({ value, onChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await downscaleImage(file, MAX_DIMENSION);
      if (dataUrl.length > MAX_PHOTO_BYTES * 1.4) {
        toast.error('Photo too large even after compression. Try a smaller image.');
        return;
      }
      onChange(dataUrl);
      toast.success('Photo added');
    } catch {
      toast.error('Failed to process image');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="flex items-center gap-2 sm:gap-3 rounded-xl px-3 py-2.5"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {value ? (
        <img
          src={value}
          alt="Profile"
          className="h-9 w-9 sm:h-10 sm:w-10 rounded-md object-cover shrink-0"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        />
      ) : (
        <div
          className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-md shrink-0"
          style={{ background: 'rgba(118,77,240,0.1)', border: '1px dashed rgba(118,77,240,0.3)' }}
        >
          <Upload className="h-4 w-4" style={{ color: '#a78bfa' }} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[12px] sm:text-[13px] font-semibold text-white/85 truncate">
            {value ? 'Photo ready' : 'Profile photo'}
          </p>
          <button
            type="button"
            onClick={() => setTipOpen((v) => !v)}
            className="relative shrink-0"
            aria-label="Photo info"
          >
            <Info className="h-3 w-3 text-white/35 hover:text-white/60" />
            {tipOpen && (
              <span
                className="absolute left-0 top-5 z-10 w-56 rounded-md px-2.5 py-2 text-[10px] leading-snug text-left"
                style={{ background: '#0b0e24', border: '1px solid rgba(234,179,8,0.3)', color: 'rgba(251,191,36,0.95)' }}
              >
                Photos reduce ATS compatibility in US/UK/Canada. Use only for EU applications (DE, CH, AT, FR).
              </span>
            )}
          </button>
        </div>
        <p className="text-[10px] sm:text-[11px] text-white/40 truncate">
          {value ? 'Visible on European template' : 'Optional — European template only'}
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-lg px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold whitespace-nowrap"
          style={{
            background: 'rgba(118,77,240,0.18)',
            border: '1px solid rgba(118,77,240,0.35)',
            color: '#c4b5fd',
          }}
        >
          {busy ? 'Processing…' : value ? 'Replace' : 'Upload'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}
            aria-label="Remove photo"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}

async function downscaleImage(file: File, maxSide: number): Promise<string> {
  const img = await loadImage(file);
  const { width, height } = img;
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.85);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('bad image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });
}
