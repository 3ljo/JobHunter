'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useCVAnalysisStore } from '@/store/cvAnalysisStore';
import toast from 'react-hot-toast';
import { Upload, FileText, X } from 'lucide-react';

const CV_UPLOAD_JD_KEY = 'cv_upload_job_description';

export default function CVUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState(() => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem(CV_UPLOAD_JD_KEY) || '';
  });

  const { loading, startAnalysis } = useCVAnalysisStore();

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

  const handleAnalyze = () => {
    if (!file) { toast.error('Please upload a CV'); return; }
    if (!jobDescription.trim()) { toast.error('Please enter a job description'); return; }
    startAnalysis(file, jobDescription);
  };

  return (
    <div className="w-full space-y-5">

      {/* Dropzone */}
      {!file ? (
        <div
          {...getRootProps()}
          className="cursor-pointer rounded-xl p-6 sm:p-10 text-center transition-all duration-200"
          style={{
            border: isDragActive
              ? '2px dashed rgba(118,77,240,0.8)'
              : '2px dashed rgba(255,255,255,0.1)',
            background: isDragActive
              ? 'rgba(118,77,240,0.08)'
              : 'rgba(255,255,255,0.02)',
            boxShadow: isDragActive ? '0 0 40px -10px rgba(118,77,240,0.25)' : 'none',
          }}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-200"
              style={{
                background: isDragActive ? 'rgba(118,77,240,0.2)' : 'rgba(255,255,255,0.05)',
                border: isDragActive ? '1px solid rgba(118,77,240,0.4)' : '1px solid rgba(255,255,255,0.08)',
                transform: isDragActive ? 'scale(1.1)' : 'scale(1)',
                color: isDragActive ? '#a78bfa' : 'rgba(255,255,255,0.35)',
              }}
            >
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: isDragActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)' }}>
                {isDragActive ? 'Drop your CV here' : 'Drop your CV here or click to browse'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>PDF format · max 5 MB</p>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="flex items-center gap-3 sm:gap-4 rounded-xl px-4 sm:px-5 py-4"
          style={{
            background: 'rgba(118,77,240,0.08)',
            border: '1px solid rgba(118,77,240,0.22)',
          }}
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
            style={{ background: 'rgba(118,77,240,0.18)', border: '1px solid rgba(118,77,240,0.3)' }}
          >
            <FileText className="h-5 w-5" style={{ color: '#a78bfa' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>{file.name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setFile(null); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'; }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Job description */}
      <div className="space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Job Description
        </label>
        <textarea
          placeholder="Paste the job description you're targeting…"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={5}
          disabled={loading}
          className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.8)',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
          onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(118,77,240,0.45)'; }}
          onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
        />
      </div>

      {/* Analyze button */}
      <button
        onClick={handleAnalyze}
        disabled={loading || !file}
        className="btn-aivent fx-slide w-full disabled:opacity-50 disabled:cursor-not-allowed"
        data-hover="ANALYZE NOW"
        style={{ justifyContent: 'center', height: '48px' }}
      >
        {loading ? (
          <span className="flex items-center gap-2.5">
            <span className="lds-roller-sm" style={{ color: '#fff' }}><span /><span /><span /><span /><span /><span /><span /><span /></span>
            Analyzing…
          </span>
        ) : (
          <span>Analyze CV</span>
        )}
      </button>

    </div>
  );
}
