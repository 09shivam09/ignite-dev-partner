import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { seedDummyContent, clearSeededContent } from '@/services/seed';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DevToolsProps {
  onSeedComplete?: () => void;
}

export function DevTools({ onSeedComplete }: DevToolsProps) {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const result = await seedDummyContent();
      const total = result.counts.photos + result.counts.videos + result.counts.reels;
      toast.success(`Seeded ${total} posts successfully!`);
      onSeedComplete?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to seed content');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClear = async () => {
    setIsClearing(true);
    try {
      const result = await clearSeededContent();
      toast.success(`Cleared ${result.deleted} seeded posts`);
      onSeedComplete?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear content');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-dashed border-amber-500/50 bg-amber-500/5">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-sm text-amber-500">Dev Tools</CardTitle>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            <CardDescription className="text-xs">
              Seed dummy content for testing the feed
            </CardDescription>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeed}
                disabled={isSeeding || isClearing}
                className="flex-1"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  <>
                    <Database className="h-3 w-3 mr-2" />
                    Seed Content
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={isSeeding || isClearing}
                className="flex-1 text-destructive hover:text-destructive"
              >
                {isClearing ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3 w-3 mr-2" />
                    Clear Seeded
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
