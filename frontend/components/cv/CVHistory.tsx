'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getCVHistory, deleteCV, downloadCVPdf } from '@/lib/api';
import { CVRecord } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function CVHistory() {
  const [cvs, setCvs] = useState<CVRecord[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <LoadingSpinner className="mt-4" />;
  if (cvs.length === 0) return <p className="text-sm text-muted-foreground">No CV analyses yet.</p>;

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium">File</th>
              <th className="pb-2 font-medium">ATS Score</th>
              <th className="pb-2 font-medium">Projected</th>
              <th className="pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cvs.map((cv) => (
              <tr key={cv.id} className="border-b last:border-0">
                <td className="py-3 text-muted-foreground">
                  {new Date(cv.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 text-foreground font-medium">{cv.file_name}</td>
                <td className="py-3">{cv.ats_score}</td>
                <td className="py-3">{cv.projected_score}</td>
                <td className="py-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleDownload(cv.id)}>
                    Download PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(cv.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {cvs.map((cv) => (
          <div key={cv.id} className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground truncate">{cv.file_name}</p>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">
                {new Date(cv.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-xs text-muted-foreground">ATS Score</p>
                <p className="text-lg font-bold text-foreground">{cv.ats_score}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Projected</p>
                <p className="text-lg font-bold text-foreground">{cv.projected_score}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDownload(cv.id)}>
                Download
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-500 hover:text-red-600"
                onClick={() => handleDelete(cv.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
