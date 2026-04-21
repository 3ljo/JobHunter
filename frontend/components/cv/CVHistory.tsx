'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { deleteCV, downloadCVPdf, previewCVPdf } from '@/lib/api';
import { useDashboardStore } from '@/store/dashboardStore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { Eye, X, Download, Trash2, FileText, Calendar, AlertTriangle } from 'lucide-react';

export default function CVHistory() {
  const { cvs, loaded, load, setCvs } = useDashboardStore();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (!confirmDeleteOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setConfirmDeleteOpen(false); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [confirmDeleteOpen]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const allSelected = useMemo(
    () => cvs.length > 0 && selected.size === cvs.length,
    [cvs.length, selected.size],
  );
  const someSelected = selected.size > 0 && !allSelected;

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.size === cvs.length ? new Set() : new Set(cvs.map((c) => c.id))));
  };

  const clearSelection = () => setSelected(new Set());

  const handleBulkDownload = async () => {
    if (!selected.size) return;
    setBulkBusy(true);
    const ids = Array.from(selected);
    let failed = 0;
    for (const id of ids) {
      try {
        await downloadCVPdf(id);
      } catch {
        failed += 1;
      }
    }
    setBulkBusy(false);
    if (failed === 0) toast.success(`Downloaded ${ids.length} CV${ids.length > 1 ? 's' : ''}`);
    else if (failed < ids.length) toast.error(`${failed} of ${ids.length} downloads failed`);
    else toast.error('Failed to download');
  };

  const requestBulkDelete = () => {
    if (!selected.size) return;
    setConfirmDeleteOpen(true);
  };

  const confirmBulkDelete = async () => {
    if (!selected.size) return;
    setConfirmDeleteOpen(false);
    setBulkBusy(true);
    const ids = Array.from(selected);
    const results = await Promise.allSettled(ids.map((id) => deleteCV(id)));
    const deletedIds = new Set(
      ids.filter((_, i) => results[i].status === 'fulfilled'),
    );
    setCvs(cvs.filter((cv) => !deletedIds.has(cv.id)));
    setSelected(new Set());
    setBulkBusy(false);
    const failed = results.length - deletedIds.size;
    if (failed === 0) toast.success(`Deleted ${deletedIds.size} CV${deletedIds.size > 1 ? 's' : ''}`);
    else if (deletedIds.size > 0) toast.error(`${failed} of ${ids.length} deletions failed`);
    else toast.error('Failed to delete');
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
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  }

  if (!loaded) return <LoadingSpinner className="mt-12" />;

  if (cvs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 mb-4">
          <FileText className="h-6 w-6 text-muted-foreground/60" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">No CV analyses yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Upload and analyze your first CV to see history here.</p>
      </div>
    );
  }

  return (
    <>
      {/* Bulk action bar — only visible when something is selected */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-30 rounded-2xl border border-violet-500/30 bg-card/95 backdrop-blur shadow-[0_6px_22px_rgba(118,77,240,0.18)] px-3 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-3">
          <span className="text-xs sm:text-sm font-semibold text-foreground/90 tabular-nums">
            {selected.size} selected
          </span>
          <button
            type="button"
            onClick={clearSelection}
            disabled={bulkBusy}
            className="text-[11px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Clear
          </button>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleBulkDownload}
              disabled={bulkBusy}
              className="gap-1.5 text-muted-foreground hover:text-foreground rounded-lg text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={requestBulkDelete}
              disabled={bulkBusy}
              className="gap-1.5 text-muted-foreground hover:text-red-400 rounded-lg text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block rounded-2xl border border-border bg-card/70 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3.5 w-10">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded accent-violet-500 cursor-pointer"
                />
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
              <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">File</th>
              <th className="px-6 py-3.5 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {cvs.map((cv, i) => {
              const isSelected = selected.has(cv.id);
              return (
                <tr
                  key={cv.id}
                  className={`transition-colors ${isSelected ? 'bg-violet-500/10' : 'hover:bg-accent/50'} ${i < cvs.length - 1 ? 'border-b border-border/50' : ''}`}
                >
                  <td className="px-4 py-4 w-10">
                    <input
                      type="checkbox"
                      aria-label={`Select ${cv.file_name}`}
                      checked={isSelected}
                      onChange={() => toggleOne(cv.id)}
                      className="h-4 w-4 rounded accent-violet-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 text-muted-foreground tabular-nums">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                      {new Date(cv.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                        <FileText className="h-3.5 w-3.5 text-violet-400" />
                      </div>
                      <span className="font-medium text-foreground/90">{cv.file_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handlePreview(cv.id)}
                        title="Preview CV"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {cvs.map((cv) => {
          const isSelected = selected.has(cv.id);
          return (
            <div
              key={cv.id}
              className={`rounded-2xl border p-4 space-y-4 transition-colors ${
                isSelected ? 'border-violet-500/50 bg-violet-500/10' : 'border-border bg-card/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  aria-label={`Select ${cv.file_name}`}
                  checked={isSelected}
                  onChange={() => toggleOne(cv.id)}
                  className="h-4 w-4 rounded accent-violet-500 cursor-pointer shrink-0"
                />
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                    <FileText className="h-4 w-4 text-violet-400" />
                  </div>
                  <p className="text-sm font-medium text-foreground/90 truncate">{cv.file_name}</p>
                </div>
                <span className="text-[11px] text-muted-foreground/60 shrink-0 ml-1 tabular-nums">
                  {new Date(cv.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-2 pt-1 border-t border-border/50">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handlePreview(cv.id)}
                  className="flex-1 gap-1.5 text-muted-foreground hover:text-foreground rounded-lg text-xs"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete confirmation modal */}
      {confirmDeleteOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-delete-title"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => setConfirmDeleteOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.55)] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 pt-6 pb-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/25">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3
                    id="bulk-delete-title"
                    className="text-base font-semibold text-foreground tracking-tight"
                  >
                    Delete {selected.size} CV{selected.size > 1 ? 's' : ''}?
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    This action is permanent. The selected CV{selected.size > 1 ? 's' : ''} and
                    {' '}{selected.size > 1 ? 'their' : 'its'} analysis data will be removed from your history.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/60 bg-muted/30 rounded-b-2xl">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDeleteOpen(false)}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmBulkDelete}
                className="rounded-lg bg-red-500/90 text-white hover:bg-red-500 shadow-[0_6px_18px_rgba(239,68,68,0.35)] gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {(previewUrl || previewLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl h-[85vh] mx-4 rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">CV Preview</h3>
              <button
                onClick={closePreview}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
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
