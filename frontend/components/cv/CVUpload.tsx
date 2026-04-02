'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { analyzeCV } from '@/lib/api';
import { CVAnalysisResult } from '@/types';
import toast from 'react-hot-toast';
import { Upload, FileText, X, Sparkles } from 'lucide-react';

const steps = ['Parsing CV...', 'Auditing ATS...', 'Rewriting...', 'Humanizing...', 'Done'];

interface CVUploadProps {
  onResult: (result: CVAnalysisResult) => void;
}

export default function CVUpload({ onResult }: CVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

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
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 transition-all text-center ${
            isDragActive
              ? 'border-violet-500 bg-violet-500/5'
              : 'border-zinc-700 hover:border-zinc-500 hover:bg-white/[0.02]'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${
              isDragActive ? 'bg-violet-500/10' : 'bg-zinc-800'
            }`}>
              <Upload className={`h-7 w-7 ${isDragActive ? 'text-violet-400' : 'text-zinc-400'}`} />
            </div>
            <div>
              <p className="text-lg font-medium text-zinc-200">
                {isDragActive ? 'Drop your CV here' : 'Drop your CV here or click to browse'}
              </p>
              <p className="text-sm text-zinc-500 mt-1">PDF format, max 5MB</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
            <FileText className="h-5 w-5 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">{file.name}</p>
            <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setFile(null); }}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Job description */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Job Description</label>
        <Textarea
          placeholder="Paste the job description you're targeting..."
          value={jobDescription}
          onChange={(e) => {
            setJobDescription(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          rows={5}
          className="overflow-hidden bg-zinc-900/50 border-zinc-800 focus:border-violet-500/50 focus:ring-violet-500/20 resize-none text-sm"
          disabled={loading}
        />
      </div>

      {/* Analyze button */}
      <Button
        onClick={handleAnalyze}
        disabled={loading || !file}
        className="w-full h-12 text-base font-semibold bg-violet-600 hover:bg-violet-500 text-white gap-2"
      >
        {loading ? (
          'Analyzing...'
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Analyze CV
          </>
        )}
      </Button>

      {/* Progress steps */}
      {loading && (
        <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`flex items-center gap-2 text-sm ${
                i <= step ? 'text-zinc-200' : 'text-zinc-600'
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  i < step ? 'bg-violet-500' : i === step ? 'bg-violet-400 animate-pulse' : 'bg-zinc-700'
                }`}
              />
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
