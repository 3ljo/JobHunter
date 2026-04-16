'use client';

import { useRef, useState } from 'react';
import { Upload, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_PHOTO_BYTES = 500 * 1024; // 500KB
const MAX_DIMENSION = 600; // px — downscale on upload

interface PhotoUploadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

export default function PhotoUpload({ value, onChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setBusy(true);
    try {
      const dataUrl = await downscaleImage(file, MAX_DIMENSION);
      if (dataUrl.length > MAX_PHOTO_BYTES * 1.4) {
        toast.error('Photo is too large even after compression. Try a smaller image.');
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
    <div>
      <div className="flex items-start gap-2 mb-3 rounded-lg px-3 py-2"
        style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)' }}
      >
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
        <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(251,191,36,0.9)' }}>
          Photos reduce ATS compatibility in US, UK, Canada. Use only for European applications
          (Germany, Switzerland, Austria, France).
        </p>
      </div>

      {value ? (
        <div className="flex items-center gap-3 rounded-xl p-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <img
            src={value}
            alt="Profile"
            className="h-14 w-14 rounded-lg object-cover shrink-0"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white/80">Profile photo ready</p>
            <p className="text-[10px] text-white/40">Visible on European template</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.18)' }}
            aria-label="Remove photo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-200"
          style={{
            background: 'rgba(118,77,240,0.1)',
            color: '#c4b5fd',
            border: '1px dashed rgba(118,77,240,0.35)',
          }}
        >
          <Upload className="h-4 w-4" />
          {busy ? 'Processing…' : 'Upload profile photo'}
        </button>
      )}

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
