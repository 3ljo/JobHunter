'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { generateCoverLetter } from '@/lib/api';
import toast from 'react-hot-toast';
import { FileSignature, Copy, Check, Sparkles, RotateCcw, Upload, FileText, X, Wand2, Send } from 'lucide-react';

const tones = [
  { key: 'balanced', label: 'Balanced' },
  { key: 'formal', label: 'Formal' },
  { key: 'friendly', label: 'Friendly' },
];

const CL_PAGE_KEY = 'cover_letter_page_state';

function loadSaved() {
  if (typeof window === 'undefined') return null;
  try {
    const s = sessionStorage.getItem(CL_PAGE_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export default function CoverLetterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState(() => loadSaved()?.jobDescription ?? '');
  const [tone, setTone] = useState(() => loadSaved()?.tone ?? 'balanced');
  const [result, setResult] = useState(() => loadSaved()?.result ?? '');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refineInput, setRefineInput] = useState('');
  const [refining, setRefining] = useState(false);

  // Persist state across tab switches
  useEffect(() => {
    sessionStorage.setItem(CL_PAGE_KEY, JSON.stringify({ jobDescription, tone, result }));
  }, [jobDescription, tone, result]);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  const handleGenerate = async () => {
    if (!file) { toast.error('Please upload your CV'); return; }
    if (!jobDescription.trim()) { toast.error('Paste the job description'); return; }

    setLoading(true);
    try {
      // Read PDF as text via the backend
      const formData = new FormData();
      formData.append('cv_file', file);
      formData.append('job_description', jobDescription);
      formData.append('tone', tone);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cover-letter/generate-from-pdf`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate');
      }

      const data = await res.json();
      setResult(data.cover_letter);
      toast.success('Cover letter generated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefine = async () => {
    if (!refineInput.trim() || !result) return;
    setRefining(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cover-letter/refine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ cover_letter: result, instructions: refineInput }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to refine');
      }
      const data = await res.json();
      setResult(data.cover_letter);
      setRefineInput('');
      toast.success('Cover letter updated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to refine');
    } finally {
      setRefining(false);
    }
  };

  const ready = !!file && jobDescription.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
          <FileSignature className="h-4 w-4 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Cover Letter</h1>
          <p className="text-muted-foreground text-xs">Upload your CV and paste a job description to generate a tailored cover letter</p>
        </div>
      </div>

      {!result ? (
        <div className="space-y-6 max-w-3xl mx-auto pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left — CV Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your CV</Label>
              {!file ? (
                <div
                  {...getRootProps()}
                  className={`group cursor-pointer rounded-2xl border-2 border-dashed p-10 transition-all text-center h-[280px] flex items-center justify-center ${
                    isDragActive
                      ? 'border-violet-500 bg-violet-500/5'
                      : 'border-border hover:border-border hover:bg-accent/30'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-4">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all ${
                      isDragActive
                        ? 'bg-violet-500/15 ring-1 ring-violet-500/30 scale-110'
                        : 'bg-muted/60 ring-1 ring-border group-hover:bg-muted'
                    }`}>
                      <Upload className={`h-6 w-6 transition-colors ${isDragActive ? 'text-violet-400' : 'text-muted-foreground group-hover:text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground/80">
                        {isDragActive ? 'Drop your CV here' : 'Drop your CV or click to browse'}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">PDF format, max 5MB</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/70 px-5 py-4 h-[280px]">
                  <div className="flex flex-col items-center justify-center w-full gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                      <FileText className="h-5 w-5 text-violet-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground/90 truncate max-w-[200px]">{file.name}</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground/80 transition-colors mt-1"
                    >
                      <X className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right — Job Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Job Description</Label>
              <Textarea
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="rounded-2xl bg-card/70 border-border focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 resize-none text-sm placeholder:text-muted-foreground/50 h-[280px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                disabled={loading}
              />
            </div>
          </div>

          {/* Tone + Generate */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Tone</span>
              {tones.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTone(t.key)}
                  disabled={loading}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    tone === t.key
                      ? 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30'
                      : 'text-muted-foreground hover:text-foreground/80 hover:bg-muted/50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <Button
              onClick={handleGenerate}
              disabled={loading || !ready}
              className="group gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-violet-500/20 active:scale-[0.98] ml-auto"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Generating...
                </span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 transition-transform group-hover:scale-110" />
                  Generate Cover Letter
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCopy}
              className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white hover:shadow-lg hover:shadow-violet-500/20 transition-all"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setResult('')}
              className="gap-2 rounded-xl border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              Regenerate
            </Button>
          </div>
          <div className="rounded-2xl border border-border bg-card/70 p-8">
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{result}</p>
          </div>

          {/* AI Refine */}
          <div className="rounded-2xl border border-border bg-card/70 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="h-4 w-4 text-violet-400" />
              <span className="text-xs font-semibold text-foreground/80">Refine with AI</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={refineInput}
                onChange={(e) => setRefineInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !refining) handleRefine(); }}
                placeholder="e.g. Make it shorter, add more enthusiasm, emphasize leadership..."
                className="flex-1 h-10 rounded-xl border border-border bg-background/50 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-violet-500/40 focus:outline-none focus:ring-1 focus:ring-violet-500/20 transition-all"
                disabled={refining}
              />
              <Button
                onClick={handleRefine}
                disabled={refining || !refineInput.trim()}
                className="h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all hover:shadow-lg hover:shadow-violet-500/20 active:scale-[0.98] px-4"
              >
                {refining ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
