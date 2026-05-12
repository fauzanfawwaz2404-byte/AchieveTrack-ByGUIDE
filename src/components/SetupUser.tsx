import React, { useState } from 'react';
import { 
  UserPlus, Shield, Trash2, Key, Mail, CheckCircle2, 
  Plus, Edit, Trash, ChevronRight, Lock, User, 
  LayoutDashboard, Search, Database, Target, 
  Calendar, Link as LinkIcon, HelpCircle, 
  Cake, MoreVertical, Smartphone, X, Tag,
  Crown, BookOpen, Settings
} from 'lucide-react';
import { UserPermission, MenuAccess } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SetupUserProps {
  users: UserPermission[];
  onSave: (users: UserPermission[]) => Promise<void> | void;
  availableMenus: { id: string; label: string }[];
  userEmail?: string | null;
  permissions: { canAdd: boolean, canEdit: boolean, canDelete: boolean, isAdmin: boolean };
}

const KNOWN_STAFF = [
  { name: 'ANNISA', email: 'annisaraafiyani@gmail.com' },
  { name: 'ASHRI', email: 'ashri.setiyawati@prodia.co.id' },
  { name: 'AYU', email: 'ayurini2412@gmail.com' },
  { name: 'DEASY', email: 'deasy.retno@prodia.co.id' },
  { name: 'DEVY', email: 'devi.yulianti@prodia.co.id' },
  { name: 'DHIAN', email: 'dhyaneka.de@gmail.com' },
  { name: 'DIAH', email: 'diaharumfajarwati.daf@gmail.com' },
  { name: 'ELIA', email: 'elia.chrisnawati@prodia.co.id' },
  { name: 'FIONA', email: 'citraafiona@gmail.com' },
  { name: 'HELLY', email: 'dheena.soemardi83@gmail.com' },
  { name: 'LINA', email: 'lina.hendrawati@prodia.co.id' },
  { name: 'MUSTIKA', email: 'mustikarahmawati.mr@gmail.com' },
  { name: 'PUTRI', email: 'putrisuyono13@gmail.com' },
  { name: 'RATNO', email: 'ratnoade365@gmail.com' },
  { name: 'RESTU', email: 'restugandhinii95@gmail.com' },
  { name: 'RISKA', email: 'riska.noermawati17@gmail.com' },
  { name: 'RIYA', email: 'riyaharyani17@gmail.com' },
  { name: 'ROS', email: 'rospianipurba@gmail.com' },
  { name: 'SITA', email: 'masyitanurhidayati08@gmail.com' },
  { name: 'SUKAERI', email: 'najwaafiahtenri@gmail.com' },
  { name: 'TRIYANA', email: 'anajuliuss@gmail.com' },
  { name: 'FAUZAN', email: 'fauzanfawwaz2404@gmail.com' },
  { name: 'NUR FAUZAN', email: 'nur.fauzan@prodia.co.id' }
];

export default function SetupUser({ users, onSave, availableMenus, userEmail, permissions }: SetupUserProps) {
  const isSuperAdmin = userEmail === 'fauzanfawwaz2404@gmail.com';
  const canModify = isSuperAdmin;
  
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'menu-first'>('list');
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(users && users.length > 0 ? users[0].email : null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, { canAdd: boolean, canEdit: boolean, canDelete: boolean }>>({});
  
  // NEW: Menu-First States
  const [selectedMenuId, setSelectedMenuId] = useState<string>(availableMenus[0]?.id || '');
  const [showPreviewModal, setShowPreviewModal] = useState<string | null>(null);

  const filteredUsers = (users || []).filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Bulk actions for current menu
  const handleBulkAction = (action: 'selectAll' | 'removeAll' | 'enableAdd' | 'enableEdit' | 'enableDelete' | 'disableAdd' | 'disableEdit' | 'disableDelete') => {
    const updatedUsers = users.map(u => {
      // Don't touch super admin
      if (u.email === 'fauzanfawwaz2404@gmail.com') return u;
      
      // Only process users currently visible in search
      const userInView = filteredUsers.some(fu => fu.email === u.email);
      if (!userInView) return u;

      const otherMenus = u.allowedMenus.filter(m => m.menuId !== selectedMenuId);
      const currentMenu = u.allowedMenus.find(m => m.menuId === selectedMenuId);

      if (action === 'selectAll') {
        const perms = currentMenu || { menuId: selectedMenuId, canAdd: true, canEdit: true, canDelete: true };
        return { ...u, allowedMenus: [...otherMenus, { ...perms, menuId: selectedMenuId }] };
      }
      
      if (action === 'removeAll') {
        return { ...u, allowedMenus: otherMenus };
      }

      // Permission toggles (only if user has access to this menu)
      if (currentMenu) {
        let newPerms = { ...currentMenu };
        if (action === 'enableAdd') newPerms.canAdd = true;
        if (action === 'disableAdd') newPerms.canAdd = false;
        if (action === 'enableEdit') newPerms.canEdit = true;
        if (action === 'disableEdit') newPerms.canEdit = false;
        if (action === 'enableDelete') newPerms.canDelete = true;
        if (action === 'disableDelete') newPerms.canDelete = false;
        return { ...u, allowedMenus: [...otherMenus, newPerms] };
      }

      return u;
    });
    onSave(updatedUsers);
  };

  const activeUser = users.find(u => u.email === selectedUserEmail);

  // Helper to update a single user's permission for a specific menu
  const updateUserMenuPermission = (email: string, menuId: string, perms: { canAdd: boolean, canEdit: boolean, canDelete: boolean } | null) => {
    const updatedUsers = users.map(u => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        const otherMenus = u.allowedMenus.filter(m => m.menuId !== menuId);
        const newAllowedMenus = perms 
          ? [...otherMenus, { menuId, ...perms }]
          : otherMenus;
        return { ...u, allowedMenus: newAllowedMenus };
      }
      return u;
    });
    onSave(updatedUsers);
  };

  const handleToggleMenu = (menuId: string) => {
    setSelectedPermissions(prev => {
      const newPerms = { ...prev };
      if (newPerms[menuId]) {
        delete newPerms[menuId];
      } else {
        // Default to Read-Only (all actions false)
        newPerms[menuId] = { canAdd: false, canEdit: false, canDelete: false };
      }
      return newPerms;
    });
  };

  const handleApplyDefaultPermissions = () => {
    const defaultPerms: Record<string, { canAdd: boolean, canEdit: boolean, canDelete: boolean }> = {};
    availableMenus.forEach(m => {
      defaultPerms[m.id] = { canAdd: false, canEdit: false, canDelete: false };
    });
    setSelectedPermissions(defaultPerms);
  };

  const handleToggleAction = (menuId: string, action: 'canAdd' | 'canEdit' | 'canDelete') => {
    setSelectedPermissions(prev => {
      if (!prev[menuId]) return prev;
      return {
        ...prev,
        [menuId]: {
          ...prev[menuId],
          [action]: !prev[menuId][action]
        }
      };
    });
  };

  const handleSaveUser = () => {
    if (!newUserEmail || !newUserEmail.includes('@')) {
      alert("Masukkan email yang valid!");
      return;
    }
    const emailLower = newUserEmail.toLowerCase().trim();
    const nameUpper = newUserName.toUpperCase().trim();
    
    if (!editingEmail && users.find(u => u.email.toLowerCase() === emailLower)) {
      alert("User ini sudah terdaftar!");
      return;
    }

    const allowedMenus: MenuAccess[] = Object.entries(selectedPermissions).map(([menuId, perms]) => ({
      menuId,
      canAdd: (perms as any).canAdd,
      canEdit: (perms as any).canEdit,
      canDelete: (perms as any).canDelete
    }));

    if (!canModify) {
      alert("Hanya Admin Utama yang bisa mengubah akses!");
      return;
    }

    if (allowedMenus.length === 0) {
      alert("Pilih minimal satu menu!");
      return;
    }

    let updatedUsers;
    if (editingEmail) {
      updatedUsers = users.map(u => u.email === editingEmail ? { email: emailLower, name: nameUpper, allowedMenus } : u);
    } else {
      updatedUsers = [...users, { email: emailLower, name: nameUpper, allowedMenus }];
    }

    onSave(updatedUsers);
    setNewUserEmail('');
    setNewUserName('');
    setEditingEmail(null);
    setSelectedPermissions({});
    setActiveTab('list');
    setSelectedUserEmail(emailLower);
    alert(editingEmail ? `Update user ${emailLower} berhasil!` : `User ${emailLower} berhasil ditambahkan!`);
  };

  const handleEditClick = (user: UserPermission) => {
    setEditingEmail(user.email);
    setNewUserEmail(user.email);
    setNewUserName(user.name || '');
    const perms: Record<string, { canAdd: boolean, canEdit: boolean, canDelete: boolean }> = {};
    user.allowedMenus.forEach(m => {
      perms[m.menuId] = { canAdd: m.canAdd, canEdit: m.canEdit, canDelete: m.canDelete };
    });
    setSelectedPermissions(perms);
    setActiveTab('add');
  };

  const handleDeleteUser = (email: string) => {
    if (!canModify) return;
    if (email === 'fauzanfawwaz2404@gmail.com') {
      alert("Admin utama tidak bisa dihapus!");
      return;
    }
    if (window.confirm(`Hapus akses untuk ${email}?`)) {
      const remainingUsers = users.filter(u => u.email.toLowerCase() !== email.toLowerCase());
      onSave(remainingUsers);
      if (selectedUserEmail === email) {
        setSelectedUserEmail(remainingUsers[0]?.email || null);
      }
    }
  };

  const getMenuIcon = (menuId: string) => {
    if (menuId.startsWith('pcc-rfm')) return <Database size={20} />;
    if (menuId.startsWith('bhf-')) return <Crown size={20} className="text-amber-500" />;
    if (menuId.startsWith('wa-personal')) return <Smartphone size={20} />;
    if (menuId.startsWith('ultah-')) return <Cake size={20} />;
    if (menuId.startsWith('about-')) return <BookOpen size={20} />;
    
    switch (menuId) {
      case 'dashboard': return <LayoutDashboard size={20} />;
      case 'input-log': return <Plus size={20} />;
      case 'riwayat': return <Key size={20} />;
      case 'target-sdm': return <Target size={20} />;
      case 'driver-wic': return <Smartphone size={20} />;
      case 'calendar-schedules': return <Calendar size={20} />;
      case 'admin-promo': return <Tag size={20} />;
      case 'my-links-favorites': return <LinkIcon size={20} />;
      case 'upaya-cc': return <HelpCircle size={20} />;
      case 'admin-kategori': return <Database size={20} />;
      case 'admin-target': return <Settings size={20} />;
      case 'setup-user': return <Shield size={20} />;
      case 'test-lab': return <Database size={20} />;
      case 'panel-lab': return <BookOpen size={20} />;
      case 'calc-lab': return <Plus size={20} />;
      case 'settings-lab': return <Settings size={20} />;
      default: return <Lock size={20} />;
    }
  };

  const handleSeedEmails = async () => {
    if (!canModify) return;
    try {
      const list = KNOWN_STAFF;

      if (!window.confirm(`Tambahkan ${list.length} email baru ke daftar akses?\nSistem akan mengatur izin Default (View-Only) untuk setiap user.`)) {
        return;
      }

      const defaultMenus: MenuAccess[] = availableMenus.map(m => ({
        menuId: m.id,
        canAdd: false,
        canEdit: false,
        canDelete: false
      }));

      const currentUsers = Array.isArray(users) ? [...users] : [];
      let updatedCount = 0;
      
      list.forEach(item => {
        const cleanEmail = item.email.toLowerCase().trim();
        const existingIdx = currentUsers.findIndex(u => u.email.toLowerCase() === cleanEmail);
        
        if (existingIdx >= 0) {
          if (currentUsers[existingIdx].name !== item.name) {
            currentUsers[existingIdx] = { ...currentUsers[existingIdx], name: item.name };
            updatedCount++;
          }
        } else {
          currentUsers.push({ email: cleanEmail, name: item.name, allowedMenus: defaultMenus });
          updatedCount++;
        }
      });
      
      if (updatedCount > 0) {
        await onSave(currentUsers);
        alert(`Berhasil! ${updatedCount} data user berhasil diupdate/ditambahkan.`);
      } else {
        alert("Semua email ini sudah ada dalam daftar dan datanya sudah sinkron.");
      }
    } catch (error: any) {
      alert("Gagal menambahkan email: " + error.message);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header with Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
            <Shield className="text-amber-500" size={32} /> USER <span className="text-amber-500">ACCESS</span>
          </h2>
          <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Granular Permission Management</p>
        </div>

        <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
          <button 
            onClick={() => setActiveTab('list')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:text-white'}`}
          >
            Daftar User
          </button>
          <button 
            onClick={() => setActiveTab('menu-first')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'menu-first' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'}`}
          >
            Setup Per Menu
          </button>
          <button 
            onClick={() => {
              setActiveTab('add');
              setEditingEmail(null);
              setNewUserEmail('');
              handleApplyDefaultPermissions();
            }}
            disabled={!canModify}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'add' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-white'} ${!canModify && 'opacity-30 cursor-not-allowed'}`}
          >
            {editingEmail ? 'Edit User' : 'Tambah User'}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'menu-first' ? (
          <motion.div
            key="menu-first"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Menu Selection Sidebar */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center gap-2 px-1 mb-4">
                <Database size={16} className="text-blue-500" />
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">PILIH MENU</p>
              </div>
              <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                {availableMenus.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMenuId(m.id)}
                    className={`p-4 rounded-2xl border transition-all text-left flex items-center gap-3 ${selectedMenuId === m.id ? 'bg-blue-600 text-white border-blue-400 shadow-xl shadow-blue-500/10' : 'bg-slate-900/40 border-white/5 text-slate-400 hover:bg-white/5 hover:border-white/10'}`}
                  >
                    <div className={`p-2 rounded-xl flex-none ${selectedMenuId === m.id ? 'bg-black/20 text-white' : 'bg-white/5 text-slate-500'}`}>
                      {getMenuIcon(m.id)}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tight truncate flex-1">{m.label}</span>
                    {selectedMenuId === m.id && <ChevronRight size={14} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Permissions Grid */}
            <div className="lg:col-span-9 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30 shadow-lg shadow-blue-500/10">
                    {getMenuIcon(selectedMenuId)}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">
                      AKSES: <span className="text-blue-500">{availableMenus.find(m => m.id === selectedMenuId)?.label}</span>
                    </h3>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Konfigurasi cepat siapa saja yang dapat mengakses menu ini</p>
                  </div>
                </div>
                <div className="relative w-full sm:w-64">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                   <input 
                      type="text" 
                      placeholder="Cari User..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-white focus:border-blue-500/50 transition-all placeholder:text-white/20"
                   />
                </div>
              </div>

              {/* Bulk Control Center */}
              <div className="flex flex-wrap items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-white/5">
                 <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                    <button 
                      onClick={() => handleBulkAction('selectAll')}
                      className="px-4 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-500/5"
                    >
                      Pilih Semua
                    </button>
                    <button 
                      onClick={() => handleBulkAction('removeAll')}
                      className="px-4 py-2 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-lg shadow-rose-500/5"
                    >
                      Hapus Semua
                    </button>
                 </div>
                 
                 <div className="flex items-center gap-3">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Global Perms:</p>
                    <div className="flex gap-1.5">
                       {[
                         { id: 'Add' as const, color: 'emerald' },
                         { id: 'Edit' as const, color: 'blue' },
                         { id: 'Delete' as const, color: 'rose' }
                       ].map(action => (
                         <div key={action.id} className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                            <button 
                              onClick={() => handleBulkAction(`enable${action.id}`)}
                              className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded transition-all hover:bg-${action.color}-500/20 text-${action.color}-400`}
                            >
                               ON
                            </button>
                            <div className="w-px bg-white/5 mx-1" />
                            <button 
                              onClick={() => handleBulkAction(`disable${action.id}`)}
                              className="px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded transition-all hover:bg-white/10 text-slate-600"
                            >
                               OFF
                            </button>
                         </div>
                       ))}
                    </div>
                 </div>
                 
                 <div className="ml-auto flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">Live Bulk Control</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredUsers.map(u => {
                  const menuAccess = u.allowedMenus.find(m => m.menuId === selectedMenuId);
                  const isSuperAdmin = u.email === 'fauzanfawwaz2404@gmail.com';
                  
                  return (
                    <div 
                      key={u.email}
                      className={`glass p-5 rounded-[2rem] border transition-all ${menuAccess ? 'border-blue-500/30 bg-blue-500/5 shadow-lg shadow-blue-500/5' : 'border-white/5 bg-slate-900/20 opacity-60 grayscale'}`}
                    >
                      <div className="flex items-center gap-3 mb-5">
                         <button 
                          onClick={() => setShowPreviewModal(u.email)}
                          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center flex-none transition-all group"
                          title="Preview tampilan user"
                         >
                            <User size={18} className="text-slate-500 group-hover:text-blue-400 group-hover:scale-110" />
                         </button>
                         <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-white uppercase truncate tracking-tight mb-0.5">{u.name || (u.email.includes('@') ? u.email.split('@')[0] : u.email)}</p>
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest truncate">{u.email}</p>
                         </div>
                         <button
                          onClick={() => {
                            if (isSuperAdmin) return;
                            updateUserMenuPermission(u.email, selectedMenuId, menuAccess ? null : { canAdd: false, canEdit: false, canDelete: false });
                          }}
                          disabled={isSuperAdmin}
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${menuAccess ? 'bg-blue-600 text-white border-blue-400' : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/20'}`}
                         >
                            {menuAccess ? <CheckCircle2 size={18} /> : <Plus size={18} />}
                         </button>
                      </div>

                      {menuAccess && !isSuperAdmin && (
                        <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl border border-white/5">
                           {[
                             { id: 'canAdd' as const, label: 'ADD', color: 'emerald' },
                             { id: 'canEdit' as const, label: 'EDIT', color: 'blue' },
                             { id: 'canDelete' as const, label: 'DEL', color: 'rose' }
                           ].map(action => (
                             <button
                               key={action.id}
                               onClick={() => updateUserMenuPermission(u.email, selectedMenuId, { 
                                 ...menuAccess, 
                                 [action.id]: !menuAccess[action.id] 
                               })}
                               className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                                 menuAccess[action.id] 
                                   ? `bg-${action.color}-500/20 text-${action.color}-400 border border-${action.color}-500/30` 
                                   : 'bg-white/5 text-slate-700 hover:text-slate-500'
                               }`}
                             >
                               {action.label}
                             </button>
                           ))}
                        </div>
                      )}
                      
                      {isSuperAdmin && (
                        <div className="py-2 px-4 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl text-center text-[8px] font-black uppercase tracking-widest italic">
                          SUPER ADMIN (FULL ACCESS)
                        </div>
                      )}
                      
                      {!menuAccess && !isSuperAdmin && (
                        <div className="py-3 text-center text-[7px] font-black text-slate-700 uppercase tracking-widest italic leading-none">
                           TIDAK MEMILIKI AKSES
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'list' ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Sidebar List */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="flex justify-between items-center px-1">
                 <p className="text-[10px] font-black text-amber-500/50 uppercase tracking-widest">Select User ({filteredUsers.length})</p>
                 {canModify && (
                   <button onClick={handleSeedEmails} className="text-[8px] font-black text-slate-500 hover:text-amber-500 uppercase tracking-widest">Auto-Seed Bulk</button>
                 )}
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Cari Email..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-white focus:border-amber-500/50 transition-all placeholder:text-white/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center glass rounded-3xl border border-white/5 opacity-40 italic text-xs uppercase font-black lg:col-span-1 md:col-span-2">User Tidak Ditemukan</div>
                ) : (
                  filteredUsers.map(u => (
                    <button
                      key={u.email}
                      onClick={() => setSelectedUserEmail(u.email)}
                      className={`group relative p-4 rounded-[2rem] border transition-all text-left flex items-center gap-3 ${selectedUserEmail === u.email ? 'bg-amber-500 text-black border-amber-400 shadow-xl shadow-amber-500/10 scale-[1.02]' : 'bg-slate-900/40 border-white/5 text-white hover:bg-white/5 hover:border-white/10'}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-none ${selectedUserEmail === u.email ? 'bg-black/20' : 'bg-white/5 border border-white/5'}`}>
                        {u.email === 'fauzanfawwaz2404@gmail.com' ? <Crown size={14} className={selectedUserEmail === u.email ? 'text-black' : 'text-amber-500'} /> : <User size={14} className="opacity-40" />}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className={`text-[10px] font-black truncate uppercase tracking-tight leading-none mb-1 ${selectedUserEmail === u.email ? 'text-black' : 'text-white'}`}>
                          {u.name || (u.email.includes('@') ? u.email.split('@')[0] : u.email)}
                        </p>
                        <p className={`text-[7px] font-bold uppercase tracking-widest truncate ${selectedUserEmail === u.email ? 'text-black/60' : 'text-slate-500'}`}>
                          {u.email}
                        </p>
                      </div>
                      {selectedUserEmail === u.email && (
                        <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Detail View */}
            <div className="lg:col-span-8">
              {activeUser ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass p-8 rounded-[3rem] border border-white/10 shadow-3xl flex flex-col h-full bg-slate-900/60 transition-all"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6 mb-12">
                    <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                       <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/30">
                          <User size={36} className="text-white" />
                       </div>
                       <div>
                          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-3 break-all cursor-help hover:text-amber-500 transition-colors" onClick={() => setShowPreviewModal(activeUser.email)}>
                             {activeUser.name ? `${activeUser.name} (${activeUser.email})` : activeUser.email}
                          </h3>
                          <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                             {activeUser.email === 'fauzanfawwaz2404@gmail.com' ? (
                               <span className="px-3 py-1 bg-amber-500 text-black text-[9px] font-black uppercase rounded-lg shadow-lg shadow-amber-500/20 flex items-center gap-2 italic">
                                 <Shield size={10} /> Super Admin
                               </span>
                             ) : (
                               <span className="px-3 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase rounded-lg shadow-lg shadow-emerald-500/20 italic">Standard User</span>
                             )}
                             <span className="px-3 py-1 bg-white/5 border border-white/10 text-white/40 text-[9px] font-black uppercase rounded-lg italic">Verified Access</span>
                          </div>
                       </div>
                    </div>
                    
                    {canModify && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditClick(activeUser)}
                          className="p-3.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-2xl hover:bg-blue-500 hover:text-white transition-all shadow-xl group"
                          title="Edit Permissions"
                        >
                          <Edit size={18} className="group-hover:scale-110" />
                        </button>
                        {activeUser.email !== 'fauzanfawwaz2404@gmail.com' && (
                          <button 
                            onClick={() => handleDeleteUser(activeUser.email)}
                            className="p-3.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-xl group"
                            title="Delete User"
                          >
                            <Trash2 size={18} className="group-hover:scale-110" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] pl-1 flex items-center gap-2 italic">
                        <Lock size={12} /> RINCIAN AKSES MENU (GRID VIEW)
                      </p>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                       {activeUser.allowedMenus.length === 0 ? (
                         <div className="md:col-span-3 p-10 text-center glass rounded-[2rem] border border-white/5 text-slate-500 uppercase font-black italic text-xs">PENGGUNA TIDAK MEMILIKI AKSES MENU APAPUN</div>
                       ) : (
                         activeUser.allowedMenus.map(m => {
                           const menuLabel = availableMenus.find(am => am.id === m.menuId)?.label || m.menuId;
                           const isReadOnly = !m.canAdd && !m.canEdit && !m.canDelete;

                           return (
                             <motion.div 
                               initial={{ scale: 0.95, opacity: 0 }}
                               animate={{ scale: 1, opacity: 1 }}
                               key={m.menuId} 
                               className={`glass p-6 rounded-[2.5rem] border transition-all h-full flex flex-col group ${isReadOnly ? 'border-white/5 opacity-50 bg-black/20' : 'border-amber-500/20 bg-white/5 hover:border-amber-400/50 hover:bg-white/[0.08] shadow-2xl shadow-black/80'}`}
                             >
                                <div className="flex items-center justify-between mb-5">
                                   <div className={`p-3 rounded-2xl ${isReadOnly ? 'bg-white/5 text-white/30' : 'bg-amber-400/20 text-amber-400 animate-pulse'}`}>
                                      {getMenuIcon(m.menuId)}
                                   </div>
                                   {isReadOnly ? (
                                      <span className="text-[7px] font-black bg-white/5 text-slate-600 px-2.5 py-1 rounded-full border border-white/5">READ ONLY</span>
                                   ) : (
                                      <span className="text-[7px] font-black bg-amber-400 text-black px-2.5 py-1 rounded-full shadow-lg shadow-amber-500/20">ACTIVE ACCESS</span>
                                   )}
                                </div>
                                <h4 className="text-[13px] font-black text-white uppercase tracking-tight mb-5 truncate italic leading-none">{menuLabel}</h4>
                                
                                <div className="mt-auto flex flex-col gap-2">
                                   <div className="flex gap-2 p-1.5 bg-black/40 rounded-[1.2rem] border border-white/5">
                                      <div className={`flex-1 py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${m.canAdd ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/10'}`}>
                                         <Plus size={10} className={m.canAdd ? 'animate-bounce' : ''} />
                                         <span className="text-[7px] font-black uppercase">ADD</span>
                                      </div>
                                      <div className={`flex-1 py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${m.canEdit ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-white/10'}`}>
                                         <Edit size={10} />
                                         <span className="text-[7px] font-black uppercase">EDIT</span>
                                      </div>
                                      <div className={`flex-1 py-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${m.canDelete ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-white/5 text-white/10'}`}>
                                         <Trash size={10} />
                                         <span className="text-[7px] font-black uppercase">DEL</span>
                                      </div>
                                   </div>
                                </div>
                             </motion.div>
                           )
                         })
                       )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center glass rounded-[3rem] border border-white/5 p-20 text-center">
                   <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-white/10 mb-6">
                      <Mail size={48} />
                   </div>
                   <h3 className="text-xl font-black text-white italic uppercase tracking-tighter opacity-20">Pilih User di Samping</h3>
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2 max-w-xs">Pilih salah satu email dari daftar untuk melihat dan mengelola rincian izin akses menu secara granular.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-4xl mx-auto w-full"
          >
            <div className="glass p-10 rounded-[3rem] border border-white/10 shadow-3xl bg-slate-900/60 relative overflow-hidden">
               <div className="absolute -top-10 -right-10 opacity-5">
                  <UserPlus size={240} />
               </div>

               <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row items-center gap-6 mb-12">
                     <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                        <UserPlus className="text-emerald-500" size={28} />
                     </div>
                     <div className="text-center sm:text-left">
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">{editingEmail ? 'REVISI IZIN AKSES' : 'DAFTARKAN PENGGUNA BARU'}</h3>
                        <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest mt-2">Konfigurasi Hak Akses Granular Berdasarkan Role</p>
                     </div>
                  </div>

                   <div className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="form-control">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-4 block">Nama Petugas</label>
                          <div className="relative">
                            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-400" size={24} />
                            <input 
                                type="text"
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                                placeholder="CONTOH: FAUZAN"
                                className="w-full bg-black/50 border-2 border-white/5 rounded-[2rem] py-6 pl-16 pr-8 text-white focus:outline-none focus:border-blue-500/50 transition-all font-black uppercase text-xl italic tracking-tight placeholder:text-white/10"
                            />
                          </div>
                        </div>

                        <div className="form-control">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-4 block">Email Pengguna Prodia</label>
                          <div className="relative">
                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500" size={24} />
                            <input 
                                type="email"
                                value={newUserEmail}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNewUserEmail(val);
                                  // Auto-fill name if email is known
                                  const found = KNOWN_STAFF.find(ks => ks.email.toLowerCase() === val.toLowerCase().trim());
                                  if (found) {
                                    setNewUserName(found.name);
                                  }
                                }}
                                placeholder="fauzan.fawwaz@prodia.co.id"
                                className="w-full bg-black/50 border-2 border-white/5 rounded-[2rem] py-6 pl-16 pr-8 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-black uppercase text-xl italic tracking-tight placeholder:text-white/10"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="form-control">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-5 block">Manifest Hak Akses (Aktifkan Menu)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                           {availableMenus.map(menu => {
                             const isActive = !!selectedPermissions[menu.id];
                             return (
                               <div key={menu.id} className={`flex flex-col p-6 rounded-[2.5rem] border transition-all ${isActive ? 'bg-emerald-500/10 border-emerald-500/40 shadow-emerald-500/10 shadow-lg' : 'bg-white/5 border-white/5 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 hover:border-white/20 hover:scale-[1.02]'}`}>
                                 <button
                                   onClick={() => handleToggleMenu(menu.id)}
                                   className="flex items-center gap-4 w-full text-left mb-5"
                                 >
                                   <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isActive ? 'bg-emerald-400 text-black shadow-lg shadow-emerald-400/20' : 'bg-white/10 text-white/40'}`}>
                                      {getMenuIcon(menu.id)}
                                   </div>
                                   <span className={`text-[13px] font-black uppercase tracking-tight flex-1 italic ${isActive ? 'text-white' : 'text-slate-500'}`}>{menu.label}</span>
                                   {isActive ? <CheckCircle2 size={24} className="text-emerald-400" /> : <div className="w-6 h-6 rounded-full border-2 border-white/10" />}
                                 </button>
                                 
                                 <AnimatePresence>
                                   {isActive && (
                                     <motion.div 
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      className="flex gap-2"
                                     >
                                       {[
                                         { id: 'canAdd' as const, label: 'A', tooltip: 'Add' },
                                         { id: 'canEdit' as const, label: 'E', tooltip: 'Edit' },
                                         { id: 'canDelete' as const, label: 'D', tooltip: 'Delete' }
                                       ].map(action => (
                                         <button
                                           key={action.id}
                                           onClick={() => handleToggleAction(menu.id, action.id)}
                                           className={`flex-1 h-10 rounded-xl text-[10px] font-black transition-all border ${
                                             selectedPermissions[menu.id][action.id] 
                                             ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20' 
                                             : 'bg-black/20 text-slate-500 border-white/5 hover:bg-white/10'
                                           }`}
                                         >
                                           {action.label}
                                         </button>
                                       ))}
                                     </motion.div>
                                   )}
                                 </AnimatePresence>
                               </div>
                             )
                           })}
                        </div>
                     </div>

                     <div className="flex flex-col sm:flex-row gap-5 pt-6">
                        <button 
                           onClick={() => {
                              setActiveTab('list');
                              setEditingEmail(null);
                           }}
                           className="flex-1 h-18 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-[0.2em] rounded-[2rem] transition-all border border-white/10 italic text-[11px]"
                        >
                           BATAL & KEMBALI
                        </button>
                        <button 
                           onClick={handleSaveUser}
                           className="flex-[2] h-18 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-3xl shadow-emerald-600/30 transition-all active:scale-95 flex items-center justify-center gap-4 italic text-[11px]"
                        >
                           <Shield size={24} /> {editingEmail ? 'SIMPAN PERUBAHAN' : 'AKTIFKAN AKSES PENGGUNA'}
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PREVIEW MODAL */}
      <AnimatePresence>
        {showPreviewModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass w-full max-w-lg p-10 rounded-[3rem] border border-white/10 shadow-3xl bg-[#0a0b0d] relative overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
              
              <div className="flex justify-between items-center mb-10 relative">
                 <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                       <LayoutDashboard size={32} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">USER PREVIEW</h3>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Live simulation for {showPreviewModal}</p>
                    </div>
                 </div>
                 <button 
                  onClick={() => setShowPreviewModal(null)}
                  className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 flex items-center justify-center transition-all"
                 >
                    <X size={24} />
                 </button>
              </div>

              <div className="space-y-6 relative">
                 <div className="p-1 bg-white/5 rounded-2xl border border-white/5 mb-4">
                    <p className="text-[8px] font-black text-center text-slate-600 uppercase tracking-[0.4em] py-2">DASHBOARD SIMULATION VIEW</p>
                 </div>

                 <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="bg-white/5 p-4 border-b border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-rose-500" />
                          <div className="w-3 h-3 rounded-full bg-amber-500" />
                          <div className="w-3 h-3 rounded-full bg-emerald-500" />
                       </div>
                       <div className="px-3 py-1 bg-black/40 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest border border-white/5">
                          ACHIEVETRACK V.5.0
                       </div>
                    </div>
                    
                    <div className="flex h-[350px]">
                       {/* Sidebar Simulation */}
                       <div className="w-20 sm:w-28 bg-black/40 border-r border-white/5 p-3 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
                          {availableMenus
                            .filter(m => {
                              if (showPreviewModal === 'fauzanfawwaz2404@gmail.com') return true;
                              const user = users.find(u => u.email === showPreviewModal);
                              return user?.allowedMenus.some(am => am.menuId === m.id);
                            })
                            .map(m => (
                              <div key={m.id} className="p-3 bg-white/5 rounded-xl flex flex-col items-center gap-2 opacity-60">
                                 {getMenuIcon(m.id)}
                                 <span className="text-[6px] font-black uppercase text-center leading-none tracking-tighter truncate w-full">{m.label}</span>
                              </div>
                            ))
                          }
                          {/* If no menus */}
                          {showPreviewModal !== 'fauzanfawwaz2404@gmail.com' && !users.find(u => u.email === showPreviewModal)?.allowedMenus.length && (
                            <div className="flex flex-col items-center justify-center h-full opacity-20">
                               <Lock size={16} />
                            </div>
                          )}
                       </div>
                       
                       {/* Content Simulation */}
                       <div className="flex-1 p-6 bg-slate-950 flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/10 mb-4 animate-pulse">
                             <Crown size={32} />
                          </div>
                          <h4 className="text-[13px] font-black text-white italic uppercase tracking-tighter mb-2">PENGGUNA AKTIF</h4>
                          <span className="px-3 py-1 bg-amber-500 text-black text-[9px] font-black rounded-lg uppercase italic mb-8">{showPreviewModal}</span>
                          
                          <div className="grid grid-cols-2 gap-3 w-full">
                             <div className="h-10 bg-white/5 rounded-xl border border-white/5" />
                             <div className="h-10 bg-white/5 rounded-xl border border-white/5" />
                             <div className="h-20 col-span-2 bg-white/5 rounded-xl border border-white/5" />
                          </div>
                       </div>
                    </div>
                 </div>

                 <p className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-widest italic pt-4">
                    Tampilan ini adalah simulasi sidebar berdasarkan hak akses yang Anda berikan.
                 </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="glass border border-white/10 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-8 bg-slate-900/40">
        <div className="w-16 h-16 rounded-[1.2rem] bg-brand-500/20 flex items-center justify-center flex-none border border-brand-500/20">
           <Shield className="text-brand-400" size={32} />
        </div>
        <div className="text-center md:text-left">
           <h4 className="text-xs font-black text-brand-400 uppercase italic tracking-[0.2em] mb-2 leading-none">Security Management Guidance</h4>
           <div className="text-[10px] text-slate-400 font-bold space-y-1 leading-relaxed">
             <p>• Panel rincian di sebelah kanan menampilkan visualisasi permission dalam bentuk kotak <span className="text-amber-500">(Box View)</span> untuk memudahkan pengecekan.</p>
             <p>• Pastikan email yang didaftarkan telah terdaftar di sistem Firebase Authentication.</p>
             <p>• Hak akses <span className="text-emerald-500 italic">"Full Access"</span> ditandai dengan warna hijau/emas pada indikator Add-Edit-Delete.</p>
             <p>• <span className="text-white">Tip:</span> Anda tetap bisa mengubah detail akses kapan saja melalui tombol Edit di panel rincian.</p>
           </div>
        </div>
      </div>
    </div>
  );
}
