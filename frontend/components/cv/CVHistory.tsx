'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getCVHistory, deleteCV, downloadCVPdf, previewCVPdf } from '@/lib/api';
import { CVRecord } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { Eye, X, Download, Trash2, FileText, Calendar } from 'lucide-react';

export default function CVHistory() {
  const [cvs, setCvs] = useState<CVRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const load = async () => {
    try {
      const res = await getCVHistory();
      setCvs(res.data.cvs);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleDelete = async (id: string) => {
    try {
      await deleteCV(id);
      setCvs((prev) => prev.filter((cv) => cv.id !== id));
      toast.success('CV deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleDownload = async (id: string) => {
    try {
      await downloadCVPdf(id);
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  const handlePreview = async (id: string) => {
    setPreviewLoading(true);
    try {
      const url = await previewCVPdf(id);
      setPreviewUrl(url);
    } catch {
      toast.error('Failed to load preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  function getScoreColor(score: number | null | undefined): string {
    if (!score) return 'text-zinc-500';
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  }

  if (loading) return <LoadingSpinner className="mt-12" />;

  if (cvs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800/50 mb-4">
          <FileText className="h-6 w-6 text-zinc-600" />
        </div>
        <p className="text-sm font-medium text-zinc-400">No CV analyses yet</p>
        <p className="text-xs text-zinc-600 mt-1">Upload and analyze your first CV to see history here.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block rounded-2xl border border-white/[0.06] bg-zinc-900/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">Date</th>
              <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">File</th>
              <th className="px-6 py-3.5 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {cvs.map((cv, i) => (
              <tr
                key={cv.id}
                className={`transition-colors hover:bg-white/[0.02] ${i < cvs.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
              >
                <td className="px-6 py-4 text-zinc-500 tabular-nums">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-zinc-600" />
                    {new Date(cv.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                      <FileText className="h-3.5 w-3.5 text-violet-400" />
                    </div>
                    <span className="font-medium text-zinc-200">{cv.file_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handlePreview(cv.id)}
                      title="Preview CV"
                      className="text-zinc-500 hover:text-white"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handleDownload(cv.id)}
                      title="Download PDF"
                      className="text-zinc-500 hover:text-white"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handleDelete(cv.id)}
                      title="Delete"
                      className="text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {cvs.map((cv) => (
          <div key={cv.id} className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                  <FileText className="h-4 w-4 text-violet-400" />
                </div>
                <p className="text-sm font-medium text-zinc-200 truncate">{cv.file_name}</p>
              </div>
              <span className="text-[11px] text-zinc-600 shrink-0 ml-2 tabular-nums">
                {new Date(cv.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex gap-2 pt-1 border-t border-white/[0.04]">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handlePreview(cv.id)}
                className="flex-1 gap-1.5 text-zinc-400 hover:text-white rounded-lg text-xs"
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="flex-1 gap-1.5 text-zinc-400 hover:text-white rounded-lg text-xs"
                onClick={() => handleDownload(cv.id)}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-zinc-500 hover:text-red-400 rounded-lg text-xs"
                onClick={() => handleDelete(cv.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {(previewUrl || previewLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl h-[85vh] mx-4 rounded-2xl border border-white/[0.06] bg-zinc-950 shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">CV Preview</h3>
              <button
                onClick={closePreview}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              {previewLoading ? (
                <div className="flex items-center justify-center h-full">
                  <LoadingSpinner />
                </div>
              ) : (
                <iframe
                  src={previewUrl!}
                  className="w-full h-full border-0"
                  title="CV Preview"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
