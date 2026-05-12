import { useState, useEffect, useMemo } from 'react';
import { ref, onValue, set, push, update, query, limitToLast } from 'firebase/database';
import { rtdb, auth } from '../firebase';
import { Kategori, Promo, Transaksi, DriverWicData, UpayaCC, TargetPerPetugas, PatientRecord, FavoriteLink, BirthdayRecord, CalendarActivity, WASetup, WATarget, WAHistory, WACampaignSummary, WABlacklist, UserPermission, AppDoc, BHFUpaya, BHFMember, TestLab, Panel, BHFIssue, Staff, WSHP } from '../types';
import { WIC_CATEGORIES, MONTHS } from '../constants';

export function useFirebaseSync(user: any, impersonatedEmail?: string | null) {
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [transaksi, setTransaksi] = useState<Transaksi[]>([]);
  const [driverWicData, setDriverWicData] = useState<DriverWicData>({});
  const [upayaData, setUpayaData] = useState<UpayaCC[]>([]);
  const [upayaCategories, setUpayaCategories] = useState<string[]>([]);
  const [targetPerPetugas, setTargetPerPetugas] = useState<TargetPerPetugas>({});
  const [pccrfmRecords, setPccrfmRecords] = useState<PatientRecord[]>([]);
  const [favoriteLinks, setFavoriteLinks] = useState<FavoriteLink[]>([]);
  const [birthdayRecords, setBirthdayRecords] = useState<BirthdayRecord[]>([]);
  const [calendarActivities, setCalendarActivities] = useState<CalendarActivity[]>([]);
  const [waSetup, setWaSetup] = useState<WASetup | null>(null);
  const [waCampaigns, setWaCampaigns] = useState<WACampaignSummary[]>([]);
  const [waSetupCBG, setWaSetupCBG] = useState<WASetup | null>(null);
  const [waSetupsCBG, setWaSetupsCBG] = useState<{[key: string]: WASetup}>({});
  const [waCampaignsCBG, setWaCampaignsCBG] = useState<WACampaignSummary[]>([]);
  const [waBlacklist, setWaBlacklist] = useState<WABlacklist[]>([]);
  const [staffCBG, setStaffCBG] = useState<Staff[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [appDocs, setAppDocs] = useState<AppDoc[]>([]);
  const [bhfUpaya, setBhfUpaya] = useState<BHFUpaya[]>([]);
  const [bhfIssues, setBhfIssues] = useState<BHFIssue[]>([]);
  const [bhfMembers, setBhfMembers] = useState<BHFMember[]>([]);
  const [bhfGroups, setBhfGroups] = useState<string[]>(['Kelompok 1', 'Kelompok 2', 'Kelompok 3', 'Kelompok 4', 'Customer Care']);
  const [testLabs, setTestLabs] = useState<TestLab[]>([]);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [wshps, setWshps] = useState<WSHP[]>([]);
  const [userProfile, setUserProfile] = useState<{ displayName: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const [rawWaTargets, setRawWaTargets] = useState<WATarget[]>([]);
  const [rawWaHistory, setRawWaHistory] = useState<WAHistory[]>([]);
  const [rawWaTargetsCBG, setRawWaTargetsCBG] = useState<WATarget[]>([]);
  const [rawWaHistoryCBG, setRawWaHistoryCBG] = useState<WAHistory[]>([]);

  const emailLower = user?.email?.toLowerCase();
  const effectiveEmail = impersonatedEmail?.toLowerCase() || emailLower;
  const isSuperAdmin = emailLower === 'fauzanfawwaz2404@gmail.com';
  const isImpersonating = !!impersonatedEmail;
  
  // Determine effective permissions for logic (usually super admin bypasses, but if impersonating they check target perms)
  const access = userPermissions.find(p => p.email.toLowerCase() === (isImpersonating ? effectiveEmail : emailLower));
  const allowedMenus = (access?.allowedMenus || []).map(m => m.menuId);

  const checkAccess = (menuId: string | string[]) => {
    if (isSuperAdmin && !isImpersonating) return true;
    if (Array.isArray(menuId)) return menuId.some(m => allowedMenus.includes(m));
    return allowedMenus.includes(menuId);
  };

  // Mapping email to petugasNama for bandwidth optimization
  const staffMapping: { [key: string]: string } = {
    'annisaraafiyani@gmail.com': 'ANNISA',
    'ashri.setiyawati@prodia.co.id': 'ASHRI',
    'ayurini2412@gmail.com': 'AYU',
    'deasy.retno@prodia.co.id': 'DEASY',
    'devi.yulianti@prodia.co.id': 'DEVY',
    'dhyaneka.de@gmail.com': 'DHIAN',
    'diaharumfajarwati.daf@gmail.com': 'DIAH',
    'elia.chrisnawati@prodia.co.id': 'ELIA',
    'citraafiona@gmail.com': 'FIONA',
    'dheena.soemardi83@gmail.com': 'HELLY',
    'lina.hendrawati@prodia.co.id': 'LINA',
    'mustikarahmawati.mr@gmail.com': 'MUSTIKA',
    'putrisuyono13@gmail.com': 'PUTRI',
    'ratnoade365@gmail.com': 'RATNO',
    'restugandhinii95@gmail.com': 'RESTU',
    'riska.noermawati17@gmail.com': 'RISKA',
    'riyaharyani17@gmail.com': 'RIYA',
    'rospianipurba@gmail.com': 'ROS',
    'masyitanurhidayati08@gmail.com': 'SITA',
    'najwaafiahtenri@gmail.com': 'SUKAERI',
    'anajuliuss@gmail.com': 'TRIYANA',
    'fauzanfawwaz2404@gmail.com': 'FAUZAN',
    'nur.fauzan@prodia.co.id': 'NUR FAUZAN'
  };

  const normalizePetugasName = (name: string | null | undefined): string | null => {
    if (!name) return null;
    const upper = name.toUpperCase();
    if (upper === 'DIAN' || upper === 'DHYAN' || upper.includes('DHYAN EKA')) return 'DHIAN';
    if (upper === 'SITA' || upper.includes('MASYITA') || upper.includes('NURHIDAYATI')) return 'SITA';
    return upper;
  };

  // Use dynamic name from userPermissions first, fallback to staffMapping
  const rawDynamicName = userPermissions.find(p => p.email.toLowerCase() === effectiveEmail)?.name;
  const petugasName = normalizePetugasName(rawDynamicName || (effectiveEmail ? staffMapping[effectiveEmail] : null));

  const filteredWaTargets = useMemo(() => {
    if (!petugasName || (isSuperAdmin && !isImpersonating)) return rawWaTargets;
    return rawWaTargets.filter(t => normalizePetugasName(t.petugasNama) === petugasName);
  }, [rawWaTargets, petugasName, isSuperAdmin, isImpersonating]);

  const filteredWaHistory = useMemo(() => {
    if (!petugasName || (isSuperAdmin && !isImpersonating)) return rawWaHistory;
    return rawWaHistory.filter(h => normalizePetugasName(h.petugasNama) === petugasName);
  }, [rawWaHistory, petugasName, isSuperAdmin, isImpersonating]);

  const filteredWaTargetsCBG = useMemo(() => {
    if (!petugasName || (isSuperAdmin && !isImpersonating)) return rawWaTargetsCBG;
    return rawWaTargetsCBG.filter(t => normalizePetugasName(t.petugasNama) === petugasName);
  }, [rawWaTargetsCBG, petugasName, isSuperAdmin, isImpersonating]);

  const filteredWaHistoryCBG = useMemo(() => {
    if (!petugasName || (isSuperAdmin && !isImpersonating)) return rawWaHistoryCBG;
    return rawWaHistoryCBG.filter(h => normalizePetugasName(h.petugasNama) === petugasName);
  }, [rawWaHistoryCBG, petugasName, isSuperAdmin, isImpersonating]);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refresh = () => {
    setRefreshTrigger(prev => prev + 1);
    setLoading(true);
  };

  // 1. Core Permissions Sync (Always Active)
  useEffect(() => {
    if (!user) return;
    const permissionsRef = ref(rtdb, 'userPermissions');
    const unsub = onValue(permissionsRef, (snapshot) => {
      const data = snapshot.val();
      const list: UserPermission[] = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
      setUserPermissions(list.filter(Boolean));
    });
    return () => unsub();
  }, [user]);

  // 2. Profile Sync (Always Active)
  useEffect(() => {
    if (!user) return;
    const profileRef = ref(rtdb, `userProfiles/${user.uid}`);
    const unsub = onValue(profileRef, (snapshot) => {
      setUserProfile(snapshot.val());
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || userPermissions.length === 0) return;

    const unsubscribers: (() => void)[] = [];

    // Define helper to add listeners
    const addListener = (path: string, setter: (val: any) => void, q?: any) => {
      const r = q || ref(rtdb, path);
      unsubscribers.push(onValue(r, (snapshot) => {
        const data = snapshot.val();
        setter(data);
      }));
    };

    // Essential Global Setup (Always needed for core logic)
    addListener('waSetup', setWaSetup);
    addListener('waSetupCBG', setWaSetupCBG);
    addListener('waSetupsCBG', setWaSetupsCBG);
    addListener('waBlacklist', (data) => {
      const list = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
      setWaBlacklist(list.filter(Boolean));
    }, query(ref(rtdb, 'waBlacklist'), limitToLast(1000)));

    // Menu-based Subscriptions
    if (checkAccess(['dashboard', 'input-log', 'riwayat', 'promo-berjalan', 'target-sdm', 'admin-kategori', 'admin-promo', 'admin-target'])) {
      addListener('kategori', (data) => {
        const list = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
        setKategori(list.filter(Boolean));
      });
      addListener('promos', (data) => {
        const list = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
        setPromos(list.filter(Boolean));
      });
      addListener('transaksi', (data) => {
        const list: Transaksi[] = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
        setTransaksi([...list.filter(Boolean)].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }, query(ref(rtdb, 'transaksi'), limitToLast(200)));
    }

    if (checkAccess('driver-wic')) {
      addListener('driverWic', setDriverWicData);
    }

    if (checkAccess('upaya-cc')) {
      addListener('upaya', (data) => {
        const list: UpayaCC[] = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
        setUpayaData([...list.filter(Boolean)].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }, query(ref(rtdb, 'upaya'), limitToLast(50)));
      addListener('upayaCategories', (data) => setUpayaCategories(data || ["WA PERSONAL", "KUNJUNGAN", "TELPON", "LAIN LAIN"]));
    }

    if (checkAccess('admin-target') || checkAccess('target-sdm')) {
      addListener('targets', (v) => setTargetPerPetugas(v || {}));
    }

    if (checkAccess(['pcc-rfm', 'ultah-pelanggan'])) {
      addListener('pccrfm', (data) => {
        let list: PatientRecord[] = [];
        if (data) {
          if (Array.isArray(data)) {
            list = data.map((item, index) => item ? { ...item, id: item.id !== undefined && item.id !== null ? String(item.id) : String(index) } : null)
                      .filter((item): item is PatientRecord => item !== null);
          } else {
            list = Object.entries(data).map(([key, value]) => ({ ...(value as PatientRecord), id: key }));
          }
        }
        setPccrfmRecords(list);
      }, query(ref(rtdb, 'pccrfm'), limitToLast(150)));
    }

    if (checkAccess('ultah-pelanggan')) {
      addListener('birthdayRecords', (data) => {
        const list = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
        setBirthdayRecords(list.filter(Boolean));
      }, query(ref(rtdb, 'birthdayRecords'), limitToLast(100)));
    }

    if (checkAccess('my-links-favorites')) {
      addListener('favoriteLinks', (data) => {
        const list = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
        setFavoriteLinks([...list.filter(Boolean)].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      });
    }

    if (checkAccess('calendar-schedules')) {
      addListener('calendarActivities', (data) => {
        const list = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
        setCalendarActivities(list.filter(Boolean));
      });
    }

    if (checkAccess('wa-personal')) {
      // Fetch full lists once, filtering happens in useMemo
      addListener('waTargets', (data) => {
        const list = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
        setRawWaTargets(list.filter(Boolean));
      }, query(ref(rtdb, 'waTargets'), limitToLast(5000)));

      addListener('waHistory', (data) => {
        const list = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
        setRawWaHistory(list.filter(Boolean));
      }, query(ref(rtdb, 'waHistory'), limitToLast(2000)));
      
      addListener('waCampaigns', (data) => {
        const list = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
        setWaCampaigns(list.filter(Boolean));
      }, query(ref(rtdb, 'waCampaigns'), limitToLast(100)));
    }

    if (checkAccess('wa-cbg')) {
      addListener('waTargetsCBG', (data) => {
        const list = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
        setRawWaTargetsCBG(list.filter(Boolean));
      }, query(ref(rtdb, 'waTargetsCBG'), limitToLast(5000)));

      addListener('waHistoryCBG', (data) => {
        const list = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
        setRawWaHistoryCBG(list.filter(Boolean));
      }, query(ref(rtdb, 'waHistoryCBG'), limitToLast(2000)));
      addListener('waCampaignsCBG', (data) => {
        const list = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
        setWaCampaignsCBG(list.filter(Boolean));
      }, query(ref(rtdb, 'waCampaignsCBG'), limitToLast(100)));
      addListener('staffCBG', (data) => {
        const list = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
        setStaffCBG(list.filter(Boolean));
      });
    }

    if (checkAccess(['bhf-upaya', 'bhf-pemantauan', 'bhf-kelompok'])) {
      addListener('bhfUpaya', (data) => {
        let list: BHFUpaya[] = [];
        if (data) {
          if (Array.isArray(data)) {
            list = data.filter(Boolean).map((item, idx) => ({ ...item, id: item.id || `temp_bhf_${idx}` }));
          } else {
            list = Object.entries(data).map(([key, value]) => ({ ...(value as BHFUpaya), id: (value as BHFUpaya).id || key }));
          }
        }
        setBhfUpaya([...list].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()));
      }, query(ref(rtdb, 'bhfUpaya'), limitToLast(50)));
      addListener('bhfIssues', (data) => {
        let list: BHFIssue[] = [];
        if (data) {
          if (Array.isArray(data)) { list = data.filter(Boolean); }
          else { list = Object.entries(data).map(([key, value]) => ({ ...(value as BHFIssue), id: (value as BHFIssue).id || key })); }
        }
        setBhfIssues([...list].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()));
      });
      addListener('bhfMembers', (data) => {
        const list = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
        setBhfMembers(list.filter(Boolean));
      });
      addListener('bhfGroups', (data) => { if (data && Array.isArray(data)) setBhfGroups(data); });
    }

    if (checkAccess(['test-lab', 'panel-lab', 'wshp-lab', 'settings-lab'])) {
      addListener('testLabs', (data) => {
        const list = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
        setTestLabs(list.filter(Boolean));
      });
      addListener('panels', (data) => {
        const list = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
        setPanels(list.filter(Boolean));
      });
      addListener('wshps', (data) => {
        const list = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
        setWshps(list.filter(Boolean));
      });
    }

    if (checkAccess('about-version')) {
      addListener('appDocs', (data) => {
        const list = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
        setAppDocs(list.filter(Boolean));
      });
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user, userPermissions, impersonatedEmail]);

  const saveData = useMemo(() => ({
    kategori: (data: Kategori[]) => set(ref(rtdb, 'kategori'), data),
    promos: (data: Promo[]) => set(ref(rtdb, 'promos'), data),
    transaksi: (data: Transaksi) => {
      const hasId = data.id !== undefined && data.id !== null && data.id !== '';
      const newRef = hasId ? ref(rtdb, `transaksi/${data.id}`) : push(ref(rtdb, 'transaksi'));
      const id = hasId ? String(data.id) : newRef.key;
      return set(newRef, { ...data, id });
    },
    deleteTransaksi: (id: string | number) => set(ref(rtdb, `transaksi/${id}`), null),
    driverWic: (data: DriverWicData) => set(ref(rtdb, 'driverWic'), data),
    upaya: (data: UpayaCC) => {
      const hasId = data.id !== undefined && data.id !== null && data.id !== '';
      const newRef = hasId ? ref(rtdb, `upaya/${data.id}`) : push(ref(rtdb, 'upaya'));
      const id = hasId ? String(data.id) : newRef.key;
      return set(newRef, { ...data, id });
    },
    deleteUpaya: (id: string) => set(ref(rtdb, `upaya/${id}`), null),
    upayaCats: (data: string[]) => set(ref(rtdb, 'upayaCategories'), data),
    targets: (data: TargetPerPetugas) => set(ref(rtdb, 'targets'), data),
    pccrfm: (data: PatientRecord) => {
      const hasId = data.id !== undefined && data.id !== null && data.id !== '';
      const newRef = hasId ? ref(rtdb, `pccrfm/${data.id}`) : push(ref(rtdb, 'pccrfm'));
      const id = hasId ? String(data.id) : newRef.key;
      return set(newRef, { ...data, id });
    },
    pccrfmMany: (data: PatientRecord[]) => {
      // Create updates object to push multiple records at once
      const updates: any = {};
      data.forEach(r => {
        const hasId = r.id !== undefined && r.id !== null && r.id !== '';
        const id = hasId ? String(r.id) : push(ref(rtdb, 'pccrfm')).key;
        updates[id!] = { ...r, id };
      });
      return update(ref(rtdb, 'pccrfm'), updates);
    },
    deletePccrfm: (id: string) => set(ref(rtdb, `pccrfm/${id}`), null),
    clearPccrfmAll: (type: 'PCC' | 'RFM') => {
      const filtered = pccrfmRecords.filter(r => r.type !== type);
      const updates: any = {};
      filtered.forEach(r => {
        updates[r.id!] = r;
      });
      return set(ref(rtdb, 'pccrfm'), updates);
    },
    claimProfile: (displayName: string) => {
      if (!user) return;
      return set(ref(rtdb, `userProfiles/${user.uid}`), { displayName });
    },
    favoriteLink: (data: FavoriteLink) => {
      // If we provided an ID from Date.now(), let's use it, but push is safer if we want auto-ids
      const hasId = data.id !== undefined && data.id !== null && data.id !== '' && !data.id.startsWith('temp_');
      const newRef = hasId ? ref(rtdb, `favoriteLinks/${data.id}`) : push(ref(rtdb, 'favoriteLinks'));
      const id = hasId ? String(data.id) : newRef.key;
      return set(newRef, { ...data, id });
    },
    deleteFavoriteLink: (id: string) => set(ref(rtdb, `favoriteLinks/${id}`), null),
    birthdayRecord: (data: BirthdayRecord) => {
      const hasId = data.id !== undefined && data.id !== null && data.id !== '';
      const newRef = hasId ? ref(rtdb, `birthdayRecords/${data.id}`) : push(ref(rtdb, 'birthdayRecords'));
      const id = hasId ? String(data.id) : newRef.key;
      return set(newRef, { ...data, id });
    },
    birthdayRecordMany: (data: BirthdayRecord[]) => {
      const updates: any = {};
      data.forEach(r => {
        const hasId = r.id !== undefined && r.id !== null && r.id !== '';
        const id = hasId ? String(r.id) : push(ref(rtdb, 'birthdayRecords')).key;
        updates[id!] = { ...r, id };
      });
      return update(ref(rtdb, 'birthdayRecords'), updates);
    },
    deleteBirthdayRecord: (id: string) => set(ref(rtdb, `birthdayRecords/${id}`), null),
    clearBirthdayRecordsAll: () => set(ref(rtdb, 'birthdayRecords'), null),
    calendarActivity: (data: CalendarActivity) => {
      const hasId = data.id !== undefined && data.id !== null && data.id !== '';
      const newRef = hasId ? ref(rtdb, `calendarActivities/${data.id}`) : push(ref(rtdb, 'calendarActivities'));
      const id = hasId ? String(data.id) : newRef.key;
      return set(newRef, { ...data, id });
    },
    deleteCalendarActivity: (id: string) => set(ref(rtdb, `calendarActivities/${id}`), null),
    waSetup: (data: WASetup) => set(ref(rtdb, 'waSetup'), data),
    waTarget: (data: WATarget) => {
      const hasId = data.id !== undefined && data.id !== null && data.id !== '';
      const newRef = hasId ? ref(rtdb, `waTargets/${data.id}`) : push(ref(rtdb, 'waTargets'));
      const id = hasId ? String(data.id) : newRef.key;
      return set(newRef, { ...data, id });
    },
    waTargetMany: (targets: WATarget[]) => {
      const updates: any = {};
      targets.forEach(t => {
        const id = t.id || push(ref(rtdb, 'waTargets')).key;
        updates[id!] = { ...t, id };
      });
      return update(ref(rtdb, 'waTargets'), updates);
    },
    deleteWaTarget: (id: string) => set(ref(rtdb, `waTargets/${id}`), null),
    clearWaTargets: () => set(ref(rtdb, 'waTargets'), null),
    waHistory: (data: WAHistory) => {
      const newRef = push(ref(rtdb, 'waHistory'));
      return set(newRef, { ...data, id: newRef.key });
    },
    waCampaign: (data: WACampaignSummary) => {
      const hasId = data.id !== undefined && data.id !== null && data.id !== '';
      const newRef = hasId ? ref(rtdb, `waCampaigns/${data.id}`) : push(ref(rtdb, 'waCampaigns'));
      const id = hasId ? String(data.id) : newRef.key;
      return set(newRef, { ...data, id });
    },
    deleteWaCampaign: (id: string) => set(ref(rtdb, `waCampaigns/${id}`), null),
    waSetupCBG: (data: WASetup, id?: string) => {
      const path = id ? `waSetupsCBG/${id}` : 'waSetupCBG';
      return set(ref(rtdb, path), data);
    },
    waTargetCBG: (data: WATarget) => {
      const hasId = data.id !== undefined && data.id !== null && data.id !== '';
      const newRef = hasId ? ref(rtdb, `waTargetsCBG/${data.id}`) : push(ref(rtdb, 'waTargetsCBG'));
      const id = hasId ? String(data.id) : newRef.key;
      return set(newRef, { ...data, id });
    },
    waTargetManyCBG: (targets: WATarget[]) => {
      const updates: any = {};
      targets.forEach(t => {
        const id = t.id || push(ref(rtdb, 'waTargetsCBG')).key;
        updates[id!] = { ...t, id };
      });
      return update(ref(rtdb, 'waTargetsCBG'), updates);
    },
    deleteWaTargetCBG: (id: string) => set(ref(rtdb, `waTargetsCBG/${id}`), null),
    clearWaTargetsCBG: () => set(ref(rtdb, 'waTargetsCBG'), null),
    waHistoryCBG: (data: WAHistory) => {
      const newRef = push(ref(rtdb, 'waHistoryCBG'));
      return set(newRef, { ...data, id: newRef.key });
    },
    waCampaignCBG: (data: WACampaignSummary) => {
      const hasId = data.id !== undefined && data.id !== null && data.id !== '';
      const newRef = hasId ? ref(rtdb, `waCampaignsCBG/${data.id}`) : push(ref(rtdb, 'waCampaignsCBG'));
      const id = hasId ? String(data.id) : newRef.key;
      return set(newRef, { ...data, id });
    },
    waBlacklist: (data: WABlacklist) => {
      const hasId = data.id !== undefined && data.id !== null && data.id !== '';
      const newRef = hasId ? ref(rtdb, `waBlacklist/${data.id}`) : push(ref(rtdb, 'waBlacklist'));
      const id = hasId ? String(data.id) : newRef.key;
      return set(newRef, { ...data, id });
    },
    deleteWaBlacklist: (id: string) => set(ref(rtdb, `waBlacklist/${id}`), null),
    deleteWaCampaignCBG: (id: string) => set(ref(rtdb, `waCampaignsCBG/${id}`), null),
    clearWaPersonalData: async () => {
      // ONLY clear setup and current targets for WA PERSONAL (Campaign A)
      await set(ref(rtdb, 'waSetup'), null);
      await set(ref(rtdb, 'waTargets'), null);
    },
    clearWaCbgData: async () => {
      // ONLY clear setup and current targets for WA SDM CABANG (Campaign B)
      await set(ref(rtdb, 'waSetupCBG'), null);
      await set(ref(rtdb, 'waSetupsCBG'), null);
      await set(ref(rtdb, 'waTargetsCBG'), null);
    },
    staffCBG: (data: Staff) => {
      const hasId = data.id !== undefined && data.id !== null && data.id !== '';
      const newRef = hasId ? ref(rtdb, `staffCBG/${data.id}`) : push(ref(rtdb, 'staffCBG'));
      const id = hasId ? String(data.id) : newRef.key;
      return set(newRef, { ...data, id });
    },
    deleteStaffCBG: (id: string) => set(ref(rtdb, `staffCBG/${id}`), null),
    userPermissions: async (data: UserPermission[]) => {
      console.log("Saving UserPermissions:", data);
      try {
        await set(ref(rtdb, 'userPermissions'), data);
        console.log("Save successful");
      } catch (err) {
        console.error("Save failed:", err);
        throw err;
      }
    },
    appDoc: (data: AppDoc) => {
      return set(ref(rtdb, `appDocs/${data.id}`), data);
    },
    bhfUpaya: (data: BHFUpaya) => {
      const hasId = data.id !== undefined && data.id !== null && data.id !== '';
      const newRef = hasId ? ref(rtdb, `bhfUpaya/${data.id}`) : push(ref(rtdb, 'bhfUpaya'));
      const id = hasId ? String(data.id) : newRef.key;
      return set(newRef, { ...data, id }).catch(err => {
        console.error('Error saving BHF Upaya:', err);
        alert('Gagal menyimpan upaya. Cek izin database.');
      });
    },
    deleteBhfUpaya: (id: string) => set(ref(rtdb, `bhfUpaya/${id}`), null),
    bhfIssue: (data: BHFIssue) => {
      console.log('Firebase Save: Attempting to save BHF Issue', data);
      const hasId = data.id !== undefined && data.id !== null && data.id !== '';
      const newRef = hasId ? ref(rtdb, `bhfIssues/${data.id}`) : push(ref(rtdb, 'bhfIssues'));
      const id = hasId ? String(data.id) : newRef.key;
      
      const cleanData = { ...data, id };
      
      return set(newRef, cleanData)
        .then(() => {
          console.log('Firebase Save: BHF Issue saved successfully', id);
        })
        .catch(err => {
          console.error('Firebase Save: BHF Issue failed', err);
          alert('Gagal menyimpan issue ke database: ' + err.message);
          throw err;
        });
    },
    deleteBhfIssue: (id: string) => set(ref(rtdb, `bhfIssues/${id}`), null),
    bhfMember: (data: BHFMember) => {
      // Use the provided ID or generate a new one if missing
      const memberId = data.id || push(ref(rtdb, 'bhfMembers')).key || `mem_${Date.now()}`;
      const memberRef = ref(rtdb, `bhfMembers/${memberId}`);
      
      const cleanData: BHFMember = {
        id: memberId,
        kelompok: data.kelompok,
        nama: data.nama || "Tanpa Nama",
        isLeader: !!data.isLeader,
        timestamp: data.timestamp || new Date().toISOString()
      };
      
      console.log('Saving BHF Member:', cleanData);
      return set(memberRef, cleanData).catch(err => {
        console.error('Error saving BHF Member:', err);
        alert('Gagal menyimpan anggota. Cek izin database.');
      });
    },
    deleteBhfMember: (id: string) => set(ref(rtdb, `bhfMembers/${id}`), null),
    bhfGroups: (groups: string[]) => set(ref(rtdb, 'bhfGroups'), groups),
    testLab: (data: TestLab) => {
      const hasId = data.id !== undefined && data.id !== null && data.id !== '';
      const newRef = hasId ? ref(rtdb, `testLabs/${data.id}`) : push(ref(rtdb, 'testLabs'));
      const id = hasId ? String(data.id) : newRef.key;
      return set(newRef, { ...data, id });
    },
    testLabMany: (data: TestLab[]) => {
      const updates: any = {};
      data.forEach(item => {
        const id = item.id || push(ref(rtdb, 'testLabs')).key;
        updates[id!] = { ...item, id };
      });
      return update(ref(rtdb, 'testLabs'), updates);
    },
    deleteTestLab: (id: string) => set(ref(rtdb, `testLabs/${id}`), null),
    deleteAllTestLab: () => set(ref(rtdb, 'testLabs'), null),
    panel: (data: Panel) => {
      const hasId = data.id !== undefined && data.id !== null && data.id !== '';
      const newRef = hasId ? ref(rtdb, `panels/${data.id}`) : push(ref(rtdb, 'panels'));
      const id = hasId ? String(data.id) : newRef.key;
      return set(newRef, { ...data, id });
    },
    panelMany: (data: Panel[]) => {
      const updates: any = {};
      data.forEach(item => {
        const id = item.id || push(ref(rtdb, 'panels')).key;
        updates[id!] = { ...item, id };
      });
      return update(ref(rtdb, 'panels'), updates);
    },
    deletePanel: (id: string) => set(ref(rtdb, `panels/${id}`), null),
    deleteAllPanel: () => set(ref(rtdb, 'panels'), null),
    wshp: (data: WSHP) => {
      const hasId = data.id !== undefined && data.id !== null && data.id !== '';
      const newRef = hasId ? ref(rtdb, `wshps/${data.id}`) : push(ref(rtdb, 'wshps'));
      const id = hasId ? String(data.id) : newRef.key;
      return set(newRef, { ...data, id }).then(() => {
        console.log("WSHP saved successfully");
      }).catch(err => {
        console.error("WSHP save error:", err);
        alert("Gagal simpan WSHP: " + err.message);
        throw err;
      });
    },
    deleteWshp: (id: string) => set(ref(rtdb, `wshps/${id}`), null),
  }), [user, pccrfmRecords]);

  return {
    kategori,
    promos,
    transaksi,
    driverWicData,
    upayaData,
    upayaCategories,
    targetPerPetugas,
    pccrfmRecords,
    favoriteLinks,
    birthdayRecords,
    calendarActivities,
    waSetup,
    waTargets: filteredWaTargets,
    waHistory: filteredWaHistory,
    waCampaigns,
    waSetupCBG,
    waSetupsCBG,
    waTargetsCBG: filteredWaTargetsCBG,
    waHistoryCBG: filteredWaHistoryCBG,
    waCampaignsCBG,
    waBlacklist,
    staffCBG,
    userPermissions,
    appDocs,
    bhfUpaya,
    bhfIssues,
    bhfMembers,
    bhfGroups,
    testLabs,
    panels,
    wshps,
    userProfile,
    saveData,
    loading,
    refresh
  };
}
