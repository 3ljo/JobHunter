'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CVHistory from '@/components/cv/CVHistory';

export default function CVHistoryPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CV History</CardTitle>
        </CardHeader>
        <CardContent>
          <CVHistory />
        </CardContent>
      </Card>
    </div>
  );
}
