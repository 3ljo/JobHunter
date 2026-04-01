'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChatInterface from '@/components/jobs/ChatInterface';
import SuggestedSites from '@/components/jobs/SuggestedSites';

export default function JobsPage() {
  return (
    <Tabs defaultValue="search" className="space-y-4">
      <TabsList>
        <TabsTrigger value="search">AI Job Search</TabsTrigger>
        <TabsTrigger value="sites">Suggested Sites</TabsTrigger>
      </TabsList>
      <TabsContent value="search">
        <ChatInterface />
      </TabsContent>
      <TabsContent value="sites">
        <SuggestedSites />
      </TabsContent>
    </Tabs>
  );
}
