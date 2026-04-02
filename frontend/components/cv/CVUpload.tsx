'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { analyzeCV } from '@/lib/api';
import { CVAnalysisResult } from '@/types';
import toast from 'react-hot-toast';
import { Upload, FileText, X, Sparkles, Check } from 'lucide-react';

const steps = ['Parsing CV...', 'Auditing ATS...', 'Rewriting...', 'Humanizing...', 'Done'];
const CV_UPLOAD_JD_KEY = 'cv_upload_job_description';

interface CVUploadProps {
  onResult: (result: CVAnalysisResult) => void;
}

export default function CVUpload({ onResult }: CVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState(() => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem(CV_UPLOAD_JD_KEY) || '';
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    sessionStorage.setItem(CV_UPLOAD_JD_KEY, jobDescription);
  }, [jobDescription]);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  const handleAnalyze = async () => {
    if (!file) { toast.error('Please upload a CV'); return; }
    if (!jobDescription.trim()) { toast.error('Please enter a job description'); return; }

    setLoading(true);
    setStep(0);

    const interval = setInterval(() => {
      setStep((s) => (s < steps.length - 2 ? s + 1 : s));
    }, 3000);

    try {
      const formData = new FormData();
      formData.append('cv_file', file);
      formData.append('job_description', jobDescription);
      const res = await analyzeCV(formData);
      setStep(steps.length - 1);
      clearInterval(interval);
      // Store inputs for cover letter reuse
      sessionStorage.setItem('cl_job_description', jobDescription);
      if (res.data?.parsed?.raw_text) {
        sessionStorage.setItem('cl_cv_text', res.data.parsed.raw_text);
      } else if (res.data?.final?.final_cv) {
        sessionStorage.setItem('cl_cv_text', JSON.stringify(res.data.final.final_cv));
      }
      onResult(res.data);
      toast.success('CV analysis complete!');
    } catch (err: any) {
      clearInterval(interval);
      toast.error(err.response?.data?.error || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Dropzone */}
      {!file ? (
        <div
          {...getRootProps()}
          className={`group cursor-pointer rounded-2xl border-2 border-dashed p-14 transition-all text-center ${
            isDragActive
              ? 'border-violet-500 bg-violet-500/5 shadow-[0_0_40px_-10px_rgba(139,92,246,0.15)]'
              : 'border-border hover:border-border hover:bg-white/[0.01]'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-5">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all ${
              isDragActive
                ? 'bg-violet-500/15 ring-1 ring-violet-500/30 scale-110'
                : 'bg-muted/60 ring-1 ring-border group-hover:bg-muted group-hover:ring-white/[0.08]'
            }`}>
              <Upload className={`h-7 w-7 transition-colors ${isDragActive ? 'text-violet-400' : 'text-muted-foreground group-hover:text-muted-foreground'}`} />
            </div>
            <div>
              <p className="text-base font-medium text-foreground/80">
                {isDragActive ? 'Drop your CV here' : 'Drop your CV here or click to browse'}
              </p>
              <p className="text-sm text-muted-foreground/60 mt-1.5">PDF format, max 5MB</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/70 px-5 py-4 transition-all">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
            <FileText className="h-5 w-5 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground/90 truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setFile(null); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 hover:text-foreground/80 hover:bg-accent transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Job description */}
      <div className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">Job Description</label>
        <Textarea
          placeholder="Paste the job description you're targeting..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={5}
          className="rounded-xl bg-card/70 border-border focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 resize-none text-sm placeholder:text-muted-foreground/50 transition-all max-h-[200px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          disabled={loading}
        />
      </div>

      {/* Analyze button */}
      <Button
        onClick={handleAnalyze}
        disabled={loading || !file}
        className="group w-full h-12 rounded-xl text-base font-semibold bg-violet-600 hover:bg-violet-500 text-white gap-2.5 transition-all hover:shadow-lg hover:shadow-violet-500/20 active:scale-[0.98]"
      >
        {loading ? (
          <span className="flex items-center gap-2.5">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Analyzing...
          </span>
        ) : (
          <>
            <Sparkles className="h-4 w-4 transition-transform group-hover:scale-110" />
            Analyze CV
          </>
        )}
      </Button>

      {/* Progress steps */}
      {loading && (
        <div className="rounded-2xl border border-border bg-card/70 p-5">
          <div className="space-y-3">
            {steps.map((s, i) => (
              <div
                key={s}
                className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                  i <= step ? 'text-foreground/90' : 'text-muted-foreground/40'
                }`}
              >
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                  i < step
                    ? 'bg-violet-500/20 text-violet-400'
                    : i === step
                    ? 'bg-violet-500/15 ring-2 ring-violet-500/30'
                    : 'bg-muted/50'
                }`}>
                  {i < step ? (
                    <Check className="h-3 w-3" />
                  ) : i === step ? (
                    <div className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                  )}
                </div>
                <span className="font-medium">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
