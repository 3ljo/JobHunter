'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { analyzeCV } from '@/lib/api';
import { CVAnalysisResult } from '@/types';
import toast from 'react-hot-toast';

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
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        {file ? (
          <div>
            <p className="font-medium text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
            <p className="text-xs text-gray-400 mt-1">Click or drag to replace</p>
          </div>
        ) : (
          <div>
            <p className="text-gray-600">Drag and drop your CV here, or click to browse</p>
            <p className="text-sm text-gray-400 mt-1">PDF only, max 5MB</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Job Description</Label>
        <textarea
          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Paste the full job description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
      </div>

      <Button onClick={handleAnalyze} disabled={loading || !file} className="w-full">
        {loading ? 'Analyzing...' : 'Analyze CV'}
      </Button>

      {loading && (
        <div className="space-y-2 pt-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`flex items-center gap-2 text-sm ${
                i <= step ? 'text-gray-900' : 'text-gray-300'
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  i < step ? 'bg-green-500' : i === step ? 'bg-yellow-500 animate-pulse' : 'bg-gray-200'
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
