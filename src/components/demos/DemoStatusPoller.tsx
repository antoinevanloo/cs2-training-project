'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface DemoStatusPollerProps {
  demoId: string;
  initialStatus: string;
  pollingInterval?: number;
}

type DemoStatus = 'PENDING' | 'QUEUED' | 'PROCESSING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';

export function DemoStatusPoller({
  demoId,
  initialStatus,
  pollingInterval = 3000, // Poll every 3 seconds
}: DemoStatusPollerProps) {
  const router = useRouter();
  const [status, setStatus] = useState<DemoStatus>(initialStatus as DemoStatus);

  useEffect(() => {
    if (status === 'COMPLETED' || status === 'FAILED') {
      return; // Stop polling if the job is done
    }

    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`/api/demos/${demoId}/status`);
        if (!response.ok) {
          // Stop polling on server error
          console.error('Failed to fetch demo status, stopping poller.');
          clearInterval(intervalId);
          return;
        }

        const data: { status: DemoStatus } = await response.json();
        setStatus(data.status);

        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          clearInterval(intervalId);
          // Refresh the page to show the final result
          router.refresh();
        }
      } catch (error) {
        console.error('Error polling demo status:', error);
        clearInterval(intervalId);
      }
    }, pollingInterval);

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [demoId, pollingInterval, router, status]);

  // This component does not render anything itself
  return null;
}
