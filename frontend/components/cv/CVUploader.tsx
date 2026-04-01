'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { analyzeCV } from '@/lib/api';
import { CVAnalysisResult } from '@/types';
import toast from 'react-hot-toast';
import { Upload, FileText, X } from 'lucide-react';

const steps = ['Parsing CV...', 'Auditing ATS...', 'Rewriting...', 'Humanizing...', 'Done'];

interface CVUploaderProps {
  onResult: (result: CVAnalysisResult) => void;
}

export default function CVUploader({ onResult }: CVUploaderProps) {
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
    <div className="space-y-4">
      {/* File upload — compact */}
      {!file ? (
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-lg border border-dashed px-4 py-3 transition-colors flex items-center gap-3 ${
            isDragActive ? 'border-foreground bg-muted' : 'border-border hover:border-foreground/30'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-sm text-muted-foreground">
              {isDragActive ? 'Drop your CV here' : 'Upload CV'}
            </p>
            <p className="text-xs text-muted-foreground/60">PDF, max 5MB</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setFile(null); }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Job description */}
      <Textarea
        placeholder="Paste the job description here..."
        value={jobDescription}
        onChange={(e) => {
          setJobDescription(e.target.value);
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
        }}
        rows={4}
        className="overflow-hidden"
        disabled={loading}
      />

      {/* Analyze button */}
      <Button onClick={handleAnalyze} disabled={loading || !file} className="w-full">
        {loading ? 'Analyzing...' : 'Analyze CV'}
      </Button>

      {/* Progress steps */}
      {loading && (
        <div className="flex items-center gap-3 flex-wrap pt-1">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`flex items-center gap-1.5 text-xs ${
                i <= step ? 'text-foreground' : 'text-muted-foreground/30'
              }`}
            >
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  i < step ? 'bg-green-500' : i === step ? 'bg-yellow-500 animate-pulse' : 'bg-muted'
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
