import React, { useState } from 'react';
import { Users, UserPlus, Trash2, Shield, Gem, User, Info, Save, X, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BHFMember } from '../types';

interface BHFKelompokProps {
  members: BHFMember[];
  groups: string[];
  onSave: (member: BHFMember) => void;
  onDelete: (id: string) => void;
  onGroupsUpdate: (groups: string[]) => void;
  onRenameGroup: (oldName: string, newName: string) => void;
  permissions: { canAdd: boolean; canEdit: boolean; canDelete: boolean; isAdmin: boolean };
}

export default function BHFKelompok({ members, groups, onSave, onDelete, onGroupsUpdate, onRenameGroup, permissions }: BHFKelompokProps) {
  const AVAILABLE_NAMES = [
    'Deasy', 'Mustika', 'Helly', 'Rully', 'Sukaeri', 'Sita',
    'Devy', 'Ayu', 'Lina', 'Annisa', 'Giyarno', 'Iksan',
    'Ros', 'Fiona', 'Restu', 'Riska', 'Diah', 'Agung',
    'Putri', 'Elia', 'DHIAN', 'Triyana', 'Irawan', 'Riya', 'Ratno'
  ];
  
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<BHFMember | null>(null);
  const [nama, setNama] = useState('');
  const [searchName, setSearchName] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isRenamingGroup, setIsRenamingGroup] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const usedNames = members.map(m => m.nama);
  const filteredNames = AVAILABLE_NAMES.filter(name => 
    !usedNames.includes(name) && 
    name.toLowerCase().includes(searchName.toLowerCase())
  );

  const handleAddMember = (group: string) => {
    setSelectedGroup(group);
    setSearchName('');
    setNama('');
  };

  const handleEditMember = (member: BHFMember) => {
    setEditingMember(member);
    setNama(member.nama);
    setSearchName(member.nama);
  };

  const saveMember = (nameToSave?: string) => {
    const finalName = nameToSave || nama || searchName;
    if (!finalName) return;
    
    if (editingMember) {
      onSave({
        ...editingMember,
        nama: finalName,
        timestamp: new Date().toISOString()
      });
      setEditingMember(null);
    } else {
      const newMember: BHFMember = {
        id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        kelompok: selectedGroup as any,
        nama: finalName,
        isLeader: false,
        timestamp: new Date().toISOString()
      };
      onSave(newMember);
    }
    
    setNama('');
    setSearchName('');
    setSelectedGroup(null);
  };

  const deleteGroup = (groupName: string) => {
    if (!window.confirm(`Hapus kelompok ${groupName}? Semua data kelompok akan terhapus.`)) return;
    
    if (members.some(m => m.kelompok === groupName)) {
      alert("Pindahkan atau hapus anggota kelompok ini terlebih dahulu.");
      return;
    }
    const updated = groups.filter(g => g !== groupName);
    onGroupsUpdate(updated);
  };

  const addGroup = () => {
    if (!newGroupName) return;
    if (groups.includes(newGroupName)) {
      alert("Kelompok sudah ada.");
      return;
    }
    const updated = [...groups, newGroupName];
    onGroupsUpdate(updated);
    setNewGroupName('');
    setIsAddingGroup(false);
  };

  const handleRenameGroup = () => {
    if (!renameValue || renameValue === isRenamingGroup) return;
    if (groups.includes(renameValue)) {
      alert("Kelompok sudah ada.");
      return;
    }
    onRenameGroup(isRenamingGroup as string, renameValue);
    setIsRenamingGroup(null);
    setRenameValue('');
  };

  const toggleLeader = (member: BHFMember) => {
    if (!permissions.canEdit) return;
    onSave({ ...member, isLeader: !member.isLeader });
  };

  return (
    <div className="space-y-8 animate-in mt-10 fade-in slide-in-from-bottom-6 duration-1000">
      <div className="flex flex-col gap-2">
         <div className="flex items-center gap-2">
            <Users size={16} className="text-amber-500" />
            <span className="text-[11px] font-black text-amber-500 uppercase tracking-widest italic">Manajemen Tim</span>
          </div>
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">KELOMPOK <span className="text-amber-500">BHF / HKN</span></h2>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Daftar Kelompok</p>
            {permissions.isAdmin && (
               <button 
                onClick={() => setIsAddingGroup(true)}
                className="btn btn-xs bg-amber-500 hover:bg-amber-600 text-black border-none rounded-lg h-8 px-4 font-black italic group"
               >
                 <UserPlus size={14} className="group-hover:scale-110 transition-all mr-2" />
                 TAMBAH KELOMPOK
               </button>
            )}
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {groups.map((group, idx) => {
          const groupMembers = members.filter(m => m.kelompok === group);
          const isCustomerCare = group.toLowerCase().includes('customer care');
          const iconColor = isCustomerCare ? 'text-rose-500' : 'text-amber-500';
          const bgColor = isCustomerCare ? 'bg-rose-500/5' : 'bg-amber-500/5';
          const borderColor = isCustomerCare ? 'border-rose-500/20' : 'border-amber-500/20';

          return (
            <div key={group} className={`glass p-6 rounded-[2.5rem] border ${borderColor} ${bgColor} flex flex-col h-full group/card transition-all hover:bg-black/40`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl ${isCustomerCare ? 'bg-rose-500/20' : 'bg-amber-500/20'} flex items-center justify-center border ${borderColor} shadow-xl shadow-black/20 group-hover/card:scale-110 transition-all`}>
                  {isCustomerCare ? <Shield size={20} className={iconColor} /> : <Users size={20} className={iconColor} />}
                </div>
                <div className="flex gap-2">
                  {permissions.isAdmin && (
                    <button 
                      onClick={() => {
                        setIsRenamingGroup(group);
                        setRenameValue(group);
                      }}
                      className="btn btn-circle btn-sm h-8 w-8 bg-blue-500/20 hover:bg-blue-500 text-blue-500 hover:text-white border-none shadow-lg active:scale-95"
                    >
                      <Info size={12} />
                    </button>
                  )}
                  {permissions.isAdmin && !['Kelompok 1', 'Kelompok 2', 'Kelompok 3', 'Kelompok 4', 'Customer Care'].includes(group) && (
                    <button 
                      onClick={() => deleteGroup(group)}
                      className="btn btn-circle btn-sm h-8 w-8 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white border-none shadow-lg active:scale-95"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  {permissions.canAdd && (
                    <button 
                      onClick={() => handleAddMember(group)}
                      className={`btn btn-circle btn-sm h-10 w-10 ${isCustomerCare ? 'bg-rose-500 hover:bg-rose-600' : 'bg-amber-500 hover:bg-amber-600'} text-black border-none shadow-lg active:scale-95`}
                    >
                      <UserPlus size={16} />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-black text-white uppercase italic tracking-widest mb-1 truncate">{group}</h3>
              <p className="text-[11px] font-black text-amber-500/80 uppercase mb-6 tracking-widest border-b border-white/10 pb-2">Total {groupMembers.length} Anggota</p>

              <div className="flex-grow space-y-2">
                {groupMembers.map(member => (
                  <div 
                    key={member.id} 
                    onClick={() => toggleLeader(member)}
                    className={`flex justify-between items-center glass p-2 rounded-lg border ${member.isLeader ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/5 bg-black/10'} group/item hover:border-white/10 cursor-pointer active:scale-95 transition-all`}
                  >
                     <div className="flex items-center gap-3">
                        {member.isLeader && <Crown size={14} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />}
                        <div className="flex flex-col">
                          <span className={`text-[15px] font-black tracking-tight leading-tight ${member.isLeader ? 'text-amber-400 drop-shadow-sm' : 'text-white'}`}>
                            {member.nama}
                          </span>
                          {member.isLeader && <span className="text-[8px] font-black text-amber-500/60 uppercase tracking-tighter -mt-0.5 italic">Ketua Tim</span>}
                        </div>
                      </div>
                    <div className="flex items-center gap-1">
                      {permissions.canEdit && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditMember(member);
                          }}
                          className="opacity-0 group-hover/item:opacity-100 btn btn-xs btn-circle glass text-amber-500 hover:bg-amber-500 hover:text-black transition-all h-6 w-6"
                        >
                           <Info size={10} />
                        </button>
                      )}
                      {permissions.canDelete && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Hapus ${member.nama} dari ${group}?`)) onDelete(member.id);
                          }}
                          className="opacity-0 group-hover/item:opacity-100 btn btn-xs btn-circle glass text-red-400 hover:bg-red-500 hover:text-white transition-all h-6 w-6"
                        >
                           <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {groupMembers.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 opacity-20 gap-2">
                    <User size={24} />
                    <p className="text-[9px] font-black uppercase tracking-widest text-center">Kosong</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {(selectedGroup || editingMember) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass p-10 rounded-[4rem] max-w-md w-full border border-amber-500/20 shadow-3xl bg-slate-900/95 relative overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-14 h-14 rounded-[1.5rem] bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                    <UserPlus className="text-amber-500" size={28} />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{editingMember ? 'EDIT PERSONEL' : 'TAMBAH PERSONEL'}</h3>
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{editingMember ? editingMember.kelompok : selectedGroup}</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-4">Nama Lengkap</label>
                    <input 
                      type="text" 
                      autoFocus
                      value={nama}
                      onChange={(e) => {
                        setNama(e.target.value);
                        setSearchName(e.target.value);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && saveMember()}
                      placeholder="Ketik atau pilih nama..."
                      className="input input-bordered w-full h-14 bg-black/40 border-white/10 rounded-2xl text-white font-bold focus:border-amber-500/50"
                    />
                 </div>

                 <div className="space-y-2 text-right">
                    <input 
                      type="text"
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      placeholder="Cari dalam daftar..."
                      className="input input-xs bg-black/40 border-white/5 rounded-lg w-full mb-2 h-8 text-[10px] font-bold uppercase tracking-widest px-4 italic"
                    />
                    <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest mr-4 inline-block mb-1">Cepat Pilih ({filteredNames.length})</label>
                    <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-2 p-1 bg-black/20 rounded-2xl border border-white/5">
                      {filteredNames.length > 0 ? (
                        filteredNames.map(name => (
                          <button
                            key={name}
                            onClick={() => saveMember(name)}
                            className="btn btn-sm glass bg-black/40 hover:bg-amber-500 hover:text-black border-white/5 rounded-xl h-10 text-[10px] font-black uppercase italic transition-all truncate"
                          >
                            {name}
                          </button>
                        ))
                      ) : (
                        <div className="col-span-2 py-4 text-center opacity-30 text-[10px] font-black uppercase italic">
                          {searchName ? 'Nama tidak ditemukan' : 'Semua nama sudah terdaftar'}
                        </div>
                      )}
                    </div>
                 </div>
              </div>

              <div className="flex gap-4 mt-10">
                 <button onClick={() => { setSelectedGroup(null); setEditingMember(null); }} className="btn flex-1 bg-white/5 hover:bg-white/10 text-white border-none h-14 rounded-2xl font-black italic">TUTUP</button>
                 <button 
                  onClick={() => saveMember()}
                  className="btn flex-[2] bg-amber-500 hover:bg-amber-600 text-black border-none h-14 rounded-2xl font-black italic tracking-widest"
                 >
                   <Save size={18} /> {editingMember ? 'SIMPAN PERUBAHAN' : 'SIMPAN ANGGOTA'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddingGroup && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="glass p-10 rounded-[4rem] max-w-md w-full border border-amber-500/20 shadow-3xl bg-slate-900/95"
            >
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-[1.5rem] bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                     <Users className="text-amber-500" size={28} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">TAMBAH KELOMPOK BARU</h3>
                     <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Master Data Kelompok</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-4">Nama Kelompok</label>
                     <input 
                       type="text" 
                       autoFocus
                       value={newGroupName}
                       onChange={(e) => setNewGroupName(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && addGroup()}
                       placeholder="Contoh: Kelompok 5..."
                       className="input input-bordered w-full h-14 bg-black/40 border-white/10 rounded-2xl text-white font-bold focus:border-amber-500/50"
                     />
                  </div>
               </div>

               <div className="flex gap-4 mt-10">
                  <button onClick={() => setIsAddingGroup(false)} className="btn flex-1 bg-white/5 hover:bg-white/10 text-white border-none h-14 rounded-2xl font-black italic">TUTUP</button>
                  <button 
                   onClick={addGroup}
                   className="btn flex-[2] bg-amber-500 hover:bg-amber-600 text-black border-none h-14 rounded-2xl font-black italic tracking-widest"
                  >
                    <Save size={18} /> BUAT KELOMPOK
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRenamingGroup && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="glass p-10 rounded-[4rem] max-w-md w-full border border-blue-500/20 shadow-3xl bg-slate-900/95"
            >
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-[1.5rem] bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                     <Users className="text-blue-500" size={28} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">UBAH NAMA KELOMPOK</h3>
                     <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{isRenamingGroup}</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-4">Nama Kelompok Baru</label>
                     <input 
                       type="text" 
                       autoFocus
                       value={renameValue}
                       onChange={(e) => setRenameValue(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleRenameGroup()}
                       placeholder="Ubah nama kelompok..."
                       className="input input-bordered w-full h-14 bg-black/40 border-white/10 rounded-2xl text-white font-bold focus:border-blue-500/50"
                     />
                     <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2 ml-4 italic">* PERUBAHAN AKAN OTOMATIS MEMPERBARUI DATA ANGGOTA & LAPORAN</p>
                  </div>
               </div>

               <div className="flex gap-4 mt-10">
                  <button onClick={() => setIsRenamingGroup(null)} className="btn flex-1 bg-white/5 hover:bg-white/10 text-white border-none h-14 rounded-2xl font-black italic">TUTUP</button>
                  <button 
                   onClick={handleRenameGroup}
                   className="btn flex-[2] bg-blue-500 hover:bg-blue-600 text-black border-none h-14 rounded-2xl font-black italic tracking-widest"
                  >
                    <Save size={18} /> SIMPAN PERUBAHAN
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
