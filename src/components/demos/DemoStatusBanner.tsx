'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';

interface DemoStatusBannerProps {
  demoId: string;
  initialStatus: string;
  initialStatusMessage: string | null;
}

type DemoStatus = 'PENDING' | 'QUEUED' | 'PROCESSING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';

export function DemoStatusBanner({
  demoId,
  initialStatus,
  initialStatusMessage,
  pollingInterval = 3000, // Poll every 3 seconds
}: DemoStatusBannerProps & { pollingInterval?: number }) {
  const router = useRouter();
  const [status, setStatus] = useState<DemoStatus>(initialStatus as DemoStatus);
  const [statusMessage, setStatusMessage] = useState<string | null>(initialStatusMessage);

  useEffect(() => {
    const isProcessing = ['PENDING', 'QUEUED', 'PROCESSING', 'ANALYZING'].includes(status);

    if (!isProcessing) {
      return; // Stop polling if the job is done
    }

    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`/api/demos/${demoId}/status`);
        if (!response.ok) {
          console.error('Failed to fetch demo status, stopping poller.');
          clearInterval(intervalId);
          return;
        }

        const data: { status: DemoStatus; statusMessage: string | null } = await response.json();
        
        // Update live status on the banner
        setStatus(data.status);
        setStatusMessage(data.statusMessage);

        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          clearInterval(intervalId);
          // Refresh the whole page to show the final result
          router.refresh();
        }
      } catch (error) {
        console.error('Error polling demo status:', error);
        clearInterval(intervalId);
      }
    }, pollingInterval);

    return () => clearInterval(intervalId);
  }, [demoId, pollingInterval, router, status]);

  return (
    <Card className="p-4 border-blue-500/50 bg-blue-500/10">
      <div className="flex items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        <div>
          <p className="font-medium text-white">Traitement en cours</p>
          <p className="text-sm text-gray-400">
            Statut: {status}
            {statusMessage && ` - ${statusMessage}`}
          </p>
        </div>
      </div>
    </Card>
  );
}
