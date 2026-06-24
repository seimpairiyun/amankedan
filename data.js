// ====== DUMMY DATA ======
// Di versi backend nanti, ini akan diganti hasil fetch dari API/database.

const RESOURCES = [
  { id: "mb-1", type: "mobil", name: "Toyota Avanza", code: "B 1234 ABC", capacity: "7 kursi" },
  { id: "mb-2", type: "mobil", name: "Toyota Innova", code: "B 5678 DEF", capacity: "7 kursi" },
  { id: "mb-3", type: "mobil", name: "Honda Brio", code: "B 9012 GHI", capacity: "5 kursi" },
  { id: "rg-1", type: "ruangan", name: "Ruang Rapat Anggrek", code: "Lantai 2", capacity: "12 orang" },
  { id: "rg-2", type: "ruangan", name: "Ruang Rapat Melati", code: "Lantai 3", capacity: "6 orang" },
];

// Helper untuk generate tanggal relatif ke hari ini supaya demo selalu relevan
// (pakai komponen tanggal lokal, bukan toISOString, agar tidak geser timezone)
function dOffset(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// CATATAN STRUKTUR DATA:
// Setiap booking sekarang punya startDate & endDate (bukan cuma "date" tunggal),
// supaya peminjaman yang berlangsung lebih dari 1 hari (mis. dinas luar kota 3 hari)
// bisa direpresentasikan dengan benar. Untuk booking 1 hari, startDate === endDate.
// letterNumber = nomor surat/nota dinas yang menyertai pengajuan peminjaman.
const BOOKINGS = [
  { id: "bk-1", resourceId: "mb-1", startDate: dOffset(0), endDate: dOffset(0), start: "08:00", end: "11:00", purpose: "Antar dokumen ke cabang Medan Kota", requester: "Budi Santoso", letterNumber: "ND-014/UMUM/VI/2026", status: "approved" },
  { id: "bk-2", resourceId: "rg-1", startDate: dOffset(0), endDate: dOffset(0), start: "13:00", end: "14:30", purpose: "Rapat koordinasi tim Finance", requester: "Siti Aminah", letterNumber: "ND-015/FIN/VI/2026", status: "approved" },
  { id: "bk-3", resourceId: "mb-2", startDate: dOffset(1), endDate: dOffset(3), start: "09:00", end: "17:00", purpose: "Kunjungan klien ke Binjai (3 hari)", requester: "Andi Wijaya", letterNumber: "ND-016/MKT/VI/2026", status: "pending" },
  { id: "bk-4", resourceId: "rg-2", startDate: dOffset(2), endDate: dOffset(2), start: "10:00", end: "11:00", purpose: "Interview kandidat staff baru", requester: "Dewi Lestari", letterNumber: "ND-017/HC/VI/2026", status: "approved" },
  { id: "bk-5", resourceId: "rg-1", startDate: dOffset(2), endDate: dOffset(2), start: "14:00", end: "16:00", purpose: "Presentasi laporan kuartal", requester: "Rudi Hartono", letterNumber: "ND-018/FIN/VI/2026", status: "pending" },
  { id: "bk-6", resourceId: "mb-3", startDate: dOffset(3), endDate: dOffset(3), start: "07:30", end: "09:00", purpose: "Jemput tamu di airport", requester: "Lina Marpaung", letterNumber: "ND-019/UMUM/VI/2026", status: "approved" },
  { id: "bk-7", resourceId: "mb-1", startDate: dOffset(5), endDate: dOffset(5), start: "09:00", end: "12:00", purpose: "Survey lokasi gudang baru", requester: "Hendra Gunawan", letterNumber: "ND-020/OPS/VI/2026", status: "rejected" },
  { id: "bk-8", resourceId: "rg-2", startDate: dOffset(5), endDate: dOffset(5), start: "09:00", end: "10:00", purpose: "Standup mingguan tim IT", requester: "Citra Dewi", letterNumber: "ND-021/IT/VI/2026", status: "approved" },
  { id: "bk-9", resourceId: "mb-2", startDate: dOffset(8), endDate: dOffset(9), start: "08:00", end: "10:00", purpose: "Distribusi barang promosi (2 hari)", requester: "Fajar Nugroho", letterNumber: "ND-022/MKT/VI/2026", status: "approved" },
  { id: "bk-10", resourceId: "rg-1", startDate: dOffset(8), endDate: dOffset(8), start: "11:00", end: "12:30", purpose: "Rapat evaluasi vendor", requester: "Maya Putri", letterNumber: "ND-023/PROC/VI/2026", status: "pending" },
  { id: "bk-11", resourceId: "mb-3", startDate: dOffset(-2), endDate: dOffset(-2), start: "10:00", end: "12:00", purpose: "Antar proposal ke mitra", requester: "Agus Salim", letterNumber: "ND-013/UMUM/VI/2026", status: "approved" },
  { id: "bk-12", resourceId: "rg-2", startDate: dOffset(12), endDate: dOffset(12), start: "13:00", end: "15:00", purpose: "Training onboarding karyawan", requester: "Nadia Putri", letterNumber: "ND-024/HC/VI/2026", status: "approved" },
];
