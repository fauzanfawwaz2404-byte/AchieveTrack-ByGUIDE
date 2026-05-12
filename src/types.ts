export interface Kategori {
  nama: string;
  targetRevenue: number;
  targetVisit: number;
  expDate?: string;
  imageUrl?: string;
  mode?: 'Online' | 'Offline' | 'Online & Offline';
}

export interface Promo {
  kategori: string;
  nama: string;
  harga: number;
}

export interface TestLab {
  id: string;
  nama: string;
  harga: number;
}

export interface Panel {
  id: string;
  nama: string;
  harga: number;
  pemeriksaan?: string;
}

export interface Transaksi {
  id: string | number;
  kategori: string;
  promo: string;
  noLab?: string;
  nominal: number;
  petugas: string;
  timestamp: string;
}

export interface WicData {
  tr: number; // target revenue
  tv: number; // target visit
  rr: number; // real revenue
  rv: number; // real visit
}

export interface DriverWicData {
  [category: string]: {
    [month: string]: WicData;
  };
}

export interface UpayaCC {
  id: string;
  category: string;
  wicCategory: string;
  date: string;
  mainInfo: string;
  detail: string;
  file?: string;
  photo?: string;
  timestamp: string;
  qtyWA?: number;
  qtyCetak?: number;
  saranaPromosi?: string;
  jenisCetak?: string;
}

export interface Visit {
  tgl: string;
  lab?: string;
  revenue: number;
  note?: string;
}

export interface CareUpaya {
  tgl: string;
  metode: string;
  ket?: string;
  hasil?: string;
  jumlahWA?: number;
}

export interface Relasi {
  nama: string;
  jk?: string;
  kategori: string;
  idsispro: string;
  jenis?: 'Gold' | 'Silver';
  periksa?: Visit[];
  upaya?: CareUpaya[];
}

export interface TargetPerPetugas {
  [kategori: string]: {
    [petugas: string]: {
      rev: number;
      vis: number;
    };
  };
}

export interface PCCRecord {
  id?: string;
  title: string;
  nama: string;
  idsispro: string;
  notelp: string;
  alamat: string;
  periksa: Visit[];
  relasi: Relasi[];
  upaya: CareUpaya[];
  membership: string;
  jenis: 'Gold' | 'Silver';
  type: 'PCC';
}

export interface RFMRecord {
  id?: string;
  title: string;
  nama: string;
  idsispro: string;
  notelp: string;
  alamat: string;
  periksa: Visit[];
  upaya: CareUpaya[];
  champions: string;
  type: 'RFM';
}

export type PatientRecord = PCCRecord | RFMRecord;

export interface FavoriteLink {
  id: string;
  keterangan: string;
  url: string;
  timestamp: string;
}

export interface BirthdayRecord {
  id: string;
  title: 'Ibu' | 'Bapak';
  idsispro: string;
  nama: string;
  tglLahir: string;
  noTelp: string;
  timestamp: string;
  waStatus?: 'Sudah' | 'Belum';
}

export interface CalendarActivity {
  id: string;
  title: string;
  category: string;
  date: string;
  deadline?: string;
  image?: string; // base64
  doc?: {
    name: string;
    data: string; // base64
  };
  status: string;
  reason?: string;
  createdAt: string;
}

export interface WASetup {
  tema: string;
  template: string;
  image?: string; // base64
  startDate?: string;
  deadline?: string;
  templates?: string[]; // 5 AI variations
  variations?: string[]; // new field for variations
  staffIds?: string[]; // Assigned staff for CBG
  targetPerStaff?: number; // Load per person for distribution
  useAllVariations?: boolean;
  distributeEqually?: boolean;
  cooldownLimit?: number;
  cooldownDuration?: number;
}

export interface WACampaignSummary {
  id: string;
  tema: string;
  setupDate: string;
  startDate: string;
  deadline: string;
  totalTargets: number;
  sentCount: number;
}

export interface WATarget {
  id: string;
  sisproId: string;
  title: string;
  nama: string;
  phone: string;
  status: 'Belum Dikirim' | 'Sudah Dikirim' | 'Tidak Ada WA' | 'BLACKLIST';
  sentAt?: string;
  petugasId?: string; // For CBG assigned staff
  petugasNama?: string;
  messageOverride?: string;
  tema?: string;
}

export interface WABlacklist {
  id: string;
  sisproId: string;
  nama: string;
  phone: string;
  reason: 'PASIEN TIDAK MAU DI WA' | 'PASIEN MENINGGAL' | 'SALAH SAMBUNG' | string;
  blacklistedBy: string;
  timestamp: string;
}

export interface WAHistory {
  id: string;
  sisproId: string;
  nama: string;
  tema: string;
  sentAt: string;
  status?: WATarget['status'];
  petugasId?: string;
  petugasNama?: string;
}

export interface Staff {
  id: string;
  nama: string;
  role: 'PETUGAS_CBG';
}

export interface MenuAccess {
  menuId: string;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface UserPermission {
  email: string;
  name?: string;
  allowedMenus: MenuAccess[];
}

export interface AppDoc {
  id: string;
  content: string;
  lastUpdatedBy?: string;
  lastUpdated: string;
}

export interface BHFUpaya {
  id: string;
  kelompok: string;
  jenisUpaya: string;
  jumlah: number;
  keterangan?: string;
  tanggal: string;
  petugas: string;
  timestamp: string;
  status?: 'PLAN' | 'SELESAI' | 'BATAL';
  alasanBatal?: string;
}

export interface BHFMember {
  id: string;
  kelompok: string;
  nama: string;
  jabatan?: string;
  isLeader?: boolean;
  timestamp: string;
}

export interface BHFIssue {
  id: string;
  tanggal: string;
  kendala: string;
  actionPlan?: string;
  petugas: string;
  timestamp: string;
}

export interface WSHP {
  id: string;
  judul: string;
  nomorDokumen: string;
  file?: {
    name: string;
    data: string; // base64
  };
  timestamp: string;
}
