import * as React from 'react';
import { GlobalNetworkGraph } from '@/features/network/components/GlobalNetworkGraph';

interface NetworkAnalysisTabProps {
  crimeId: string;
  crimeNumber: string;
}

export function NetworkAnalysisTab({ crimeId, crimeNumber }: NetworkAnalysisTabProps) {
  return (
    <div className="space-y-4">
      <div className="h-[560px] w-full min-w-0">
        <GlobalNetworkGraph
          title={`Crime Network: ${crimeNumber}`}
          description={`Explore the global network graph for incident ${crimeNumber}.`}
          initialParams={{ nodeId: crimeId }}
          initialLabel={crimeNumber}
          showTrail={false}
        />
      </div>
    </div>
  );
}
