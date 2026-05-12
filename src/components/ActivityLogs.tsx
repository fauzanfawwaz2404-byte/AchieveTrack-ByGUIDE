import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, Trash2, Clock, User, Monitor, ExternalLink, 
  Search, Filter, RefreshCw, ChevronDown, ChevronUp, ShieldAlert,
  Terminal, Database, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { clearAllLogs } from '../services/activityService';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  details?: string;
  menuId?: string;
  timestamp: any;
}

interface ActivityLogsProps {
  isAdmin: boolean;
  currentUserEmail?: string | null;
}

export default function ActivityLogs({ isAdmin, currentUserEmail }: ActivityLogsProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    // Only show last 24 hours of logs
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const q = query(
      collection(db, 'activity_logs'),
      where('timestamp', '>=', oneDayAgo),
      orderBy('timestamp', 'desc'),
      limit(500) // Increased limit to ensure more users are captured
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];
      setLogs(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching logs:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const uniqueUsers = useMemo(() => {
    const users: Record<string, { userId: string, userName: string, userEmail: string, lastActive: any, activityCount: number }> = {};
    
    logs.forEach(log => {
      if (!users[log.userId]) {
        users[log.userId] = {
          userId: log.userId,
          userName: log.userName,
          userEmail: log.userEmail,
          lastActive: log.timestamp,
          activityCount: 1
        };
      } else {
        users[log.userId].activityCount++;
      }
    });

    return Object.values(users).filter(user => 
      user.userName.toLowerCase().includes(filterUser.toLowerCase()) ||
      user.userEmail.toLowerCase().includes(filterUser.toLowerCase())
    ).sort((a, b) => {
      const timeA = a.lastActive instanceof Timestamp ? a.lastActive.toMillis() : 0;
      const timeB = b.lastActive instanceof Timestamp ? b.lastActive.toMillis() : 0;
      return timeB - timeA;
    });
  }, [logs, filterUser]);

  const userLogs = useMemo(() => {
    if (!selectedUserId) return [];
    return logs.filter(log => log.userId === selectedUserId);
  }, [logs, selectedUserId]);

  const selectedUser = useMemo(() => {
    return uniqueUsers.find(u => u.userId === selectedUserId);
  }, [uniqueUsers, selectedUserId]);

  const handleClearLogs = async () => {
    setIsRefreshing(true);
    await clearAllLogs();
    setShowClearConfirm(false);
    setIsRefreshing(false);
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <ShieldAlert size={64} className="text-red-500 mb-4 opacity-20" />
        <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">Akses Terbatas</h2>
        <p className="text-white/40 text-xs mt-2 font-bold uppercase tracking-widest max-w-md">
          Hanya Administrator Sistem yang diizinkan untuk memantau log aktivitas real-time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Terminal size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">Data Log Aktivitas</h2>
              <p className="text-white/30 text-[10px] font-black tracking-[0.2em] uppercase">Sistem Pemantauan CC Real-Time (Last 24 Hours)</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowClearConfirm(true)}
            className="btn btn-ghost hover:bg-red-500/10 text-red-500 border border-red-500/20 px-6 rounded-2xl font-black text-[10px] tracking-widest uppercase h-12"
          >
            <Trash2 size={14} className="mr-2" />
            Bersihkan Log
          </button>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
            <input 
              type="text"
              placeholder="CARI USER / AKTIVITAS..."
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl h-12 pl-10 pr-6 text-[10px] font-black tracking-widest uppercase text-white w-64 focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {selectedUserId ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <button 
              onClick={() => setSelectedUserId(null)}
              className="group flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest hover:text-white transition-colors"
            >
              <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              Kembali ke Daftar User
            </button>
            
            <div className="glass p-6 rounded-[2rem] border border-amber-500/20 bg-amber-500/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="avatar placeholder">
                  <div className="bg-amber-500 text-black rounded-2xl w-12">
                    <span className="text-sm font-black uppercase">{selectedUser?.userName.substring(0, 2)}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-black text-white italic uppercase tracking-tight">{selectedUser?.userName}</h4>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{selectedUser?.userEmail}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">{selectedUser?.activityCount} AKTIVITAS</p>
                <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">TEREKAM HARI INI</p>
              </div>
            </div>

            <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden bg-black/20">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="table w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="bg-transparent border-b border-white/5 text-[10px] font-black tracking-[0.2em] text-white/40 uppercase py-6 pl-8">Waktu (WIB)</th>
                      <th className="bg-transparent border-b border-white/5 text-[10px] font-black tracking-[0.2em] text-white/40 uppercase py-6">Aktivitas</th>
                      <th className="bg-transparent border-b border-white/5 text-[10px] font-black tracking-[0.2em] text-white/40 uppercase py-6">Detail / Menu</th>
                      <th className="bg-transparent border-b border-white/5 text-[10px] font-black tracking-[0.2em] text-white/40 uppercase py-6 pr-8 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userLogs.map((log, idx) => (
                      <motion.tr 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        key={log.id} 
                        className="hover:bg-white/5 transition-colors group"
                      >
                        <td className="py-5 pl-8 border-b border-white/5">
                          <div className="flex items-center gap-3">
                            <Clock size={12} className="text-white/20" />
                            <span className="text-[11px] font-black text-white italic">
                              {log.timestamp instanceof Timestamp 
                                ? format(log.timestamp.toDate(), 'HH:mm:ss', { locale: id })
                                : '00:00:00'}
                            </span>
                          </div>
                        </td>
                        <td className="py-5 border-b border-white/5">
                          <span className="text-[11px] font-black text-white uppercase tracking-tight">{log.action}</span>
                        </td>
                        <td className="py-5 border-b border-white/5">
                          {log.menuId ? (
                            <span className="text-[9px] font-bold text-amber-500/60 uppercase tracking-widest bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10">MENU: {log.menuId}</span>
                          ) : (
                            <span className="text-[10px] font-medium text-white/30 italic">{log.details || '-'}</span>
                          )}
                        </td>
                        <td className="py-5 pr-8 border-b border-white/5 text-right">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 ml-auto opacity-40 group-hover:opacity-100 transition-opacity"></div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="h-32 glass rounded-[2rem] border border-white/5 animate-pulse bg-white/5"></div>
                ))
              ) : uniqueUsers.length === 0 ? (
                <div className="col-span-full py-20 text-center glass rounded-[2rem] border border-white/5">
                  <p className="text-white/20 font-black italic uppercase tracking-widest text-xs">Belum ada aktivitas yang terekam hari ini.</p>
                </div>
              ) : (
                uniqueUsers.map((user, idx) => (
                  <motion.div
                    key={user.userId}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedUserId(user.userId)}
                    className="glass p-6 rounded-[2.5rem] border border-white/10 hover:border-amber-500/30 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                      <ChevronDown size={20} className="-rotate-90 text-amber-500" />
                    </div>
                    
                    <div className="flex items-center gap-4 mb-6">
                      <div className="avatar placeholder">
                        <div className="bg-gradient-to-tr from-amber-400 to-amber-600 text-black rounded-[1.2rem] w-12 h-12 shadow-lg shadow-amber-500/20">
                          <span className="text-sm font-black uppercase">{user.userName.substring(0, 2)}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-white italic uppercase tracking-tight truncate">{user.userName}</h4>
                        <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest truncate">{user.userEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Last Active</span>
                        <span className="text-[10px] font-black text-amber-500 italic">
                          {user.lastActive instanceof Timestamp 
                            ? format(user.lastActive.toDate(), 'HH:mm:ss', { locale: id })
                            : '--:--:--'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[16px] font-black text-white leading-none">{user.activityCount}</span>
                        <p className="text-[7px] font-black text-white/20 uppercase tracking-widest">LOGS TODAY</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass p-8 rounded-[3rem] border border-white/10 max-w-md w-full bg-[#0a0b0d] text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-[1.5rem] flex items-center justify-center text-red-500 mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-black italic tracking-tighter text-white uppercase mb-2">Konfirmasi Penghapusan</h3>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed mb-8">
                Tindakan ini akan menghapus seluruh data log aktivitas secara permanen dari database Firestore. Lanjutkan?
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 h-16 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 font-black text-[10px] tracking-widest uppercase transition-all"
                >
                  BATAL
                </button>
                <button 
                  onClick={handleClearLogs}
                  disabled={isRefreshing}
                  className="flex-1 h-16 rounded-2xl bg-red-500 hover:bg-red-600 text-black font-black text-[10px] tracking-widest uppercase transition-all shadow-[0_10px_30px_rgba(239,68,68,0.2)] disabled:opacity-50"
                >
                  {isRefreshing ? 'MENGHAPUS...' : 'YA, BERSIHKAN'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between p-6 glass rounded-[2rem] border border-white/5 bg-white/5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
             <Zap size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Sistem Optimasi Data</p>
            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Data dibersihkan secara otomatis setiap 24 jam untuk menjaga performa optimal database.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-white/20">
           <Database size={16} />
           <span className="text-[10px] font-black uppercase tracking-widest italic">{logs.length} RECORDS</span>
        </div>
      </div>
    </div>
  );
}
