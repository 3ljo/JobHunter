'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { JobSearchResult } from '@/types';

export default function JobCard({ job }: { job: JobSearchResult }) {
  return (
    <Card className="hover:border-gray-300 transition-colors">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-600">
            {job.company?.charAt(0)?.toUpperCase() || 'C'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
            <p className="text-sm text-gray-600">{job.company}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {job.location && (
                <span className="text-xs text-gray-500">{job.location}</span>
              )}
              {job.type && (
                <Badge variant="secondary" className="text-xs">
                  {job.type}
                </Badge>
              )}
            </div>
            {job.description && (
              <p className="mt-2 text-sm text-gray-500 line-clamp-2">{job.description}</p>
            )}
            {job.url && (
              <Button
                size="sm"
                className="mt-3"
                onClick={() => window.open(job.url, '_blank')}
              >
                Apply Now
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
