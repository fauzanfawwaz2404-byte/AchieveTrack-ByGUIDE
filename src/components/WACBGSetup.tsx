import React from 'react';
import WAPersonalSetup from './WAPersonalSetup';
import { WASetup, WATarget, Staff, WAHistory, WABlacklist } from '../types';

interface WACBGSetupProps {
  setup: WASetup | null;
  setups?: { [key: string]: WASetup };
  staffs: Staff[];
  targets?: WATarget[];
  history?: WAHistory[];
  onSaveSetup: (setup: WASetup, targetCount?: number, slotId?: string) => Promise<void>;
  onSaveStaff: (staff: Staff) => Promise<void>;
  onDeleteStaff: (id: string) => Promise<void>;
  onAddTargets: (targets: WATarget[]) => void;
  onClearTargets: () => void;
  onResetAllData?: () => Promise<void>;
  targetCount: number;
  waBlacklist?: WABlacklist[];
  userEmail?: string | null;
  permissions?: { canAdd: boolean; canEdit: boolean; canDelete: boolean; isAdmin: boolean };
  onNavigate?: (view: string) => void;
}

export default function WACBGSetup(props: WACBGSetupProps) {
  return (
    <div className="relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-10">
        <span className="bg-blue-600 text-white text-[10px] font-black px-4 py-1 rounded-full shadow-lg border border-blue-400/50 tracking-[0.3em] uppercase">
          SDM CABANG
        </span>
      </div>
      <WAPersonalSetup {...props} isCBG={true} />
    </div>
  );
}
