'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSuggestedSites } from '@/lib/api';
import { SuggestedSite } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function SuggestedSites() {
  const [jobTitle, setJobTitle] = useState('');
  const [careerLevel, setCareerLevel] = useState('mid');
  const [locations, setLocations] = useState('');
  const [sites, setSites] = useState<SuggestedSite[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) {
      toast.error('Please enter a job title');
      return;
    }
    setLoading(true);
    try {
      const res = await getSuggestedSites({
        job_title: jobTitle,
        career_level: careerLevel,
        preferred_locations: locations,
      });
      setSites(res.data.suggested_sites);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2">
          <Label>Job Title</Label>
          <Input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Frontend Developer"
            className="w-60"
          />
        </div>
        <div className="space-y-2">
          <Label>Career Level</Label>
          <select
            value={careerLevel}
            onChange={(e) => setCareerLevel(e.target.value)}
            className="flex h-10 w-44 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="junior">Junior</option>
            <option value="mid">Mid-Level</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead</option>
            <option value="executive">Executive</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Preferred Locations</Label>
          <Input
            value={locations}
            onChange={(e) => setLocations(e.target.value)}
            placeholder="e.g. Remote, London"
            className="w-60"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Get Suggestions'}
        </Button>
      </form>

      {loading && <LoadingSpinner className="mt-8" />}

      {!loading && sites.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sites.map((site, i) => (
            <Card key={i} className="hover:border-gray-300 transition-colors">
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{site.name}</h3>
                  <Badge variant={site.is_free ? 'secondary' : 'outline'}>
                    {site.is_free ? 'Free' : 'Paid'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">{site.reason}</p>
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm font-medium text-gray-900 hover:underline"
                >
                  Visit site &rarr;
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
