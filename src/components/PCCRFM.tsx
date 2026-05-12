import React, { useState, useMemo, useEffect } from "react";
import {
  ChartLine,
  UserPlus,
  Crown,
  Gem,
  HeartHandshake,
  BookOpen,
  Trash2,
  Edit,
  Edit3,
  PlusCircle,
  UserMinus,
  History,
  Download,
  Search,
  Filter,
  Info,
  ChevronDown,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
  ExternalLink,
  Calendar,
  Plus,
  Clock,
  Bot,
  Users,
  Hourglass,
  TrendingUp,
  TrendingDown,
  Network,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";

const WhatsAppIcon = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const cleanPhone = (phone: string) => {
  let p = phone.replace(/[^0-9]/g, "");
  if (p.startsWith("0")) p = "62" + p.slice(1);
  return p;
};

const GrowthIndicator = ({ records }: { records: Visit[] }) => {
  if (records.length < 2) return null;
  const sorted = [...records].sort(
    (a, b) => new Date(a.tgl).getTime() - new Date(b.tgl).getTime(),
  );
  const lastRev = sorted[sorted.length - 1].revenue;
  const avgRev =
    sorted.slice(0, -1).reduce((a, b) => a + b.revenue, 0) /
    (sorted.length - 1);

  if (lastRev > avgRev)
    return (
      <TrendingUp
        size={14}
        className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"
      />
    );
  return (
    <TrendingDown
      size={14}
      className="text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]"
    />
  );
};

const PriorityBadge = ({ record }: { record: PatientRecord }) => {
  if (record.type !== "RFM" || (record as RFMRecord).champions !== "Champions")
    return null;

  const lastVisit =
    record.periksa && record.periksa.length > 0
      ? new Date(
          [...record.periksa].sort(
            (a, b) => new Date(b.tgl).getTime() - new Date(a.tgl).getTime(),
          )[0].tgl,
        )
      : null;

  if (!lastVisit) return null;

  const daysSince = Math.floor(
    (new Date().getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysSince > 30) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[8px] font-black uppercase tracking-widest animate-pulse">
        <AlertCircle size={10} /> Prioritas Tinggi
      </div>
    );
  }
  return null;
};
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  PatientRecord,
  PCCRecord,
  RFMRecord,
  Visit,
  Relasi,
  CareUpaya,
} from "../types";

interface PCCRFMProps {
  records: PatientRecord[];
  onSave: (record: PatientRecord) => void;
  onSaveMany: (records: PatientRecord[]) => void;
  onDelete: (id: string) => void;
  onClearAll: (type: "PCC" | "RFM") => void;
  subView: string;
  setSubView: (view: string) => void;
  userEmail?: string | null;
  permissions?: {
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
    isAdmin: boolean;
  };
}

export default function PCCRFM({
  records,
  onSave,
  onSaveMany,
  onDelete,
  onClearAll,
  subView,
  setSubView,
  userEmail,
  permissions,
}: PCCRFMProps) {
  const isAdmin =
    permissions?.isAdmin || userEmail === "fauzanfawwaz2404@gmail.com";
  const canAdd = permissions?.canAdd || isAdmin;
  const canEdit = permissions?.canEdit || isAdmin;
  const canDelete = permissions?.canDelete || isAdmin;
  const [currentCat, setCurrentCat] = useState<"PCC" | "RFM">("PCC");
  const [editingRecord, setEditingRecord] = useState<PatientRecord | null>(
    null,
  );

  // Logic Deduplikasi: Jika ada PCC, RFM dengan ID Sispro & Nama yang sama diabaikan
  const deduplicatedRecords = useMemo(() => {
    const pccKeyMap = new Set<string>();

    // Identifikasi semua kunci PCC (ID Sispro + Nama)
    records
      .filter((r) => r.type === "PCC")
      .forEach((r) => {
        pccKeyMap.add(`${r.idsispro}_${r.nama.toLowerCase().trim()}`);
      });

    const final: PatientRecord[] = [];
    const seenFinalKeys = new Set<string>();

    // Masukkan PCC dulu
    records
      .filter((r) => r.type === "PCC")
      .forEach((r) => {
        const key = `${r.idsispro}_${r.nama.toLowerCase().trim()}`;
        if (!seenFinalKeys.has(key)) {
          final.push(r);
          seenFinalKeys.add(key);
        }
      });

    // Masukkan RFM hanya jika tidak ada padanan di PCC
    records
      .filter((r) => r.type === "RFM")
      .forEach((r) => {
        const key = `${r.idsispro}_${r.nama.toLowerCase().trim()}`;
        if (!pccKeyMap.has(key) && !seenFinalKeys.has(key)) {
          final.push(r);
          seenFinalKeys.add(key);
        }
      });

    return final;
  }, [records]);

  // Fungsi untuk benar-benar menghapus data duplikat di Firebase
  const onCleanupDuplicates = async () => {
    if (!canDelete) {
      alert("🔒 HANYA BACA: Anda tidak memiliki izin untuk menghapus data.");
      return;
    }
    const pccKeyMap = new Set<string>();
    records
      .filter((r) => r.type === "PCC")
      .forEach((r) => {
        pccKeyMap.add(`${r.idsispro}_${r.nama.toLowerCase().trim()}`);
      });

    const duplicates = records.filter((r) => {
      if (r.type !== "RFM") return false;
      const key = `${r.idsispro}_${r.nama.toLowerCase().trim()}`;
      return pccKeyMap.has(key);
    });

    if (duplicates.length === 0) {
      alert("Tidak ada duplikat data RFM yang ditemukan.");
      return;
    }

    if (
      window.confirm(
        `Ditemukan ${duplicates.length} data RFM yang sudah ada di PCC. Hapus sekarang?`,
      )
    ) {
      try {
        for (const d of duplicates) {
          if (d.id) await onDelete(d.id);
        }
        alert(`Berhasil menghapus ${duplicates.length} data duplikat!`);
      } catch (err: any) {
        alert("Gagal menghapus duplikat: " + err.message);
      }
    }
  };

  // Dashboard states
  const [dashDates, setDashDates] = useState({ start: "", end: "" });

  // Table filters
  const [pccFilters, setPccFilters] = useState({
    search: "",
    start: "",
    end: "",
    segment: "",
  });
  const [rfmFilters, setRfmFilters] = useState({
    search: "",
    start: "",
    end: "",
    segment: "",
  });
  const [careSearch, setCareSearch] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Initial Search from URL or props
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get("search");
    if (searchParam) {
      if (subView === "pcc-rfm-data-pcc") {
        setPccFilters((prev) => ({ ...prev, search: searchParam }));
      } else {
        setRfmFilters((prev) => ({ ...prev, search: searchParam }));
      }
      // Clean up URL parameter to avoid re-triggering on refresh
      const u = new URLSearchParams(window.location.search);
      u.delete("search");
      const newUrl = u.toString()
        ? `${window.location.pathname}?${u.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [subView]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [pccFilters, rfmFilters, subView]);

  // Modals
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [selectedMetode, setSelectedMetode] = useState("");

  // Reset selectedMetode whenever upaya modal opens/closes
  useEffect(() => {
    if (activeModal !== "upaya") {
      setSelectedMetode("");
    }
  }, [activeModal]);

  const onSavePeriksa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalData?.record) return;

    const { record, relIdx } = modalData;
    if (!record.id) {
      alert("Error: ID Pasien tidak ditemukan.");
      return;
    }

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const newVisit: Visit = {
      tgl: formData.get("tgl") as string,
      revenue: parseFloat(formData.get("revenue") as string) || 0,
      lab: formData.get("lab") as string,
      note: formData.get("note") as string,
    };

    try {
      if (!canAdd && !canEdit) {
        alert("🔒 HANYA BACA: Anda tidak memiliki izin untuk menyimpan data.");
        return;
      }
      const updatedRecord = JSON.parse(JSON.stringify(record)) as PatientRecord;

      if (relIdx === -1 || relIdx === undefined) {
        updatedRecord.periksa = [...(updatedRecord.periksa || []), newVisit];
      } else {
        const pcc = updatedRecord as PCCRecord;
        if (!pcc.relasi) pcc.relasi = [];
        if (pcc.relasi[relIdx]) {
          pcc.relasi[relIdx].periksa = [
            ...(pcc.relasi[relIdx].periksa || []),
            newVisit,
          ];
        }
      }

      await onSave(updatedRecord);
      setActiveModal(null);
      alert("Data Pemeriksaan Berhasil Disimpan!");
    } catch (error: any) {
      console.error("Save Periksa Error:", error);
      alert("Gagal menyimpan: " + error.message);
    }
  };

  const onSaveRelasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalData) return;

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const { recordId, relIdx } = modalData;

    const record = records.find((r) => r.id === recordId);
    if (!record) {
      alert("Data PCC tidak ditemukan.");
      return;
    }

    if (!canAdd && !canEdit) {
      alert("🔒 HANYA BACA: Anda tidak memiliki izin untuk mengubah relasi.");
      return;
    }

    if (record.type === "PCC") {
      try {
        const updatedRecord = JSON.parse(JSON.stringify(record)) as PCCRecord;
        if (!updatedRecord.relasi) updatedRecord.relasi = [];

        const relData: Relasi = {
          nama: (formData.get("nama") as string) || "",
          idsispro: (formData.get("idsispro") as string) || "",
          kategori: (formData.get("kategori") as string) || "Lainnya",
          jenis: "Silver",
          periksa:
            relIdx !== undefined &&
            relIdx !== -1 &&
            updatedRecord.relasi[relIdx]
              ? updatedRecord.relasi[relIdx].periksa || []
              : [],
        };

        if (relIdx !== undefined && relIdx !== -1) {
          updatedRecord.relasi[relIdx] = relData;
        } else {
          updatedRecord.relasi.push(relData);
        }

        await onSave(updatedRecord);
        setActiveModal(null);
        alert("Data Relasi Berhasil Disimpan!");
      } catch (error: any) {
        console.error("Save Relasi Error:", error);
        alert("Gagal menyimpan: " + error.message);
      }
    }
  };

  const onDeleteRelasi = (parentId: string, relIdx: number) => {
    if (!canDelete) {
      alert("🔒 HANYA BACA: Anda tidak memiliki izin untuk menghapus relasi.");
      return;
    }
    if (!window.confirm("Hapus relasi ini?")) return;
    const record = records.find((r) => r.id === parentId);
    if (record && record.type === "PCC") {
      const updatedRecord = JSON.parse(JSON.stringify(record)) as PCCRecord;
      updatedRecord.relasi.splice(relIdx, 1);
      onSave(updatedRecord);
    }
  };

  const onSaveUpaya = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalData?.record) {
      alert("Error: Data pasien tidak ditemukan.");
      return;
    }

    const { record } = modalData;
    if (!record.id) {
      alert("Error: ID Pasien tidak ditemukan. Gagal memperbarui data.");
      return;
    }

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const dateVal = formData.get("tgl") as string;
    const metodeVal = formData.get("metode") as string;
    const hasilVal = formData.get("hasil") as string;
    const waVal = formData.get("jumlahWA");

    if (!dateVal || !metodeVal || !hasilVal) {
      alert("Harap lengkapi semua field yang wajib diisi.");
      return;
    }

    const newUpaya: CareUpaya = {
      tgl: dateVal,
      metode: metodeVal,
      hasil: hasilVal,
      ...(waVal ? { jumlahWA: parseInt(waVal as string) } : {}),
    };

    try {
      if (!canAdd && !canEdit) {
        alert(
          "🔒 HANYA BACA: Anda tidak memiliki izin untuk menambahkan log pelayanan.",
        );
        return;
      }
      // Deep clone to avoid direct mutation
      const updatedRecord = JSON.parse(JSON.stringify(record)) as PatientRecord;
      updatedRecord.upaya = [...(updatedRecord.upaya || []), newUpaya];

      // Call the parent save function and wait for it
      await onSave(updatedRecord);

      // Clear and close
      setActiveModal(null);
      setSelectedMetode("");
      alert("Log Pelayanan Berhasil Disimpan!");
    } catch (error: any) {
      console.error("Save Upaya Error:", error);
      alert("Gagal menyimpan data: " + error.message);
    }
  };
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num || 0);
  };

  const filterRecords = (periksaArr: Visit[], start: string, end: string) => {
    if (!periksaArr) return [];
    return periksaArr.filter((p) => {
      const pDate = new Date(p.tgl);
      if (start && pDate < new Date(start)) return false;
      if (end && pDate > new Date(end)) return false;
      return true;
    });
  };

  // Dashboard Stats
  const dashboardStats = useMemo(() => {
    const { start, end } = dashDates;
    let pccRev = 0,
      rfmRev = 0,
      pccVisCount = 0,
      rfmVisCount = 0;
    let pccGoldRev = 0,
      pccSilverRev = 0,
      pccGoldVisCount = 0,
      pccSilverVisCount = 0;
    let pccVisited = 0,
      pccNotVisited = 0,
      rfmVisited = 0,
      rfmNotVisited = 0;
    let totalWA = 0;

    // Counter for segments
    let goldCount = 0;
    let silverCount = 0;
    const rfmSegmentCounts: Record<string, number> = {};

    const listVisited: any[] = [];
    const listNotVisited: any[] = [];
    const customersAnalysis: any[] = [];

    const pccVisitDetails: any[] = [];
    const rfmVisitDetails: any[] = [];

    deduplicatedRecords.forEach((r) => {
      // Calculate WA from all upaya
      r.upaya?.forEach((u) => {
        if (u.jumlahWA) totalWA += Number(u.jumlahWA);
      });

      const fInd = filterRecords(r.periksa, start, end);
      const mainRev = fInd.reduce((a, b) => a + Number(b.revenue || 0), 0);
      const mainVis = fInd.length;

      if (r.type === "PCC") {
        const pcc = r as PCCRecord;
        goldCount++; // Every PCC is a Main Gold Patient
        pccGoldRev += mainRev;
        pccGoldVisCount += mainVis;

        // Collect Main PCC Visits
        fInd.forEach((v) => {
          pccVisitDetails.push({
            nama: pcc.nama,
            title: pcc.title,
            kategori: "PCC (GOLD)",
            idsispro: pcc.idsispro,
            ...v,
          });
        });

        let relRevTotal = 0,
          relVisTotal = 0;
        pcc.relasi?.forEach((rel) => {
          silverCount++; // Every relation is a Silver Patient
          const fRel = filterRecords(rel.periksa || [], start, end);
          const currentRelRev = fRel.reduce(
            (a, b) => a + Number(b.revenue || 0),
            0,
          );
          const currentRelVis = fRel.length;

          relRevTotal += currentRelRev;
          relVisTotal += currentRelVis;

          pccSilverRev += currentRelRev;
          pccSilverVisCount += currentRelVis;

          // Collect Relasi Visits
          fRel.forEach((v) => {
            pccVisitDetails.push({
              nama: rel.nama,
              kategori: `RELASI SILVER (${rel.kategori})`,
              idsispro: rel.idsispro,
              parent: pcc.nama,
              ...v,
            });
          });
        });

        const totalRev = mainRev + relRevTotal;
        const totalVis = mainVis + relVisTotal;

        pccRev += totalRev;
        pccVisCount += totalVis;
        if (totalVis > 0) {
          pccVisited++;
          listVisited.push({ nama: r.nama, rev: totalRev, type: r.type });
        } else {
          pccNotVisited++;
          listNotVisited.push({ nama: r.nama, type: r.type });
        }
      } else {
        const rfm = r as RFMRecord;
        const segment = (rfm.champions || "Uncategorized").trim();
        rfmSegmentCounts[segment] = (rfmSegmentCounts[segment] || 0) + 1;

        // Collect RFM Visits
        fInd.forEach((v) => {
          rfmVisitDetails.push({
            nama: rfm.nama,
            title: rfm.title,
            champions: rfm.champions,
            idsispro: rfm.idsispro,
            ...v,
          });
        });

        const totalRev = mainRev;
        rfmRev += totalRev;
        rfmVisCount += mainVis;
        if (mainVis > 0) {
          rfmVisited++;
          listVisited.push({ nama: r.nama, rev: totalRev, type: r.type });
        } else {
          rfmNotVisited++;
          listNotVisited.push({ nama: r.nama, type: r.type });
        }
      }

      customersAnalysis.push({ nama: r.nama, revenue: mainRev });
    });

    const topPerformer =
      [...customersAnalysis].sort((a, b) => b.revenue - a.revenue)[0]?.nama ||
      "-";

    return {
      pccRev,
      rfmRev,
      pccVisCount,
      rfmVisCount,
      pccGoldRev,
      pccSilverRev,
      pccGoldVisCount,
      pccSilverVisCount,
      pccVisited,
      pccNotVisited,
      rfmVisited,
      rfmNotVisited,
      listVisited,
      listNotVisited,
      topPerformer,
      goldCount,
      silverCount,
      rfmSegmentCounts,
      pccVisitDetails: pccVisitDetails.sort(
        (a, b) => new Date(b.tgl).getTime() - new Date(a.tgl).getTime(),
      ),
      rfmVisitDetails: rfmVisitDetails.sort(
        (a, b) => new Date(b.tgl).getTime() - new Date(a.tgl).getTime(),
      ),
      totalRevenue: pccRev + rfmRev,
      totalVisit: pccVisCount + rfmVisCount,
      totalWA,
    };
  }, [deduplicatedRecords, dashDates]);

  // Memoized Filtered List for Table
  const tableData = useMemo(() => {
    const isPCC = subView === "pcc-rfm-data-pcc";
    const f = isPCC ? pccFilters : rfmFilters;

    let list = deduplicatedRecords.filter(
      (r) => r.type === (isPCC ? "PCC" : "RFM"),
    );

    // Segment Filter
    list = list.filter((r) => {
      if (!f.segment) return true;
      if (r.type === "PCC") {
        if (f.segment === "Gold") return (r as PCCRecord).jenis === "Gold";
        if (f.segment === "Silver")
          return ((r as PCCRecord).relasi?.length || 0) > 0;
        return true;
      }
      return ((r as RFMRecord).champions || "").trim() === f.segment;
    });

    // Search Filter
    list = list.filter((r) => {
      if (!f.search) return true;
      const s = f.search.toLowerCase();
      return r.nama.toLowerCase().includes(s) || r.idsispro.includes(s);
    });

    // Date/Visit Filter
    list = list.filter((r) => {
      if (!f.start && !f.end) return true;
      const filteredVisits = filterRecords(r.periksa || [], f.start, f.end);
      let relVisits = 0;
      if (r.type === "PCC") {
        (r as PCCRecord).relasi?.forEach((rel) => {
          relVisits += filterRecords(rel.periksa || [], f.start, f.end).length;
        });
      }
      return filteredVisits.length > 0 || relVisits > 0;
    });

    return list;
  }, [deduplicatedRecords, pccFilters, rfmFilters, subView]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return tableData.slice(start, start + itemsPerPage);
  }, [tableData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(tableData.length / itemsPerPage);

  // Handle Excel Import
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canAdd) {
      alert("🔒 HANYA BACA: Anda tidak memiliki izin untuk mengimpor data.");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const existingPCCKeys = new Set(
        records
          .filter((r) => r.type === "PCC")
          .map((r) => `${r.idsispro}_${r.nama.toLowerCase().trim()}`),
      );

      const newRecords: PatientRecord[] = [];
      rows.forEach((row) => {
        const idsispro = (row["ID SISPRO"] || "").toString().trim();
        const nama = row.NAMA || "";
        const key = `${idsispro}_${nama.toLowerCase().trim()}`;

        if (currentCat === "RFM" && existingPCCKeys.has(key)) return;

        const base = {
          title: row.TITLE || "",
          nama: nama,
          idsispro: idsispro,
          notelp: (row["NO TELP"] || "").toString(),
          alamat: row.ALAMAT || "",
          periksa: [],
          upaya: [],
        };

        if (currentCat === "PCC") {
          newRecords.push({
            ...base,
            type: "PCC",
            membership: row["MEMBERSHIP PCC"] || "",
            jenis: "Gold",
            relasi: [],
          } as PCCRecord);
        } else {
          newRecords.push({
            ...base,
            type: "RFM",
            champions: row.CHAMPIONS || "",
          } as RFMRecord);
        }
      });

      onSaveMany(newRecords);
      alert(`Import Selesai: ${newRecords.length} Data Berhasil Diproses!`);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleManualSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canAdd && !canEdit) {
      alert(
        "🔒 HANYA BACA: Anda tidak memiliki izin untuk menyimpan data pasien.",
      );
      return;
    }
    if (editingRecord && !canEdit) {
      alert("🔒 HANYA BACA: Anda tidak memiliki izin untuk mengubah data.");
      return;
    }
    if (!editingRecord && !canAdd) {
      alert("🔒 HANYA BACA: Anda tidak memiliki izin untuk menambah data.");
      return;
    }
    const formData = new FormData(e.currentTarget);

    const baseData = {
      title: formData.get("title") as string,
      nama: formData.get("nama") as string,
      idsispro: formData.get("idsispro") as string,
      notelp: formData.get("notelp") as string,
      alamat: formData.get("alamat") as string,
      periksa: editingRecord?.periksa || [],
      upaya: editingRecord?.upaya || [],
    };

    let finalData: PatientRecord;
    if (currentCat === "PCC") {
      finalData = {
        ...baseData,
        id: editingRecord?.id,
        type: "PCC",
        membership: formData.get("membership") as string,
        jenis: "Gold",
        relasi: (editingRecord as PCCRecord)?.relasi || [],
      };
    } else {
      finalData = {
        ...baseData,
        id: editingRecord?.id,
        type: "RFM",
        champions: formData.get("champions") as string,
      };
    }

    onSave(finalData);
    e.currentTarget.reset();
    setEditingRecord(null);
    alert("Data Berhasil Disimpan!");
  };

  // PDF Generators
  const generatePDF = (
    type: "PCC" | "RFM" | "ALL",
    filter: { start: string; end: string },
    visitStatus: "ALL" | "VISITED" | "NOT_VISITED" = "ALL",
  ) => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const { start, end } = filter;

    // Header Styling
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 45, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("PRODIA DEPOK", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(156, 163, 175);
    doc.text("ACHIEVETRACK MONITORING SYSTEM", 14, 26);

    // Date Range in Header
    doc.setTextColor(251, 191, 36); // Amber
    doc.setFont("helvetica", "bold");
    const dateRangeText =
      start && end
        ? `${start} s/d ${end}`
        : start
          ? `Dari ${start}`
          : end
            ? `Sampai ${end}`
            : "Semua Periode (All Time)";
    const visitStatusText =
      visitStatus === "VISITED"
        ? "(SUDAH PERIKSA)"
        : visitStatus === "NOT_VISITED"
          ? "(BELUM PERIKSA)"
          : "";
    doc.text(
      `LAPORAN ${type === "ALL" ? "PCC & RFM" : type} ${visitStatusText} | ${dateRangeText}`,
      14,
      34,
    );

    // Stats Box
    let filteredRecords = deduplicatedRecords.filter(
      (r) => type === "ALL" || r.type === type,
    );

    if (visitStatus !== "ALL") {
      filteredRecords = filteredRecords.filter((r) => {
        const fPeriksa = filterRecords(r.periksa || [], start, end);
        let relVisCount = 0;
        if (r.type === "PCC") {
          (r as PCCRecord).relasi?.forEach((rel) => {
            relVisCount += filterRecords(rel.periksa || [], start, end).length;
          });
        }
        const hasVisited = fPeriksa.length > 0 || relVisCount > 0;
        return visitStatus === "VISITED" ? hasVisited : !hasVisited;
      });
    }

    let totalRev = 0;
    let totalVis = 0;

    filteredRecords.forEach((r) => {
      const fPeriksa = filterRecords(r.periksa || [], start, end);
      totalRev += fPeriksa.reduce((a, b) => a + Number(b.revenue), 0);
      totalVis += fPeriksa.length;

      if (r.type === "PCC") {
        (r as PCCRecord).relasi?.forEach((rel) => {
          const fRel = filterRecords(rel.periksa || [], start, end);
          totalRev += fRel.reduce((a, b) => a + Number(b.revenue), 0);
          totalVis += fRel.length;
        });
      }
    });

    // Summary on PDF
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(pageWidth - 85, 12, 70, 22, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("TOTAL REVENUE:", pageWidth - 80, 20);
    doc.setFontSize(12);
    doc.text(formatIDR(totalRev), pageWidth - 80, 28);

    // Table
    const tableData = [];
    filteredRecords.forEach((r) => {
      const fPeriksa = filterRecords(r.periksa || [], start, end);
      const rev = fPeriksa.reduce((a, b) => a + Number(b.revenue), 0);
      const vis = fPeriksa.length;

      let relSum = 0;
      let relCount = 0;
      const labs: string[] = fPeriksa
        .map((p) => p.lab)
        .filter((l): l is string => !!l);

      if (r.type === "PCC") {
        (r as PCCRecord).relasi?.forEach((rel) => {
          const fRel = filterRecords(rel.periksa || [], start, end);
          relSum += fRel.reduce((a, b) => a + Number(b.revenue), 0);
          relCount += fRel.length;
          fRel.forEach((p) => {
            if (p.lab) labs.push(p.lab);
          });
        });
      }

      const uniqueLabs = Array.from(new Set(labs));
      
      let patientDisplayName = `PASIEN UTAMA\n${r.nama}`;
      if (uniqueLabs.length > 0) {
        patientDisplayName += ` (${uniqueLabs.join(", ")})`;
      }

      if (r.type === "PCC") {
        const visitedRel = (r as PCCRecord).relasi?.filter(
          (rel) => filterRecords(rel.periksa || [], start, end).length > 0,
        );
        if (visitedRel && visitedRel.length > 0) {
          patientDisplayName += `\n\nPASIEN RELASI`;
          visitedRel.forEach((rel) => {
            const relVisits = filterRecords(rel.periksa || [], start, end);
            const relLabs = Array.from(new Set(relVisits.map((v) => v.lab).filter((l): l is string => !!l)));
            const relLabStr = relLabs.length > 0 ? ` (${relLabs.join(", ")})` : "";
            patientDisplayName += `\n• ${rel.nama}${relLabStr}`;
          });
        }
      }

      tableData.push([
        patientDisplayName,
        r.notelp,
        r.type,
        r.type === "PCC" ? (r as PCCRecord).jenis : (r as RFMRecord).champions,
        (vis + relCount).toString(),
        formatIDR(rev + relSum),
      ]);
    });

    autoTable(doc, {
      startY: 55,
      head: [
        [
          "NAMA PASIEN",
          "NO TELP",
          "TIPE",
          "STATUS",
          "VISIT",
          "REVENUE",
        ],
      ],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      styles: { fontSize: 8, cellPadding: 3, valign: "middle" },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 80 }, // NAMA PASIEN
        1: { cellWidth: 35 }, // NO TELP
        2: { cellWidth: 15, halign: "center" }, // TIPE
        3: { cellWidth: 20, halign: "center" }, // STATUS
        4: { cellWidth: 15, halign: "center" }, // VISIT
        5: { cellWidth: 25, halign: "right", fontStyle: "bold" }, // REVENUE
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, 14, finalY);
    doc.text(`AchieveTrack Prodia Monitoring System`, pageWidth / 2, finalY, {
      align: "center",
    });

    doc.save(`Laporan_AchieveTrack_${type}_${Date.now()}.pdf`);
    setActiveModal(null);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header (senada dengan app asli) */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-(--text-color) uppercase tracking-tighter italic">
            PRODIA DEPOK
          </h2>
          <p className="text-[10px] font-bold text-(--text-color) opacity-40 tracking-widest mt-1">
            Ringkasan aktivitas PCC & RFM
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={onCleanupDuplicates}
            className="btn btn-sm btn-ghost text-rose-400 hover:bg-rose-500/10 flex flex-col items-center leading-none py-1 h-auto"
          >
            <Trash2 size={14} className="mb-0.5" />
            <span className="text-[7px] font-black tracking-widest uppercase">
              Bersihkan Duplikat
            </span>
          </button>
          <button
            onClick={() => setActiveModal("export-options")}
            className="btn btn-sm btn-outline border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white glass"
          >
            <Download size={14} className="mr-2" /> EXPORT LAPORAN
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {subView === "pcc-rfm-dashboard" && (
          <motion.section
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Dashboard Filter */}
            <div className="glass p-6 rounded-3xl border border-white/5 flex flex-wrap gap-6 items-end">
              <div className="flex-1 min-w-[300px]">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 block">
                  Periode Dashboard
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    className="input input-sm bg-black/40 border-white/5 text-blue-400 font-bold"
                    value={dashDates.start}
                    onChange={(e) =>
                      setDashDates((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }))
                    }
                  />
                  <input
                    type="date"
                    className="input input-sm bg-black/40 border-white/5 text-blue-400 font-bold"
                    value={dashDates.end}
                    onChange={(e) =>
                      setDashDates((prev) => ({ ...prev, end: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-emerald-500/10 px-6 py-3 rounded-2xl border border-emerald-500/20 text-center">
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                    Filtered Revenue
                  </span>
                  <p className="text-xl font-black text-emerald-400">
                    {formatIDR(dashboardStats.totalRevenue)}
                  </p>
                </div>
                <div className="bg-blue-500/10 px-6 py-3 rounded-2xl border border-blue-500/20 text-center">
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                    Filtered Visit
                  </span>
                  <p className="text-xl font-black text-blue-400">
                    {dashboardStats.totalVisit}
                  </p>
                </div>
              </div>
            </div>

            {/* Main Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass p-8 rounded-[2.5rem] border-l-8 border-amber-400 shadow-xl bg-amber-400/[0.02]">
                <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">
                        Revenue PCC (Total)
                      </p>
                      <h2 className="text-4xl font-black text-white italic tracking-tighter">
                        {formatIDR(dashboardStats.pccRev)}
                      </h2>
                      <p className="text-xs text-amber-500 font-bold mt-2 flex items-center gap-2">
                        <Calendar size={12} /> {dashboardStats.pccVisCount}{" "}
                        Total Kunjungan
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                      <div>
                        <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1">
                          GOLD (Main)
                        </p>
                        <p className="text-sm font-black text-white">
                          {formatIDR(dashboardStats.pccGoldRev)}
                        </p>
                        <p className="text-[9px] font-bold text-white/40">
                          {dashboardStats.pccGoldVisCount} Visit
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          SILVER (Relasi)
                        </p>
                        <p className="text-sm font-black text-white">
                          {formatIDR(dashboardStats.pccSilverRev)}
                        </p>
                        <p className="text-[9px] font-bold text-white/40">
                          {dashboardStats.pccSilverVisCount} Visit
                        </p>
                      </div>
                    </div>
                  </div>
                  <Crown size={60} className="text-amber-400/20" />
                </div>
              </div>
              <div className="glass p-8 rounded-[2.5rem] border-l-8 border-blue-500 shadow-xl bg-blue-500/[0.02]">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">
                      Revenue RFM
                    </p>
                    <h2 className="text-4xl font-black text-white italic tracking-tighter">
                      {formatIDR(dashboardStats.rfmRev)}
                    </h2>
                    <p className="text-xs text-blue-500 font-bold mt-2 flex items-center gap-2">
                      <Calendar size={12} /> {dashboardStats.rfmVisCount}{" "}
                      Kunjungan
                    </p>
                  </div>
                  <Gem size={60} className="text-blue-500/20" />
                </div>
              </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                {
                  label: "GOLD (Main)",
                  val: dashboardStats.goldCount,
                  color: "text-amber-400",
                  border: "border-amber-400/30",
                  icon: <Crown size={12} />,
                },
                {
                  label: "SILVER (Relasi)",
                  val: dashboardStats.silverCount,
                  color: "text-slate-400",
                  border: "border-slate-400/30",
                  icon: <Users size={12} />,
                },
                {
                  label: "PCC Visited",
                  val: dashboardStats.pccVisited,
                  color: "text-emerald-400",
                  border: "border-emerald-400/30",
                },
                {
                  label: "PCC Not Visited",
                  val: dashboardStats.pccNotVisited,
                  color: "text-rose-400",
                  border: "border-rose-400/30",
                },
                {
                  label: "RFM Visited",
                  val: dashboardStats.rfmVisited,
                  color: "text-emerald-400",
                  border: "border-emerald-400/30",
                },
                {
                  label: "RFM Not Visited",
                  val: dashboardStats.rfmNotVisited,
                  color: "text-rose-400",
                  border: "border-rose-400/30",
                },
                {
                  label: "Total WA Upaya",
                  val: dashboardStats.totalWA,
                  color: "text-blue-400",
                  border: "border-blue-400/30",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className={`glass p-4 rounded-2xl border-b-4 ${s.border} bg-white/5 flex flex-col justify-between`}
                >
                  <div>
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1 flex items-center gap-1">
                      {s.icon} {s.label}
                    </p>
                    <h4 className={`text-xl font-black ${s.color}`}>{s.val}</h4>
                  </div>
                </div>
              ))}
            </div>

            {/* Segment Analysis Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">
                  Distribusi Segmen RFM
                </p>
                <span className="text-[9px] font-bold text-white/20 italic">
                  {Object.keys(dashboardStats.rfmSegmentCounts).length} Kategori
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar snap-x no-scrollbar-on-mobile">
                {Object.entries(dashboardStats.rfmSegmentCounts)
                  .sort((a, b) => (b[1] as number) - (a[1] as number)) // Sort by count
                  .map(([seg, count], i) => (
                    <div
                      key={i}
                      className="min-w-[140px] flex-shrink-0 glass px-5 py-4 rounded-2xl border border-white/5 bg-blue-500/[0.03] snap-start hover:bg-blue-500/10 transition-colors"
                    >
                      <p
                        className="text-[8px] font-black text-blue-400/60 uppercase tracking-[0.1em] mb-1.5 truncate"
                        title={seg}
                      >
                        {seg}
                      </p>
                      <div className="flex items-end justify-between gap-2">
                        <p className="text-lg font-black text-white italic tracking-tighter leading-none">
                          {count}
                        </p>
                        <span className="text-[9px] font-bold text-white/20 uppercase">
                          Pasien
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Analysis Summary */}
            <div className="glass p-8 rounded-[2.5rem] border border-white/5 shadow-2xl bg-indigo-500/[0.02]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                  <Bot size={22} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white italic tracking-tighter uppercase leading-none">
                    Kesimpulan Analisis Otomatis
                  </h3>
                  <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-1">
                    Intelligence Insight System
                  </p>
                </div>
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                <div className="text-xs text-white/60 leading-relaxed font-bold">
                  {dashDates.start && dashDates.end ? (
                    <div className="space-y-4">
                      <p className="text-amber-400 uppercase italic">
                        Hasil Analisis Periode:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <p className="text-emerald-400 text-[10px] uppercase">
                            ✓ Pelanggan Aktif Teratas
                          </p>
                          {dashboardStats.listVisited
                            .slice(0, 3)
                            .map((v, i) => (
                              <p key={i}>
                                • <span className="text-white">{v.nama}</span> (
                                {v.type}) berkontribusi{" "}
                                <span className="text-emerald-400">
                                  {formatIDR(v.rev)}
                                </span>
                              </p>
                            ))}
                        </div>
                        <div className="space-y-2">
                          <p className="text-rose-400 text-[10px] uppercase">
                            ⚠ Perlu Follow Up Segera
                          </p>
                          {dashboardStats.listNotVisited
                            .slice(0, 3)
                            .map((v, i) => (
                              <p key={i}>
                                • <span className="text-white">{v.nama}</span> (
                                {v.type}) belum berkunjung periode ini.
                              </p>
                            ))}
                        </div>
                      </div>
                      <div className="pt-4 border-t border-white/5">
                        <p>
                          Efektivitas kunjungan periode ini sebesar{" "}
                          <span className="text-blue-400 text-lg ml-2">
                            {(
                              ((dashboardStats.pccVisited +
                                dashboardStats.rfmVisited) /
                                (records.length || 1)) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 flex flex-col items-center gap-2">
                      <Info size={24} className="text-white/20" />
                      <p>
                        Silakan tentukan{" "}
                        <span className="text-blue-400 italic">
                          Periode Dashboard
                        </span>{" "}
                        di atas untuk melihat ringkasan otomatis.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Visitation Tables */}
            <AnimatePresence>
              {dashDates.start && dashDates.end && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="space-y-8"
                >
                  {/* Table PCC */}
                  <div className="glass p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden bg-amber-400/[0.01]">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Crown size={120} className="text-amber-400" />
                    </div>
                    <div className="flex items-center gap-4 mb-6 relative z-10">
                      <div className="w-10 h-10 bg-amber-400/20 rounded-xl flex items-center justify-center border border-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.1)]">
                        <Crown size={22} className="text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white italic tracking-tighter uppercase leading-none">
                          Detail Kunjungan PCC & Relasi
                        </h3>
                        <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-1">
                          Laporan Rinci Kedatangan
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto min-h-[200px]">
                      <table className="table table-xs w-full border-separate border-spacing-y-2">
                        <thead>
                          <tr className="text-white/40 border-none bg-white/[0.02]">
                            <th className="py-4 px-4 uppercase text-[9px] tracking-widest font-black rounded-l-xl">
                              Nama Pasien
                            </th>
                            <th className="py-4 px-4 uppercase text-[9px] tracking-widest font-black">
                              Kategori
                            </th>
                            <th className="py-4 px-4 uppercase text-[9px] tracking-widest font-black">
                              ID Sispro
                            </th>
                            <th className="py-4 px-4 uppercase text-[9px] tracking-widest font-black">
                              Tanggal
                            </th>
                            <th className="py-4 px-4 uppercase text-[9px] tracking-widest font-black text-right">
                              Revenue
                            </th>
                            <th className="py-4 px-4 uppercase text-[9px] tracking-widest font-black rounded-r-xl">
                              Hasil / Catatan
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardStats.pccVisitDetails.length > 0 ? (
                            dashboardStats.pccVisitDetails.map((v, i) => (
                              <tr
                                key={i}
                                className="hover:bg-white/[0.05] transition-all bg-white/[0.01]"
                              >
                                <td className="py-4 px-4 rounded-l-xl">
                                  <div className="font-bold text-white uppercase text-[11px] tracking-tight">
                                    {v.nama}
                                  </div>
                                  {v.parent && (
                                    <div className="text-[8px] text-amber-500/50 uppercase mt-0.5 tracking-tighter">
                                      Penanggung Jawab: {v.parent}
                                    </div>
                                  )}
                                </td>
                                <td className="py-4 px-4">
                                  <span
                                    className={`badge badge-xs font-black px-2 py-1.5 h-auto uppercase tracking-tighter border-none ${v.kategori === "PCC" ? "bg-amber-400 text-black" : "bg-white/10 text-white/50"}`}
                                  >
                                    {v.kategori}
                                  </span>
                                </td>
                                <td className="py-4 px-4 font-mono text-[10px] text-white/50">
                                  {v.idsispro}
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                    <span className="font-bold text-blue-400 text-[10px]">
                                      {v.tgl}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-right font-black text-emerald-400 text-[11px] font-mono whitespace-nowrap">
                                  {formatIDR(v.revenue)}
                                </td>
                                <td className="py-4 px-4 text-[10px] font-bold text-white/40 max-w-xs truncate rounded-r-xl italic">
                                  {v.lab || "-"} | {v.note || "-"}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={6}
                                className="text-center py-12 text-white/20 italic font-black uppercase tracking-widest text-[10px]"
                              >
                                Tidak ada kunjungan di periode ini
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Table RFM */}
                  <div className="glass p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden bg-blue-500/[0.01]">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Gem size={120} className="text-blue-500" />
                    </div>
                    <div className="flex items-center gap-4 mb-6 relative z-10">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                        <Gem size={22} className="text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white italic tracking-tighter uppercase leading-none">
                          Detail Kunjungan RFM
                        </h3>
                        <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-1">
                          Laporan Rinci Kedatangan
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto min-h-[200px]">
                      <table className="table table-xs w-full border-separate border-spacing-y-2">
                        <thead>
                          <tr className="text-white/40 border-none bg-white/[0.02]">
                            <th className="py-4 px-4 uppercase text-[9px] tracking-widest font-black rounded-l-xl">
                              Nama Pasien
                            </th>
                            <th className="py-4 px-4 uppercase text-[9px] tracking-widest font-black">
                              Champions
                            </th>
                            <th className="py-4 px-4 uppercase text-[9px] tracking-widest font-black">
                              ID Sispro
                            </th>
                            <th className="py-4 px-4 uppercase text-[9px] tracking-widest font-black">
                              Tanggal
                            </th>
                            <th className="py-4 px-4 uppercase text-[9px] tracking-widest font-black text-right">
                              Revenue
                            </th>
                            <th className="py-4 px-4 uppercase text-[9px] tracking-widest font-black rounded-r-xl">
                              Hasil / Catatan
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardStats.rfmVisitDetails.length > 0 ? (
                            dashboardStats.rfmVisitDetails.map((v, i) => (
                              <tr
                                key={i}
                                className="hover:bg-white/[0.05] transition-all bg-white/[0.01]"
                              >
                                <td className="py-4 px-4 rounded-l-xl">
                                  <div className="font-bold text-white uppercase text-[11px] tracking-tight">
                                    {v.nama}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <span className="badge badge-xs bg-blue-600 text-white border-none font-black px-3 py-2 h-auto uppercase tracking-tighter">
                                    {v.champions}
                                  </span>
                                </td>
                                <td className="py-4 px-4 font-mono text-[10px] text-white/50">
                                  {v.idsispro}
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]"></div>
                                    <span className="font-bold text-pink-400 text-[10px]">
                                      {v.tgl}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-right font-black text-emerald-400 text-[11px] font-mono whitespace-nowrap">
                                  {formatIDR(v.revenue)}
                                </td>
                                <td className="py-4 px-4 text-[10px] font-bold text-white/40 max-w-xs truncate rounded-r-xl italic">
                                  {v.lab || "-"} | {v.note || "-"}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={6}
                                className="text-center py-12 text-white/20 italic font-black uppercase tracking-widest text-[10px]"
                              >
                                Tidak ada kunjungan di periode ini
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}

        {subView === "pcc-rfm-input" && (
          <motion.section
            key="input"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto"
          >
            <div className="glass rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
              <div className="p-6 bg-[#161d2f] border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex p-1.5 bg-black/40 rounded-2xl gap-1.5 border border-white/5 shadow-inner">
                  <button
                    onClick={() => setCurrentCat("PCC")}
                    className={`px-10 py-3 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 ${currentCat === "PCC" ? "bg-amber-400 text-[#0f172a] shadow-lg shadow-amber-400/30" : "text-white/30 hover:text-white hover:bg-white/5"}`}
                  >
                    Data PCC
                  </button>
                  <button
                    onClick={() => setCurrentCat("RFM")}
                    className={`px-10 py-3 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 ${currentCat === "RFM" ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-white/30 hover:text-white hover:bg-white/5"}`}
                  >
                    Data RFM
                  </button>
                </div>
                {canAdd && (
                  <div>
                    <input
                      type="file"
                      id="import-excel"
                      className="hidden"
                      accept=".xlsx, .xls"
                      onChange={handleExcelImport}
                    />
                    <button
                      onClick={() =>
                        document.getElementById("import-excel")?.click()
                      }
                      className="btn btn-emerald glass btn-sm font-black italic tracking-tighter"
                    >
                      <FileSpreadsheet size={16} className="mr-2" /> Import
                      Excel {currentCat}
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleManualSave} className="p-8 space-y-8">
                <div className="flex flex-col gap-6">
                  {/* Row 1: Title & Name */}
                  <div className="form-control">
                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest px-1 mb-2">
                      Nama Lengkap Pasien
                    </label>
                    <input
                      name="nama"
                      type="text"
                      className="input bg-black/40 border-white/10 text-white font-bold h-12 rounded-2xl focus:border-blue-500/50 w-full"
                      placeholder="Input Nama..."
                      defaultValue={editingRecord?.nama}
                      required
                    />
                  </div>

                  {/* Row 2: ID, WA, Category */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="form-control">
                      <label className="text-[10px] font-black uppercase text-white/40 tracking-widest px-1 mb-2">
                        ID SISPRO
                      </label>
                      <input
                        name="idsispro"
                        type="text"
                        className="input bg-black/40 border-white/10 text-white font-mono h-12 rounded-2xl focus:border-blue-500/50 w-full"
                        placeholder="Contoh: 12345"
                        defaultValue={editingRecord?.idsispro}
                        required
                      />
                    </div>
                    <div className="form-control">
                      <label className="text-[10px] font-black uppercase text-white/40 tracking-widest px-1 mb-2">
                        WhatsApp / No Telp
                      </label>
                      <input
                        name="notelp"
                        type="tel"
                        className="input bg-black/40 border-white/10 text-emerald-400 font-bold h-12 rounded-2xl focus:border-blue-500/50 w-full"
                        placeholder="08xxxxxxxx"
                        defaultValue={editingRecord?.notelp}
                        required
                      />
                    </div>

                    {currentCat === "PCC" ? (
                      <div className="form-control">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest px-1 mb-2">
                          Tier PCC (Otomatis)
                        </label>
                        <div className="h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center px-4">
                          <Crown size={14} className="text-amber-500 mr-2" />
                          <span className="text-amber-500 font-black italic uppercase text-sm">
                            GOLD (Pasien Utama)
                          </span>
                        </div>
                        <input type="hidden" name="jenis" value="Gold" />
                      </div>
                    ) : (
                      <div className="form-control">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest px-1 mb-2">
                          Champions Status (RFM)
                        </label>
                        <input
                          name="champions"
                          type="text"
                          className="input bg-black/40 border-white/10 text-blue-400 font-bold h-12 rounded-2xl focus:border-blue-500/50 w-full"
                          placeholder="Status Champions..."
                          defaultValue={(editingRecord as RFMRecord)?.champions}
                        />
                      </div>
                    )}
                  </div>

                  {/* Row 3: Membership (Conditional) & Address */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {currentCat === "PCC" && (
                      <div className="form-control md:col-span-1">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest px-1 mb-2">
                          No Membership
                        </label>
                        <input
                          name="membership"
                          type="text"
                          className="input bg-black/40 border-white/10 text-white font-bold h-12 rounded-2xl focus:border-blue-500/50 w-full"
                          placeholder="No Member..."
                          defaultValue={
                            (editingRecord as PCCRecord)?.membership
                          }
                        />
                      </div>
                    )}
                    <div
                      className={`form-control ${currentCat === "PCC" ? "md:col-span-3" : "md:col-span-4"}`}
                    >
                      <label className="text-[10px] font-black uppercase text-white/40 tracking-widest px-1 mb-2">
                        Alamat Lengkap
                      </label>
                      <textarea
                        name="alamat"
                        className="textarea bg-black/40 border-white/10 text-white font-medium min-h-[100px] rounded-2xl focus:border-blue-500/50 w-full"
                        placeholder="Input Alamat Lengkap..."
                        defaultValue={editingRecord?.alamat}
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-6">
                  <button
                    type="submit"
                    disabled={!canAdd && !canEdit}
                    className={`w-full max-w-md py-4 rounded-2xl font-black italic tracking-widest uppercase h-14 shadow-2xl transition-all ${!canAdd && !canEdit ? "opacity-50 cursor-not-allowed" : ""} ${currentCat === "PCC" ? "bg-amber-400 text-[#0f172a] shadow-amber-500/20" : "bg-blue-500 text-white shadow-blue-500/20"}`}
                  >
                    {editingRecord
                      ? `PERBARUI DATA ${currentCat}`
                      : `SIMPAN DATA ${currentCat} BARU`}
                  </button>
                </div>
              </form>
            </div>
          </motion.section>
        )}

        {(subView === "pcc-rfm-data-pcc" || subView === "pcc-rfm-data-rfm") && (
          <motion.section
            key={subView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Dynamic Filter Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass p-4 border-l-4 border-amber-400 bg-white/5">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                  Filtered Revenue{" "}
                  {subView === "pcc-rfm-data-pcc" ? "PCC" : "RFM"}
                </p>
                <h3 className="text-xl font-black text-white italic tracking-tighter">
                  {(() => {
                    const f =
                      subView === "pcc-rfm-data-pcc" ? pccFilters : rfmFilters;
                    const filtered = records.filter(
                      (r) =>
                        r.type ===
                        (subView === "pcc-rfm-data-pcc" ? "PCC" : "RFM"),
                    );
                    return formatIDR(
                      filtered.reduce((acc, r) => {
                        const fInd = filterRecords(
                          r.periksa || [],
                          f.start,
                          f.end,
                        );
                        let relRev = 0;
                        if (r.type === "PCC") {
                          (r as PCCRecord).relasi?.forEach((rel) => {
                            relRev += filterRecords(
                              rel.periksa || [],
                              f.start,
                              f.end,
                            ).reduce((a, b) => a + b.revenue, 0);
                          });
                        }
                        return (
                          acc + fInd.reduce((a, b) => a + b.revenue, 0) + relRev
                        );
                      }, 0),
                    );
                  })()}
                </h3>
              </div>
              <div className="glass p-4 border-l-4 border-blue-400 bg-white/5">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                  Filtered Visit{" "}
                  {subView === "pcc-rfm-data-pcc" ? "PCC" : "RFM"}
                </p>
                <h3 className="text-xl font-black text-white italic tracking-tighter">
                  {(() => {
                    const f =
                      subView === "pcc-rfm-data-pcc" ? pccFilters : rfmFilters;
                    const filtered = records.filter(
                      (r) =>
                        r.type ===
                        (subView === "pcc-rfm-data-pcc" ? "PCC" : "RFM"),
                    );
                    return filtered.reduce((acc, r) => {
                      const fInd = filterRecords(
                        r.periksa || [],
                        f.start,
                        f.end,
                      );
                      let relVis = 0;
                      if (r.type === "PCC") {
                        (r as PCCRecord).relasi?.forEach((rel) => {
                          relVis += filterRecords(
                            rel.periksa || [],
                            f.start,
                            f.end,
                          ).length;
                        });
                      }
                      return acc + fInd.length + relVis;
                    }, 0);
                  })()}
                </h3>
              </div>
            </div>

            <div className="glass p-8 rounded-[2rem] border border-white/10 shadow-xl">
              <div className="flex flex-wrap gap-4 mb-6 items-end border-b border-white/5 pb-6">
                <div className="w-full md:w-64">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block">
                    Cari Pasien
                  </label>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                      size={14}
                    />
                    <input
                      type="text"
                      className="input input-sm bg-black/40 border-white/5 w-full pl-10 text-white font-bold h-10 rounded-xl"
                      placeholder="Nama atau ID..."
                      value={
                        subView === "pcc-rfm-data-pcc"
                          ? pccFilters.search
                          : rfmFilters.search
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (subView === "pcc-rfm-data-pcc")
                          setPccFilters((p) => ({ ...p, search: val }));
                        else setRfmFilters((p) => ({ ...p, search: val }));
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex gap-2">
                    <div className="w-32">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block">
                        Dari
                      </label>
                      <input
                        type="date"
                        className="input input-sm bg-black/40 border-white/5 w-full text-blue-400 font-bold h-10 rounded-xl"
                        value={
                          subView === "pcc-rfm-data-pcc"
                            ? pccFilters.start
                            : rfmFilters.start
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (subView === "pcc-rfm-data-pcc")
                            setPccFilters((p) => ({ ...p, start: val }));
                          else setRfmFilters((p) => ({ ...p, start: val }));
                        }}
                      />
                    </div>
                    <div className="w-32">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block">
                        Sampai
                      </label>
                      <input
                        type="date"
                        className="input input-sm bg-black/40 border-white/5 w-full text-blue-400 font-bold h-10 rounded-xl"
                        value={
                          subView === "pcc-rfm-data-pcc"
                            ? pccFilters.end
                            : rfmFilters.end
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (subView === "pcc-rfm-data-pcc")
                            setPccFilters((p) => ({ ...p, end: val }));
                          else setRfmFilters((p) => ({ ...p, end: val }));
                        }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (subView === "pcc-rfm-data-pcc")
                        setPccFilters((p) => ({ ...p, start: "", end: "" }));
                      else setRfmFilters((p) => ({ ...p, start: "", end: "" }));
                    }}
                    className="text-[9px] font-black text-rose-400 mt-1 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1"
                  >
                    <Clock size={10} /> Reset Periode
                  </button>
                </div>
                <div className="ml-auto flex gap-3">
                  {canDelete && (
                    <>
                      <button
                        onClick={onCleanupDuplicates}
                        className="btn btn-xs btn-outline border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-black glass rounded-lg"
                      >
                        <Bot size={12} className="mr-1" /> Bersihkan Duplikat
                      </button>
                      <button
                        onClick={() =>
                          onClearAll(
                            subView === "pcc-rfm-data-pcc" ? "PCC" : "RFM",
                          )
                        }
                        className="btn btn-xs btn-outline border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white glass rounded-lg"
                      >
                        <Trash2 size={12} className="mr-1" /> Hapus Semua{" "}
                        {subView === "pcc-rfm-data-pcc" ? "PCC" : "RFM"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Segment Quick Filters */}
              <div className="flex gap-4 mb-8 overflow-x-auto pb-4 custom-scrollbar snap-x no-scrollbar-on-mobile whitespace-nowrap">
                {(() => {
                  if (subView === "pcc-rfm-data-pcc") {
                    return ["Total PCC", "Jumlah Relasi"].map((seg) => {
                      const isActive =
                        seg === "Total PCC"
                          ? pccFilters.segment === ""
                          : pccFilters.segment === "Silver";
                      let count = 0;
                      if (seg === "Total PCC") {
                        count = deduplicatedRecords.filter(
                          (r) => r.type === "PCC",
                        ).length;
                      } else {
                        count = deduplicatedRecords.reduce((acc, r) => {
                          if (r.type !== "PCC") return acc;
                          const pcc = r as PCCRecord;
                          return acc + (pcc.relasi?.length || 0);
                        }, 0);
                      }

                      return (
                        <button
                          key={seg}
                          onClick={() =>
                            setPccFilters((prev) => ({
                              ...prev,
                              segment: seg === "Total PCC" ? "" : "Silver",
                            }))
                          }
                          className={`min-w-[140px] flex-shrink-0 p-4 rounded-2xl border transition-all relative overflow-hidden group snap-start ${
                            isActive
                              ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20 scale-[1.02]"
                              : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="relative z-10 flex flex-col items-start">
                            <span
                              className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isActive ? "text-blue-100" : "text-white/20"}`}
                            >
                              {seg.includes("PCC") ? "Master" : "Sub"}
                            </span>
                            <span className="text-sm font-black tracking-tight uppercase leading-none font-display">
                              {seg}
                            </span>
                            <div
                              className={`mt-3 py-0.5 px-2 rounded-lg text-[9px] font-black ${isActive ? "bg-white/20 text-white" : "bg-white/10 text-white/50"}`}
                            >
                              {count}{" "}
                              {seg.includes("Relasi") ? "Relasi" : "PCC"}
                            </div>
                          </div>
                          {isActive && (
                            <div className="absolute top-0 right-0 p-2 opacity-20">
                              <Crown size={32} />
                            </div>
                          )}
                        </button>
                      );
                    });
                  } else {
                    // RFM Grouping Logic
                    const rawSegments = records
                      .filter((r) => r.type === "RFM")
                      .map((r) =>
                        ((r as RFMRecord).champions || "Uncategorized").trim(),
                      );

                    const uniqueSegments = Array.from(
                      new Set(rawSegments),
                    ).sort();

                    return ["Semua", ...uniqueSegments].map((seg) => {
                      const isActive =
                        seg === "Semua"
                          ? rfmFilters.segment === ""
                          : rfmFilters.segment === seg;
                      const count = deduplicatedRecords.filter((r) => {
                        if (r.type !== "RFM") return false;
                        if (seg === "Semua") return true;
                        return (
                          ((r as RFMRecord).champions || "").trim() === seg
                        );
                      }).length;

                      return (
                        <button
                          key={seg}
                          onClick={() =>
                            setRfmFilters((prev) => ({
                              ...prev,
                              segment: seg === "Semua" ? "" : seg,
                            }))
                          }
                          className={`min-w-[140px] flex-shrink-0 p-4 rounded-2xl border transition-all relative overflow-hidden group snap-start ${
                            isActive
                              ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/10 scale-[1.02]"
                              : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="relative z-10 flex flex-col items-start translate-x-0 group-hover:translate-x-1 transition-transform">
                            <span
                              className={`text-[8px] font-black uppercase tracking-[0.2em] mb-1 ${isActive ? "text-blue-100" : "text-white/10"}`}
                            >
                              Segmen
                            </span>
                            <span
                              className={`text-[11px] font-black tracking-tight uppercase leading-none font-display truncate w-full text-left ${isActive ? "text-white" : "text-blue-400"}`}
                            >
                              {seg}
                            </span>
                            <div
                              className={`mt-3 py-0.5 px-2 rounded-lg text-[9px] font-black ${isActive ? "bg-white/20 text-white" : "bg-white/10 text-white/50"}`}
                            >
                              {count} RFM
                            </div>
                          </div>
                          {isActive && (
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                              <Gem size={24} />
                            </div>
                          )}
                        </button>
                      );
                    });
                  }
                })()}
              </div>

              <div className="table-container max-h-[600px] overflow-y-auto custom-scrollbar">
                <table className="table table-xs w-full table-fixed border-separate border-spacing-y-2">
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-gradient-to-r from-blue-900 to-slate-900 border-y border-blue-400/30 shadow-[0_0_15px_rgba(59,130,246,0.3)] backdrop-blur-xl">
                      <th className="p-6 w-[35%] text-left rounded-l-2xl">
                        <span className="flex items-center gap-2 text-blue-400 font-bold tracking-[0.2em] uppercase text-[10px] font-display">
                          <Users size={14} className="animate-pulse" />
                          Pasien & Relasi
                        </span>
                      </th>
                      <th className="p-6 w-[18%] text-left text-(--text-color) opacity-70 font-bold tracking-[0.2em] uppercase text-[10px] border-l border-white/5 font-display">
                        ID SISPRO
                      </th>
                      <th className="p-6 w-[22%] text-left text-(--text-color) opacity-70 font-bold tracking-[0.2em] uppercase text-[10px] border-l border-white/5 font-display">
                        Kontak & Lokasi
                      </th>
                      <th className="p-6 w-[17%] text-left text-(--text-color) opacity-70 font-bold tracking-[0.2em] uppercase text-[10px] border-l border-white/5 font-display">
                        Pencapaian
                      </th>
                      <th className="p-6 w-[8%] text-right rounded-r-2xl text-blue-400 font-bold tracking-[0.2em] uppercase text-[10px] border-l border-white/5 font-display">
                        Opsi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((r, idx) => {
                      const f =
                        subView === "pcc-rfm-data-pcc"
                          ? pccFilters
                          : rfmFilters;
                      const initials = r.nama
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();

                      // Calculate revenue based on date filter
                      const filteredPeriksa = filterRecords(
                        r.periksa || [],
                        f.start,
                        f.end,
                      );
                      const relasiRev =
                        r.type === "PCC"
                          ? (r as PCCRecord).relasi?.reduce((acc, rel) => {
                              return (
                                acc +
                                filterRecords(
                                  rel.periksa || [],
                                  f.start,
                                  f.end,
                                ).reduce(
                                  (sum, visit) => sum + (visit.revenue || 0),
                                  0,
                                )
                              );
                            }, 0) || 0
                          : 0;

                      const indivRev = filteredPeriksa.reduce(
                        (sum, v) => sum + (Number(v.revenue) || 0),
                        0,
                      );
                      const totalRev = indivRev + relasiRev;
                      const isTargetMet = totalRev > 5000000;

                      return (
                        <tr
                          key={r.id || idx}
                          className={`bg-white/[0.02] hover:bg-white/[0.07] transition-all duration-500 border-b border-white/5 hover:border-l-4 hover:border-l-blue-500 group ${isTargetMet ? "shadow-[0_0_20px_rgba(251,191,36,0.1)] border-amber-500/20" : ""}`}
                        >
                          <td className="p-6">
                            <div className="flex gap-4">
                              <div
                                className={`relative w-12 h-12 rounded-full flex items-center justify-center border text-white font-display font-black text-sm shadow-inner group-hover:scale-110 transition-transform ${isTargetMet ? "bg-gradient-to-br from-amber-400 to-amber-600 border-amber-300" : "bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-white/10"}`}
                              >
                                {initials}
                                {isTargetMet && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center border-2 border-[#0f172a] shadow-lg animate-pulse">
                                    <Crown size={8} className="text-black" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-1.5 flex-1">
                                <div className="flex items-center gap-2">
                                  <div
                                    onClick={() => {
                                      setActiveModal("history");
                                      setModalData({ record: r });
                                    }}
                                    className="text-xl font-black text-(--text-color) tracking-tight leading-none font-display cursor-pointer hover:text-blue-500 transition-colors flex items-center flex-wrap gap-2"
                                  >
                                    <span>{r.nama}</span>
                                    {(() => {
                                      const f =
                                        subView === "pcc-rfm-data-pcc"
                                          ? pccFilters
                                          : rfmFilters;
                                      const lArr = Array.from(
                                        new Set(
                                          filterRecords(
                                            r.periksa || [],
                                            f.start,
                                            f.end,
                                          )
                                            .map((p) => p.lab)
                                            .filter(Boolean),
                                        ),
                                      );
                                      return lArr.length > 0 ? (
                                        <span className="text-[10px] font-bold text-blue-400 italic">
                                          ({lArr.join(", ")})
                                        </span>
                                      ) : null;
                                    })()}
                                  </div>
                                  {r.type === "PCC" &&
                                    (r as PCCRecord).relasi?.length > 0 && (
                                      <div
                                        className="tooltip tooltip-right"
                                        data-tip={`${(r as PCCRecord).relasi.length} Jaringan Relasi`}
                                      >
                                        <Network
                                          size={14}
                                          className="text-blue-400 animate-pulse"
                                        />
                                      </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="badge badge-sm bg-blue-500/10 text-blue-400 border border-blue-500/20 font-display font-black text-[9px] uppercase tracking-widest px-2">
                                    {(() => {
                                      const f =
                                        subView === "pcc-rfm-data-pcc"
                                          ? pccFilters
                                          : rfmFilters;
                                      return filterRecords(
                                        r.periksa || [],
                                        f.start,
                                        f.end,
                                      ).length;
                                    })()}{" "}
                                    Visit
                                  </span>
                                  {canAdd && (
                                    <button
                                      onClick={() => {
                                        setActiveModal("periksa");
                                        setModalData({
                                          record: r,
                                          type: r.type,
                                          relIdx: -1,
                                        });
                                      }}
                                      className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2 hover:text-white transition-all transform hover:scale-105 active:scale-95"
                                    >
                                      <PlusCircle
                                        size={14}
                                        className="text-emerald-500/50 group-hover:text-emerald-400"
                                      />{" "}
                                      PERIKSA
                                    </button>
                                  )}
                                </div>
                                {/* Relasi list here (conditionally for PCC) */}
                                {r.type === "PCC" &&
                                  (r as PCCRecord).relasi?.map(
                                    (rel, relIdx) => (
                                      <div
                                        key={relIdx}
                                        className="mt-3 p-4 bg-black/40 rounded-[1.5rem] border border-white/5 glass shadow-xl hover:bg-black/60 transition-colors"
                                      >
                                        <div className="flex justify-between items-center mb-2">
                                          <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">
                                                {rel.kategori}
                                              </span>
                                              <span className="badge badge-[8px] h-3 px-1.5 bg-slate-500/20 text-slate-400 border-none font-black text-[6px] tracking-widest">
                                                SILVER
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span 
                                                className="text-xs font-black text-white font-display uppercase tracking-tight cursor-pointer hover:text-blue-400 transition-colors underline decoration-blue-500/30 decoration-dashed underline-offset-4"
                                                onClick={() => {
                                                  setActiveModal("relasi-detail");
                                                  setModalData({ 
                                                    nama: rel.nama,
                                                    idsispro: rel.idsispro,
                                                    kategori: rel.kategori,
                                                    periksa: rel.periksa || [],
                                                    parent: r.nama
                                                  });
                                                }}
                                              >
                                                {rel.nama}
                                              </span>
                                              {(() => {
                                                const f =
                                                  subView === "pcc-rfm-data-pcc"
                                                    ? pccFilters
                                                    : rfmFilters;
                                                const lArr = Array.from(
                                                  new Set(
                                                    filterRecords(
                                                      rel.periksa || [],
                                                      f.start,
                                                      f.end,
                                                    )
                                                      .map((p) => p.lab)
                                                      .filter(Boolean),
                                                  ),
                                                );
                                                return lArr.length > 0 ? (
                                                  <span className="text-[8px] font-bold text-blue-400 opacity-60">
                                                    ({lArr.join(", ")})
                                                  </span>
                                                ) : null;
                                              })()}
                                            </div>
                                          </div>
                                          <div className="flex flex-col items-end">
                                            <span className="text-emerald-400 font-display font-black text-sm tracking-tighter">
                                              {(() => {
                                                const f =
                                                  subView === "pcc-rfm-data-pcc"
                                                    ? pccFilters
                                                    : rfmFilters;
                                                return formatIDR(
                                                  filterRecords(
                                                    rel.periksa || [],
                                                    f.start,
                                                    f.end,
                                                  ).reduce(
                                                    (a, b) => a + b.revenue,
                                                    0,
                                                  ),
                                                );
                                              })()}
                                            </span>
                                            <div className="flex gap-4 items-center mt-2">
                                              {canAdd && (
                                                <button
                                                  onClick={() => {
                                                    setActiveModal("periksa");
                                                    setModalData({
                                                      record: r,
                                                      type: r.type,
                                                      relIdx: relIdx,
                                                    });
                                                  }}
                                                  className="text-[9px] font-black text-emerald-500/50 uppercase tracking-widest flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
                                                >
                                                  <PlusCircle size={12} />{" "}
                                                  <span className="mt-0.5">
                                                    + PERIKSA
                                                  </span>
                                                </button>
                                              )}
                                              {canEdit && (
                                                <button
                                                  onClick={() => {
                                                    setActiveModal("relasi");
                                                    setModalData({
                                                      recordId: r.id,
                                                      relIdx: relIdx,
                                                      existing: rel,
                                                    });
                                                  }}
                                                  className="text-[9px] font-black text-amber-500/50 uppercase tracking-widest flex items-center gap-1.5 hover:text-amber-400 transition-colors"
                                                >
                                                  <Edit size={12} />{" "}
                                                  <span className="mt-0.5">
                                                    EDIT
                                                  </span>
                                                </button>
                                              )}
                                              {canDelete && (
                                                <button
                                                  onClick={() =>
                                                    onDeleteRelasi(
                                                      r.id!,
                                                      relIdx,
                                                    )
                                                  }
                                                  className="text-[9px] font-black text-rose-500/50 uppercase tracking-widest flex items-center gap-1.5 hover:text-rose-400 transition-colors"
                                                >
                                                  <Trash2 size={12} />{" "}
                                                  <span className="mt-0.5">
                                                    HAPUS
                                                  </span>
                                                </button>
                                              )}
                                              <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
                                                {(() => {
                                                  const f =
                                                    subView ===
                                                    "pcc-rfm-data-pcc"
                                                      ? pccFilters
                                                      : rfmFilters;
                                                  return filterRecords(
                                                    rel.periksa || [],
                                                    f.start,
                                                    f.end,
                                                  ).length;
                                                })()}{" "}
                                                VISIT
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ),
                                  )}
                              </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="flex flex-col gap-2">
                              <div>
                                <p className="font-display font-black text-white tracking-widest text-base uppercase">
                                  {r.idsispro}
                                </p>
                              </div>
                              <div className="mt-2 pt-2 border-t border-white/5">
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">
                                  MEMBERSHIP
                                </p>
                                {r.type === "PCC" && (
                                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-tight">
                                    {(r as PCCRecord).membership || "-"}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="flex flex-col gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                                  <Users size={12} className="text-white/30" />
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <p className="text-[11px] font-black text-(--text-color) opacity-80">
                                      {r.notelp}
                                    </p>
                                    <a
                                      href={`https://wa.me/${cleanPhone(r.notelp)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white hover:scale-125 transition-transform shadow-lg shadow-emerald-500/20"
                                    >
                                      <WhatsAppIcon size={12} />
                                    </a>
                                  </div>
                                  <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                                    WA / TELP
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center border border-black/5 dark:border-white/5 mt-1">
                                  <FileSpreadsheet
                                    size={12}
                                    className="text-(--text-color) opacity-30"
                                  />
                                </div>
                                <div className="flex-1">
                                  <p className="text-[10px] font-medium text-(--text-color) opacity-50 leading-relaxed italic line-clamp-2">
                                    {r.alamat}
                                  </p>
                                  <span className="text-[8px] font-bold text-(--text-color) opacity-20 uppercase tracking-widest mt-1 block tracking-[0.2em]">
                                    ALAMAT DOMISILI
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="flex flex-col gap-3">
                              <div
                                className={`p-3 rounded-2xl border flex flex-col min-w-[max-content] ${isTargetMet ? "bg-amber-400/5 border-amber-400/20" : "bg-emerald-500/5 border-emerald-500/10"}`}
                              >
                                <p
                                  className={`text-[8px] font-black uppercase tracking-[0.3em] mb-1 ${isTargetMet ? "text-amber-500/60" : "text-emerald-500/40"}`}
                                >
                                  TOTAL REVENUE (NET)
                                </p>
                                <div className="flex items-center justify-between gap-3">
                                  <span
                                    className={`${isTargetMet ? "text-amber-400" : "text-emerald-400"} font-display font-black text-lg tracking-tighter drop-shadow-2xl whitespace-nowrap`}
                                  >
                                    {formatIDR(totalRev)}
                                  </span>
                                  <GrowthIndicator records={r.periksa || []} />
                                </div>
                                {r.type === "PCC" && (
                                  <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5 px-1">
                                    <div className="flex justify-between items-center text-[9px]">
                                      <span className="font-bold text-white/40 uppercase tracking-tighter">
                                        GOLD (INDIVIDU)
                                      </span>
                                      <span className="font-black text-amber-400 font-mono tracking-tighter">
                                        {formatIDR(indivRev)}
                                      </span>
                                    </div>
                                    {(r as PCCRecord).relasi?.length > 0 && (
                                      <div className="flex justify-between items-center text-[9px]">
                                        <span className="font-bold text-white/40 uppercase tracking-tighter">
                                          SILVER (RELASI)
                                        </span>
                                        <span className="font-black text-blue-400 font-mono tracking-tighter">
                                          {formatIDR(relasiRev)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {r.type === "PCC" ? (
                                  <>
                                    <span className="badge badge-sm h-auto py-1 bg-amber-400 text-black border-none font-black uppercase text-[9px] px-2 tracking-widest shadow-lg shadow-amber-400/10 whitespace-nowrap">
                                      PCC
                                    </span>
                                    <span className="badge badge-sm h-auto py-1 bg-amber-500/20 text-amber-500 border border-amber-500/30 font-black uppercase text-[9px] px-2 tracking-widest whitespace-nowrap">
                                      GOLD
                                    </span>
                                  </>
                                ) : (
                                  <span className="badge badge-sm h-auto py-1 bg-blue-500 text-white border-none font-black uppercase text-[9px] px-3 shadow-xl shadow-blue-500/30 tracking-widest whitespace-nowrap">
                                    RFM {(r as RFMRecord).champions}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-6 text-right">
                            <div className="flex flex-col gap-4 items-end">
                              {r.type === "PCC" && (
                                <button
                                  onClick={() => {
                                    setActiveModal("relasi");
                                    setModalData({ recordId: r.id, pIdx: idx });
                                  }}
                                  className="bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-[0.3em] py-2 px-4 rounded-xl border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all transform hover:-translate-y-1 active:scale-95"
                                >
                                  + Relasi
                                </button>
                              )}
                              <div className="flex gap-4">
                                {canEdit && (
                                  <button
                                    onClick={() => {
                                      setCurrentCat(r.type);
                                      setEditingRecord(r);
                                      setSubView("pcc-rfm-input");
                                    }}
                                    className="p-2.5 rounded-2xl bg-white/5 border border-white/5 text-amber-400 hover:bg-amber-400 hover:text-black transition-all transform hover:scale-110 active:scale-95 group/edit"
                                  >
                                    <Edit3
                                      size={18}
                                      className="group-hover/edit:animate-pulse"
                                    />
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => {
                                      if (confirm("Hapus data pasien ini?")) {
                                        onDelete(r.id!);
                                      }
                                    }}
                                    className="p-2.5 rounded-2xl bg-white/5 border border-white/5 text-rose-400 hover:bg-rose-400 hover:text-white transition-all transform hover:scale-110 active:scale-95"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t border-white/5">
                <div className="flex items-center gap-4">
                  <select
                    className="select select-sm bg-black/40 border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-400 focus:outline-none h-10 px-4"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={20}>20 Baris</option>
                    <option value={50}>50 Baris</option>
                    <option value={100}>100 Baris</option>
                  </select>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                    Menampilkan{" "}
                    <span className="text-white/60">
                      {tableData.length === 0
                        ? 0
                        : (currentPage - 1) * itemsPerPage + 1}
                    </span>{" "}
                    -{" "}
                    <span className="text-white/60">
                      {Math.min(currentPage * itemsPerPage, tableData.length)}
                    </span>{" "}
                    dari{" "}
                    <span className="text-blue-400">{tableData.length}</span>{" "}
                    Data
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-2xl border border-white/5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(1)}
                    className="btn btn-ghost btn-xs w-10 h-10 rounded-xl disabled:opacity-10 hover:bg-white/5 p-0 flex items-center justify-center"
                  >
                    <ChevronsLeft size={16} />
                  </button>
                  <button
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    className="btn btn-ghost btn-xs w-10 h-10 rounded-xl disabled:opacity-10 hover:bg-white/5 p-0 flex items-center justify-center"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div className="flex items-center gap-1 px-4">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                      Hal.
                    </span>
                    <span className="text-sm font-black text-blue-400 bg-blue-500/10 w-9 h-9 flex items-center justify-center rounded-xl border border-blue-500/20">
                      {currentPage}
                    </span>
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                      / {totalPages || 1}
                    </span>
                  </div>

                  <button
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    className="btn btn-ghost btn-xs w-10 h-10 rounded-xl disabled:opacity-10 hover:bg-white/5 p-0 flex items-center justify-center"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(totalPages)}
                    className="btn btn-ghost btn-xs w-10 h-10 rounded-xl disabled:opacity-10 hover:bg-white/5 p-0 flex items-center justify-center"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {subView === "pcc-rfm-care" && (
          <motion.section
            key="care"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Care Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  label: "TOTAL PASIEN",
                  val: deduplicatedRecords.length,
                  icon: <Users className="text-slate-400" />,
                  border: "border-slate-500/30",
                },
                {
                  label: "SUDAH DIUPAYAKAN",
                  val: deduplicatedRecords.filter(
                    (r) => (r.upaya?.length || 0) > 0,
                  ).length,
                  icon: <CheckCircle className="text-emerald-400" />,
                  border: "border-emerald-500/30",
                },
                {
                  label: "BELUM DIUPAYAKAN",
                  val: deduplicatedRecords.filter(
                    (r) => (r.upaya?.length || 0) === 0,
                  ).length,
                  icon: <Hourglass className="text-rose-400" />,
                  border: "border-rose-500/30",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className={`glass p-5 rounded-[2rem] border-l-4 flex items-center gap-6 ${s.border} bg-white/5 shadow-xl`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                      {s.label}
                    </p>
                    <h4 className="text-3xl font-black text-white">{s.val}</h4>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass p-8 rounded-[2rem] border border-white/10 shadow-xl">
              <div className="flex flex-wrap justify-between items-center mb-8 gap-6 border-b border-white/5 pb-8">
                <div>
                  <h2 className="text-xl font-black text-(--text-color) italic tracking-tighter uppercase leading-none">
                    Daftar Perawatan Pelanggan
                  </h2>
                  <p className="text-[10px] font-black text-(--text-color) opacity-40 uppercase tracking-[0.2em] mt-1.5">
                    MANAJEMEN UPAYA
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <button className="btn btn-sm btn-outline border-pink-500/30 text-pink-500 hover:bg-pink-500 hover:text-white glass rounded-xl font-black tracking-widest text-[9px]">
                    <Download size={14} className="mr-2" /> CETAK LAPORAN
                    PERAWATAN
                  </button>
                  <div className="relative w-64">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-color) opacity-30"
                      size={14}
                    />
                    <input
                      type="text"
                      className="input input-sm bg-black/5 border-black/10 w-full pl-10 text-(--text-color) font-bold h-10 rounded-xl focus:border-pink-500/50"
                      placeholder="Cari Nama..."
                      value={careSearch}
                      onChange={(e) => setCareSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto min-h-[400px]">
                <table className="table table-xs w-full border-separate border-spacing-y-3">
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-gradient-to-r from-pink-600 to-rose-700 border-y border-pink-400/30 shadow-lg backdrop-blur-xl">
                      <th className="p-6 text-left rounded-l-2xl w-[40%] text-white font-black tracking-[0.2em] uppercase text-[10px] font-display">
                        NAMA
                      </th>
                      <th className="p-6 text-left w-[15%] text-white/90 font-black tracking-[0.2em] uppercase text-[10px] border-l border-white/10 font-display">
                        Grup Data
                      </th>
                      <th className="p-6 text-left w-[15%] text-white/90 font-black tracking-[0.2em] uppercase text-[10px] border-l border-white/10 font-display">
                        ID SISPRO
                      </th>
                      <th className="p-6 text-left w-[15%] text-white/90 font-black tracking-[0.2em] uppercase text-[10px] border-l border-white/10 font-display">
                        Riwayat Terakhir
                      </th>
                      <th className="p-6 text-right rounded-r-2xl w-[15%] text-white font-black tracking-[0.2em] uppercase text-[10px] border-l border-white/10 font-display">
                        AKSI
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {deduplicatedRecords
                      .filter(
                        (r) =>
                          !careSearch ||
                          r.nama
                            .toLowerCase()
                            .includes(careSearch.toLowerCase()),
                      )
                      .map((r, idx) => {
                        const lastUpaya =
                          r.upaya && r.upaya.length > 0
                            ? r.upaya[r.upaya.length - 1]
                            : null;
                        return (
                          <tr
                            key={r.id || idx}
                            className="bg-white/[0.02] hover:bg-white/[0.08] transition-all duration-500 group border-b border-white/5 hover:border-l-4 hover:border-l-pink-500"
                          >
                            <td className="p-6 rounded-l-[2rem]">
                              <div className="flex gap-4 items-center">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center border border-black/5 dark:border-white/10 text-pink-600 dark:text-white font-display font-black text-sm">
                                  {r.nama
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <div
                                      onClick={() => {
                                        setActiveModal("history");
                                        setModalData({ record: r });
                                      }}
                                      className="text-xl font-black text-(--text-color) tracking-tight cursor-pointer hover:text-blue-500 transition-colors font-display flex items-center flex-wrap gap-2"
                                    >
                                      <span>{r.nama}</span>
                                      {(() => {
                                        const lArr = Array.from(
                                          new Set(
                                            (r.periksa || [])
                                              .map((p) => p.lab)
                                              .filter(Boolean),
                                          ),
                                        );
                                        return lArr.length > 0 ? (
                                          <span className="text-[10px] font-bold text-pink-400 italic">
                                            ({lArr.join(", ")})
                                          </span>
                                        ) : null;
                                      })()}
                                    </div>
                                    <PriorityBadge record={r} />
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-6">
                              <span
                                className={`badge badge-md font-black border-none uppercase tracking-widest text-[10px] px-4 py-3 shadow-2xl ${r.type === "PCC" ? "bg-amber-400 text-black" : "bg-blue-500 text-white shadow-blue-500/20"}`}
                              >
                                {r.type}
                              </span>
                            </td>
                            <td className="p-6">
                              <div className="flex flex-col">
                                <span className="font-display font-black text-white/80 tracking-[0.15em] text-base uppercase">
                                  {r.idsispro}
                                </span>
                              </div>
                            </td>
                            <td className="p-6">
                              {lastUpaya ? (
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2">
                                    <Calendar
                                      size={12}
                                      className="text-emerald-400/50"
                                    />
                                    <span className="text-xs font-display font-black text-emerald-400 tracking-wide">
                                      {lastUpaya.tgl}
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-white/60 font-black uppercase tracking-[0.2em] bg-white/5 self-start px-3 py-1 rounded-full border border-white/10">
                                    {lastUpaya.metode}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-white/10 italic">
                                  <Hourglass size={14} />
                                  <span className="text-xs font-black uppercase tracking-[0.2em]">
                                    MENUNGGU ANTRIAN
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="p-6 text-right rounded-r-[2rem]">
                              <button
                                onClick={() => {
                                  setActiveModal("upaya");
                                  setModalData({ record: r, pIdx: idx });
                                }}
                                className="relative overflow-hidden group/btn bg-pink-500 text-white border-none px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-pink-500/30 hover:shadow-pink-500/50 transition-all transform hover:-translate-y-1 active:translate-y-0"
                              >
                                <span className="relative z-10">UPAYA</span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.section>
        )}

        {subView === "pcc-rfm-guide" && (
          <motion.section
            key="guide"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-blue-600 rounded-[3rem] p-12 text-white shadow-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10">
                <BookOpen size={200} />
              </div>
              <div className="relative z-10">
                <h2 className="text-4xl font-black italic tracking-tighter mb-8 uppercase flex items-center gap-4">
                  <BookOpen size={36} className="text-blue-300" /> Panduan
                  Import Data Excel
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
                    <h3 className="text-xl font-black mb-4 flex items-center gap-3">
                      <Crown className="text-amber-400" /> FORMAT EXCEL PCC
                    </h3>
                    <div className="text-[10px] font-black uppercase text-blue-200 tracking-[0.2em] mb-4">
                      Urutan Header Wajib:
                    </div>
                    <ul className="text-xs space-y-3 font-bold opacity-90 text-white">
                      <li>• NAMA</li>
                      <li>• ID SISPRO</li>
                      <li>• NO TELP</li>
                      <li>• ALAMAT</li>
                      <li>• MEMBERSHIP PCC</li>
                      <li>• Jenis PCC (Gold/Silver)</li>
                    </ul>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
                    <h3 className="text-xl font-black mb-4 flex items-center gap-3">
                      <Gem className="text-purple-400" /> FORMAT EXCEL RFM
                    </h3>
                    <div className="text-[10px] font-black uppercase text-blue-200 tracking-[0.2em] mb-4">
                      Urutan Header Wajib:
                    </div>
                    <ul className="text-xs space-y-3 font-bold opacity-90 text-white">
                      <li>• NAMA</li>
                      <li>• ID SISPRO</li>
                      <li>• NO TELP</li>
                      <li>• ALAMAT</li>
                      <li>• CHAMPIONS</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-black/20 p-6 rounded-2xl border-l-4 border-amber-400 text-sm italic">
                  <p className="font-black text-amber-400 mb-2 uppercase tracking-widest text-[10px]">
                    PENTING:
                  </p>
                  <p className="opacity-80">
                    Pastikan nama header di file Excel Anda sama persis dengan
                    urutan di atas (Huruf Besar/Kecil berpengaruh) agar data
                    terbaca dengan sempurna ke dalam sistem.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Tables for Data views will be added in next step */}
      {/* Modals */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass max-w-lg w-full rounded-[2.5rem] border border-white/10 shadow-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {activeModal === "export-options" && (
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-black text-(--text-color) italic tracking-tighter uppercase">
                      Kustomisasi Laporan PDF
                    </h3>
                    <button
                      onClick={() => setActiveModal(null)}
                      className="text-(--text-color) opacity-30 hover:opacity-100 transition-opacity"
                    >
                      <PlusCircle size={24} className="rotate-45" />
                    </button>
                  </div>

                  {/* Step 1: Type Selection */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-(--text-color) opacity-40 uppercase tracking-[0.2em] px-1">
                      Langkah 1: Pilih Kategori Data
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["PCC", "RFM", "ALL"].map((t) => (
                        <button
                          key={t}
                          onClick={() =>
                            setModalData((p) => ({ ...p, exportType: t }))
                          }
                          className={`btn btn-sm rounded-xl font-black text-[10px] h-10 ${modalData?.exportType === t ? "bg-amber-400 text-black border-none" : "glass border-white/10 text-white"}`}
                        >
                          {t === "ALL" ? "PCC & RFM" : t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Date Selection */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                        Langkah 2: Tentukan Periode
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const now = new Date();
                            const start = new Date(
                              now.getFullYear(),
                              now.getMonth(),
                              1,
                            )
                              .toISOString()
                              .split("T")[0];
                            const end = now.toISOString().split("T")[0];
                            setModalData((p) => ({ ...p, start, end }));
                          }}
                          className="text-[9px] font-black text-blue-400 uppercase hover:text-white transition-colors"
                        >
                          Bulan Ini
                        </button>
                        <span className="text-white/10">|</span>
                        <button
                          onClick={() =>
                            setModalData((p) => ({ ...p, start: "", end: "" }))
                          }
                          className="text-[9px] font-black text-rose-400 uppercase hover:text-white transition-colors"
                        >
                          All Time
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-control">
                        <span className="text-[9px] font-bold text-white/30 mb-1 px-1 uppercase">
                          Dari
                        </span>
                        <input
                          type="date"
                          className="input bg-black/40 border-white/10 text-blue-400 font-bold h-12 rounded-2xl"
                          value={modalData?.start || ""}
                          onChange={(e) =>
                            setModalData((p) => ({
                              ...p,
                              start: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="form-control">
                        <span className="text-[9px] font-bold text-white/30 mb-1 px-1 uppercase">
                          Sampai
                        </span>
                        <input
                          type="date"
                          className="input bg-black/40 border-white/10 text-blue-400 font-bold h-12 rounded-2xl"
                          value={modalData?.end || ""}
                          onChange={(e) =>
                            setModalData((p) => ({ ...p, end: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Visit Filter */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] px-1">
                      Langkah 3: Opsi Kedatangan / Periksa
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "ALL", label: "SEMUA DATA", color: "blue" },
                        {
                          id: "VISITED",
                          label: "SUDAH PERIKSA",
                          color: "emerald",
                        },
                        {
                          id: "NOT_VISITED",
                          label: "BELUM PERIKSA",
                          color: "rose",
                        },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() =>
                            setModalData((p) => ({ ...p, visitStatus: opt.id }))
                          }
                          className={`py-4 rounded-xl font-black text-[9px] uppercase tracking-tighter border transition-all ${
                            (modalData?.visitStatus || "ALL") === opt.id
                              ? `bg-${opt.color}-500/20 border-${opt.color}-500 text-${opt.color}-400 shadow-lg shadow-${opt.color}-500/10`
                              : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() =>
                        generatePDF(
                          (modalData?.exportType || "ALL") as
                            | "PCC"
                            | "RFM"
                            | "ALL",
                          {
                            start: modalData?.start || "",
                            end: modalData?.end || "",
                          },
                          (modalData?.visitStatus || "ALL") as
                            | "ALL"
                            | "VISITED"
                            | "NOT_VISITED",
                        )
                      }
                      className="btn btn-warning w-full h-14 rounded-2xl font-black italic text-lg shadow-xl shadow-amber-500/20 tracking-tighter"
                    >
                      DOWNLOAD LAPORAN PDF SEKARANG
                    </button>
                  </div>
                </div>
              )}

              {activeModal === "periksa" && (
                <form onSubmit={onSavePeriksa} className="p-8 space-y-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">
                      Tambah Data Periksa
                    </h3>
                    <div className="badge badge-xs bg-emerald-500 text-black font-black">
                      {modalData.relIdx === -1 ? "Pasien Utama" : "Relasi"}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label text-[10px] font-black text-white/30 uppercase tracking-widest px-1">
                          Tanggal Periksa
                        </label>
                        <input
                          name="tgl"
                          type="date"
                          className="input bg-black/40 border-white/10 text-blue-400 font-bold h-12 rounded-2xl focus:border-blue-500/50"
                          required
                        />
                      </div>
                      <div className="form-control">
                        <label className="label text-[10px] font-black text-white/30 uppercase tracking-widest px-1">
                          Nomor Lab
                        </label>
                        <input
                          name="lab"
                          type="text"
                          className="input bg-black/40 border-white/10 text-white font-mono h-12 rounded-2xl focus:border-blue-500/50"
                          placeholder="PDRSxxxxx"
                        />
                      </div>
                    </div>
                    <div className="form-control">
                      <label className="label text-[10px] font-black text-white/30 uppercase tracking-widest px-1">
                        Revenue (Rupiah)
                      </label>
                      <input
                        name="revenue"
                        type="number"
                        className="input bg-black/40 border-white/10 text-emerald-400 font-black h-12 rounded-2xl focus:border-blue-500/50"
                        placeholder="Contoh: 500000"
                        required
                      />
                    </div>
                    <div className="form-control">
                      <label className="label text-[10px] font-black text-white/30 uppercase tracking-widest px-1">
                        Catatan / Jenis Pemeriksaan
                      </label>
                      <textarea
                        name="note"
                        className="textarea bg-black/40 border-white/10 text-white font-medium h-24 rounded-2xl focus:border-blue-500/50"
                        placeholder="Input detail pemeriksaan..."
                      ></textarea>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="btn flex-1 glass border-white/10 text-white font-black rounded-2xl"
                    >
                      BATAL
                    </button>
                    {(canAdd || canEdit) && (
                      <button
                        type="submit"
                        className="btn flex-1 bg-emerald-500 border-none text-black font-black rounded-2xl shadow-lg shadow-emerald-500/20"
                      >
                        SIMPAN VISIT
                      </button>
                    )}
                  </div>
                </form>
              )}

              {activeModal === "relasi" && (
                <form
                  key={`${modalData?.recordId}-${modalData?.relIdx}`}
                  onSubmit={onSaveRelasi}
                  className="p-8 space-y-6"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">
                      {modalData?.relIdx !== undefined &&
                      modalData?.relIdx !== -1
                        ? "Perbarui"
                        : "Tambah"}{" "}
                      Data Relasi
                    </h3>
                    <div className="flex gap-2">
                      <div className="badge badge-xs bg-slate-500 text-white font-black uppercase shadow-lg shadow-slate-500/10">
                        SILVER
                      </div>
                      <div className="badge badge-xs bg-blue-500 text-white font-black uppercase">
                        Relasi Pasien
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="form-control">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest px-1 mb-2">
                          Kategori
                        </label>
                        <select
                          name="kategori"
                          className="select bg-black/40 border-white/10 text-white font-bold h-12 rounded-2xl focus:border-blue-500/50 w-full"
                          defaultValue={modalData?.existing?.kategori || "Anak"}
                        >
                          <option>Suami</option>
                          <option>Istri</option>
                          <option>Anak</option>
                          <option>Orang Tua</option>
                          <option>Saudara</option>
                          <option>Lainnya</option>
                        </select>
                      </div>
                      <div className="form-control md:col-span-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest px-1 mb-2">
                          Nama Lengkap Relasi
                        </label>
                        <input
                          name="nama"
                          type="text"
                          className="input bg-black/40 border-white/10 text-white font-bold h-12 rounded-2xl focus:border-blue-500/50 w-full"
                          placeholder="Input Nama..."
                          defaultValue={modalData?.existing?.nama || ""}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest px-1 mb-2">
                        ID SISPRO RELASI
                      </label>
                      <input
                        name="idsispro"
                        type="text"
                        className="input bg-black/40 border-white/10 text-white font-mono h-12 rounded-2xl focus:border-blue-500/50 w-full"
                        placeholder="Input ID Sispro..."
                        defaultValue={modalData?.existing?.idsispro || ""}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="btn flex-1 glass border-white/10 text-white font-black rounded-2xl"
                    >
                      BATAL
                    </button>
                    {(canAdd || canEdit) && (
                      <button
                        type="submit"
                        className="btn flex-1 bg-blue-500 border-none text-white font-black rounded-2xl shadow-lg shadow-blue-500/20"
                      >
                        {modalData?.relIdx !== undefined &&
                        modalData?.relIdx !== -1
                          ? "PERBARUI"
                          : "SIMPAN"}{" "}
                        RELASI
                      </button>
                    )}
                  </div>
                </form>
              )}

              {activeModal === "upaya" && (
                <form onSubmit={onSaveUpaya} className="p-8 space-y-6">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                        <HeartHandshake size={20} className="text-pink-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-(--text-color) tracking-tighter uppercase">
                          Masukan Upaya CC
                        </h3>
                        <p className="text-[10px] font-bold text-pink-500 tracking-[0.2em] uppercase opacity-70">
                          Customer Care Service
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 bg-black/5 p-6 rounded-[2.5rem] border border-black/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 blur-[50px] -mr-16 -mt-16 rounded-full"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                      <div className="form-control">
                        <label className="text-[10px] font-black text-(--text-color) opacity-40 uppercase tracking-[0.3em] px-1 mb-2 ml-1">
                          Tanggal
                        </label>
                        <div className="relative">
                          <Calendar
                            size={14}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 opacity-50"
                          />
                          <input
                            name="tgl"
                            type="date"
                            className="input bg-black/5 border-black/10 text-blue-600 font-bold h-14 rounded-2xl focus:border-blue-500/50 w-full pl-12"
                            required
                          />
                        </div>
                      </div>
                      <div className="form-control focus-within:z-20">
                        <label className="text-[10px] font-black text-(--text-color) opacity-40 uppercase tracking-[0.3em] px-1 mb-2 ml-1">
                          Metode Komunikasi
                        </label>
                        <select
                          name="metode"
                          className="select bg-black/5 border-black/10 text-(--text-color) font-bold h-14 rounded-2xl focus:border-pink-500/50 w-full transition-all"
                          onChange={(e) => setSelectedMetode(e.target.value)}
                          required
                        >
                          <option value="">Pilih Metode...</option>
                          <option>WA Personal</option>
                          <option>WA Blast</option>
                          <option>Telepon</option>
                          <option>Kunjungan Langsung</option>
                          <option>Media Sosial / Email</option>
                        </select>
                      </div>
                    </div>

                    <AnimatePresence>
                      {(selectedMetode?.toUpperCase() === "WA PERSONAL" ||
                        selectedMetode?.toUpperCase() === "WA BLAST") && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="form-control bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 p-5 rounded-2xl"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <Bot size={16} className="text-blue-400" />
                            <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">
                              Jumlah WhatsApp Terkirim
                            </label>
                          </div>
                          <input
                            name="jumlahWA"
                            type="number"
                            min="1"
                            defaultValue="1"
                            className="input bg-black/40 border-white/10 text-white font-black h-12 rounded-xl focus:border-blue-500/50 w-full text-center text-lg"
                            required
                          />
                          <p className="text-[9px] text-white/30 font-medium mt-2 italic">
                            * Angka ini akan dijumlahkan dalam statistik log
                            pelayanan.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="form-control">
                      <label className="text-[10px] font-black text-(--text-color) opacity-40 uppercase tracking-[0.3em] px-1 mb-2 ml-1">
                        Hasil & Rencana Lanjutan
                      </label>
                      <textarea
                        name="hasil"
                        className="textarea bg-black/5 border-black/10 text-(--text-color) font-medium h-32 rounded-2xl focus:border-pink-500/50 w-full p-4"
                        placeholder="Tuliskan respon pelanggan dan langkah selanjutnya..."
                        required
                      ></textarea>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        setSelectedMetode("");
                      }}
                      className="btn h-14 flex-1 glass border-black/5 text-(--text-color) font-black rounded-2xl tracking-widest text-[10px]"
                    >
                      BATAL
                    </button>
                    {(canAdd || canEdit) && (
                      <button
                        type="submit"
                        className="btn h-14 flex-1 bg-gradient-to-r from-pink-500 to-rose-600 border-none text-white font-black rounded-2xl shadow-2xl shadow-pink-500/30 tracking-widest text-[10px] hover:shadow-pink-500/50 transition-all uppercase"
                      >
                        Simpan Log Pelayanan
                      </button>
                    )}
                  </div>
                </form>
              )}

               {activeModal === "relasi-detail" && (
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
                        <Users size={20} className="text-blue-400" />
                        Detail Kerabat
                      </h3>
                      <p className="text-[10px] font-bold text-blue-400 mt-1 uppercase tracking-widest opacity-60">
                         Relasi Pasien Prodia
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveModal(null)}
                      className="text-white/30 hover:text-white"
                    >
                      <PlusCircle size={24} className="rotate-45" />
                    </button>
                  </div>

                  <div className="bg-white/5 rounded-[2rem] border border-white/5 p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <div>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Nama Pasien</p>
                        <p className="text-lg font-black text-white uppercase italic">{modalData?.nama}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Kategori</p>
                        <span className="badge badge-sm bg-blue-500/20 text-blue-400 border-none font-black italic">
                          {modalData?.kategori} (SILVER)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">ID Sispro</p>
                        <p className="text-sm font-mono font-bold text-blue-400">{modalData?.idsispro}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Kepala Keluarga</p>
                        <p className="text-sm font-bold text-white/60">{modalData?.parent}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] px-1">
                      Riwayat Kunjungan Kerabat
                    </label>
                    <div className="max-h-[30vh] overflow-y-auto custom-scrollbar space-y-3 p-1">
                      {modalData?.periksa && modalData.periksa.length > 0 ? (
                        modalData.periksa.map((v: Visit, i: number) => (
                          <div
                            key={i}
                            className="bg-white/5 p-4 rounded-2xl border border-white/5 relative pl-12"
                          >
                            <div className="absolute left-4 top-4 w-4 h-4 bg-emerald-500 rounded-full border-4 border-white/10"></div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                                {v.tgl}
                              </span>
                              <span className="text-[10px] font-black text-emerald-400">
                                {formatIDR(v.revenue)}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              {v.lab && (
                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 self-start px-2 py-0.5 rounded-lg border border-blue-500/20">
                                  LAB: {v.lab}
                                </p>
                              )}
                              <p className="text-xs font-bold text-white/80 leading-relaxed">
                                {v.note || "-"}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 opacity-20 border border-dashed border-white/10 rounded-2xl">
                          <p className="text-[9px] font-black italic uppercase tracking-widest">
                            Belum ada riwayat kunjungan
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveModal(null)}
                    className="btn w-full bg-blue-500 border-none text-white font-black rounded-2xl shadow-xl shadow-blue-500/20"
                  >
                    TUTUP DETAIL
                  </button>
                </div>
              )}

              {activeModal === "history" && (
                <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">
                        Riwayat Perawatan
                      </h3>
                      <p className="text-xs font-bold text-blue-400 mt-1">
                        {modalData.record.nama}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveModal(null)}
                      className="text-white/30 hover:text-white"
                    >
                      <PlusCircle size={24} className="rotate-45" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Section: Visit / Periksa */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] px-1">
                        Riwayat Kunjungan (Visit)
                      </label>
                      {modalData.record.periksa &&
                      modalData.record.periksa.length > 0 ? (
                        modalData.record.periksa.map((v: Visit, i: number) => (
                          <div
                            key={i}
                            className="bg-white/5 p-4 rounded-2xl border border-white/5 relative pl-12"
                          >
                            <div className="absolute left-4 top-4 w-4 h-4 bg-emerald-500 rounded-full border-4 border-white/10"></div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                                {v.tgl}
                              </span>
                              <span className="text-[10px] font-black text-emerald-400">
                                {formatIDR(v.revenue)}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              {v.lab && (
                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 self-start px-2 py-0.5 rounded-lg border border-blue-500/20">
                                  LAB: {v.lab}
                                </p>
                              )}
                              <p className="text-xs font-bold text-white/80 leading-relaxed">
                                {v.note || "-"}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 opacity-20 border border-dashed border-white/10 rounded-2xl">
                          <p className="text-[9px] font-black italic uppercase tracking-widest">
                            Belum ada kunjungan
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Section: Care Upaya */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em] px-1">
                        Riwayat Upaya Perawatan
                      </label>
                      {modalData.record.upaya &&
                      modalData.record.upaya.length > 0 ? (
                        modalData.record.upaya.map(
                          (u: CareUpaya, i: number) => (
                            <div
                              key={i}
                              className="bg-white/5 p-4 rounded-2xl border border-white/5 relative pl-12"
                            >
                              <div className="absolute left-4 top-4 w-4 h-4 bg-pink-500 rounded-full border-4 border-white/10"></div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                                  {u.tgl}
                                </span>
                                <div className="flex gap-2">
                                  {u.jumlahWA && (
                                    <span className="badge badge-xs bg-blue-500/20 text-blue-400 border-none font-bold italic">
                                      QTY: {u.jumlahWA}
                                    </span>
                                  )}
                                  <span className="badge badge-xs bg-pink-500/20 text-pink-400 border-none font-bold">
                                    {u.metode}
                                  </span>
                                </div>
                              </div>
                              <p className="text-[10px] font-bold text-white/80 leading-relaxed">
                                {u.hasil}
                              </p>
                            </div>
                          ),
                        )
                      ) : (
                        <div className="text-center py-6 opacity-20 border border-dashed border-white/10 rounded-2xl">
                          <p className="text-[9px] font-black italic uppercase tracking-widest">
                            Belum ada upaya
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
