'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getCVHistory, deleteCV } from '@/lib/api';
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

  if (loading) return <LoadingSpinner className="mt-4" />;
  if (cvs.length === 0) return <p className="text-sm text-gray-500">No CV analyses yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
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
              <td className="py-3 text-gray-500">
                {new Date(cv.created_at).toLocaleDateString()}
              </td>
              <td className="py-3 text-gray-900 font-medium">{cv.file_name}</td>
              <td className="py-3">{cv.ats_score}</td>
              <td className="py-3">{cv.projected_score}</td>
              <td className="py-3 flex gap-2">
                {cv.download_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const url = cv.download_url.startsWith('http')
                        ? cv.download_url
                        : `${process.env.NEXT_PUBLIC_API_URL}${cv.download_url}`;
                      window.open(url, '_blank');
                    }}
                  >
                    Download
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
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
  );
}
