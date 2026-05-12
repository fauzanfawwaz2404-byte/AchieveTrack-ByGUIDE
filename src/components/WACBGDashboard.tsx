import React from 'react';
import WAPersonalDashboard from './WAPersonalDashboard';
import { LayoutDashboard } from 'lucide-react';
import { WATarget, WAHistory, WACampaignSummary, WABlacklist, WASetup } from '../types';

interface WACBGDashboardProps {
  targets: WATarget[];
  history: WAHistory[];
  campaigns: WACampaignSummary[];
  waBlacklist?: WABlacklist[];
  setup?: WASetup;
  onDeleteCampaign?: (id: string) => void;
  onAddBlacklist?: (data: Omit<WABlacklist, 'id' | 'timestamp'>) => void;
  userEmail?: string;
}

export default function WACBGDashboard(props: WACBGDashboardProps) {
  return (
    <div className="relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-10">
        <span className="bg-blue-600 text-white text-[10px] font-black px-4 py-1 rounded-full shadow-lg border border-blue-400/50 tracking-[0.3em] uppercase">
          SDM CABANG
        </span>
      </div>
      <WAPersonalDashboard {...props} title="WA SDM CABANG" isCBG={true} />
    </div>
  );
}
