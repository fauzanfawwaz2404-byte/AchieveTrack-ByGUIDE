import React from 'react';
import WAPersonalTarget from './WAPersonalTarget';
import { WATarget, WASetup, WAHistory, UserPermission } from '../types';

interface WACBGTargetProps {
  targets: WATarget[];
  history: WAHistory[];
  setup: WASetup | null;
  setups?: { [key: string]: WASetup };
  onUpdateStatus: (id: string, status: WATarget['status']) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onBlacklist?: (target: WATarget, reason: string) => void;
  userEmail?: string | null;
  userName?: string | null;
  userPermissions?: UserPermission[];
  permissions?: { canAdd: boolean, canEdit: boolean, canDelete: boolean, isAdmin: boolean };
}

export default function WACBGTarget(props: WACBGTargetProps) {
  return (
    <div className="relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-10">
        <span className="bg-blue-600 text-white text-[10px] font-black px-4 py-1 rounded-full shadow-lg border border-blue-400/50 tracking-[0.3em] uppercase">
          SDM CABANG
        </span>
      </div>
      <WAPersonalTarget {...props} isCBG={true} />
    </div>
  );
}
