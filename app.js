// ====== STATE ======
let currentDate = new Date();
// activeTypes tidak lagi dikontrol checkbox (filter Jenis Resource di sidebar
// sudah dihapus) — sekarang selalu menampilkan semua jenis resource.
const activeTypes = new Set(["mobil", "ruangan"]);
let selectedDateStr = null;

const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

// ====== HELPERS ======
// PENTING: jangan pakai toISOString() untuk tanggal lokal — itu mengonversi
// ke UTC dulu, jadi di zona waktu +7 (WIB) tanggalnya bisa mundur 1 hari.
// Fungsi di bawah ambil tahun/bulan/tanggal langsung dari objek Date lokal.
function fmtDateStr(d){
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtDateLong(dateStr){
  const d = new Date(dateStr + "T00:00:00");
  const days = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  return `${days[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

function getResource(id){ return RESOURCES.find(r => r.id === id); }

function bookingsForDate(dateStr){
  return BOOKINGS.filter(b => {
    const res = getResource(b.resourceId);
    // dateStr berada dalam rentang [startDate, endDate] — perbandingan string
    // aman karena format YYYY-MM-DD selalu terurut leksikografis sama dengan kronologis.
    return dateStr >= b.startDate && dateStr <= b.endDate && activeTypes.has(res.type);
  }).sort((a,b) => a.start.localeCompare(b.start));
}

// Hitung jumlah hari dalam rentang (inklusif), untuk label "3 hari" dsb.
function rangeDayCount(startDate, endDate){
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  return Math.round((end - start) / 86400000) + 1;
}

// Cek apakah sebuah resource sedang dibooking pada tanggal hari ini.
// Status "pending" maupun "approved" keduanya dihitung memblokir unit,
// supaya tidak terjadi potensi double-booking selagi menunggu approval.
function isResourceBookedToday(resourceId){
  const todayStr = fmtDateStr(new Date());
  return BOOKINGS.some(b =>
    b.resourceId === resourceId &&
    todayStr >= b.startDate && todayStr <= b.endDate
  );
}

// ====== RENDER: SIDEBAR RESOURCE LIST ======
function renderResourceList(){
  const availableResources = RESOURCES
    .filter(r => activeTypes.has(r.type))
    .filter(r => !isResourceBookedToday(r.id)); // sembunyikan unit yang sedang terpakai hari ini

  // ---- Versi SIDEBAR (desktop & off-canvas mobile): kartu 2 baris, detail lengkap ----
  let sidebarHtml;
  if(availableResources.length === 0){
    sidebarHtml = `<div class="resource-empty">Semua unit sedang dipakai hari ini.</div>`;
  } else {
    sidebarHtml = availableResources.map(r =>
      `<div class="resource-chip"><strong>${r.type === "mobil" ? "🚗" : "🏛"} ${r.name}</strong><span>${r.code} · ${r.capacity}</span></div>`
    ).join("");
  }
  document.getElementById("resourceList").innerHTML = sidebarHtml;

  // ---- Versi MOBILE (di bawah kalender): pill ringkas 1 baris per unit ----
  const mobileList = document.getElementById("resourceListMobile");
  if(mobileList){
    let mobileHtml;
    if(availableResources.length === 0){
      mobileHtml = `<div class="resource-empty">Semua unit sedang dipakai hari ini.</div>`;
    } else {
      mobileHtml = availableResources.map(r =>
        `<div class="resource-pill resource-pill-${r.type}">
           <span class="resource-pill-icon">${r.type === "mobil" ? "🚗" : "🏛"}</span>
           <span class="resource-pill-text">${r.name} <span class="resource-pill-dash">–</span> ${r.code}</span>
         </div>`
      ).join("");
    }
    mobileList.innerHTML = mobileHtml;
  }
}

// ====== RENDER: CALENDAR GRID ======
function renderCalendar(){
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  document.getElementById("monthLabel").textContent = `${monthNames[month]} ${year}`;

  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";

  const firstOfMonth = new Date(year, month, 1);
  // Senin = 0 ... Minggu = 6
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - startOffset);

  const todayStr = fmtDateStr(new Date());

  for(let i = 0; i < 42; i++){
    const cellDate = new Date(startDate);
    cellDate.setDate(startDate.getDate() + i);
    const cellStr = fmtDateStr(cellDate);
    const isOutside = cellDate.getMonth() !== month;
    const isToday = cellStr === todayStr;

    const cell = document.createElement("div");
    cell.className = "day-cell" + (isOutside ? " outside" : "") + (isToday ? " today" : "");
    cell.tabIndex = 0;
    cell.dataset.date = cellStr;

    const dayBookings = bookingsForDate(cellStr);

    // Versi teks lengkap — ditampilkan di tablet/desktop (lihat .day-tags di CSS)
    const visibleTags = dayBookings.slice(0, 3).map(b => {
      const res = getResource(b.resourceId);
      return `<div class="tag ${b.status}">
                <span class="tag-time">${b.start}</span>
                <span class="tag-name">${res.name}</span>
              </div>`;
    }).join("");
    const moreCount = dayBookings.length - 3;
    const moreHtml = moreCount > 0 ? `<div class="tag-more">+${moreCount} lainnya</div>` : "";

    // Versi dot ringkas — ditampilkan di mobile kecil (lihat .day-dots di CSS)
    const visibleDots = dayBookings.slice(0, 4).map(b =>
      `<span class="day-dot ${b.status}"></span>`
    ).join("");
    const dotMoreCount = dayBookings.length - 4;
    const dotMoreHtml = dotMoreCount > 0 ? `<span class="day-dot-more">+${dotMoreCount}</span>` : "";

    cell.innerHTML = `
      <div class="day-number">${cellDate.getDate()}</div>
      <div class="day-tags">${visibleTags}${moreHtml}</div>
      <div class="day-dots">${visibleDots}${dotMoreHtml}</div>
    `;

    cell.addEventListener("click", () => openDrawer(cellStr));
    cell.addEventListener("keydown", (e) => { if(e.key === "Enter") openDrawer(cellStr); });

    grid.appendChild(cell);
  }
}

// ====== DRAWER: DAY DETAIL ======
function openDrawer(dateStr){
  selectedDateStr = dateStr;
  document.getElementById("drawerDate").textContent = fmtDateLong(dateStr);

  const body = document.getElementById("drawerBody");
  const dayBookings = bookingsForDate(dateStr);

  if(dayBookings.length === 0){
    body.innerHTML = `
      <div class="empty-day">
        <strong>Belum ada jadwal</strong>
        <span>Tanggal ini masih kosong untuk semua unit yang ditampilkan.</span>
      </div>`;
  } else {
    body.innerHTML = dayBookings.map(b => {
      const res = getResource(b.resourceId);
      const statusLabel = { approved:"Disetujui", pending:"Menunggu", rejected:"Ditolak" }[b.status];
      const isMultiDay = b.startDate !== b.endDate;
      const rangeInfo = isMultiDay
        ? `<div class="booking-range">📅 ${fmtDateLong(b.startDate)} – ${fmtDateLong(b.endDate)} <span class="booking-range-badge">${rangeDayCount(b.startDate, b.endDate)} hari</span></div>`
        : "";
      const letterInfo = b.letterNumber
        ? `<div class="booking-letter">📄 ${b.letterNumber}</div>`
        : "";
      return `
        <div class="booking-card type-${res.type}">
          <div class="booking-card-top">
            <span class="booking-time">${b.start} – ${b.end}</span>
            <span class="status-pill ${b.status}">${statusLabel}</span>
          </div>
          ${rangeInfo}
          <div class="booking-resource">${res.type === "mobil" ? "🚗" : "🏛"} ${res.name} <span style="color:var(--ink-faint); font-weight:400;">· ${res.code}</span></div>
          <div class="booking-purpose">${b.purpose}</div>
          <div class="booking-requester">👤 ${b.requester}${b.division ? ` <span class="booking-division">· ${b.division}</span>` : ""}</div>
          ${letterInfo}
        </div>`;
    }).join("");
  }

  document.getElementById("drawerOverlay").classList.add("open");
}

function closeDrawer(){
  document.getElementById("drawerOverlay").classList.remove("open");
}

// ====== MODAL: NEW BOOKING ======
let currentFormType = "mobil";

function populateResourceSelect(){
  const select = document.getElementById("resourceSelect");
  select.innerHTML = "";
  RESOURCES.filter(r => r.type === currentFormType).forEach(r => {
    const opt = document.createElement("option");
    opt.value = r.id;
    opt.textContent = `${r.name} (${r.code})`;
    select.appendChild(opt);
  });
  checkAvailability();
}

function openModal(prefillDate){
  document.getElementById("modalOverlay").classList.add("open");
  populateResourceSelect();
  const initialDate = prefillDate || fmtDateStr(new Date());
  document.getElementById("startDateInput").value = initialDate;
  document.getElementById("endDateInput").value = initialDate;
  checkAvailability();
}

function closeModal(){
  document.getElementById("modalOverlay").classList.remove("open");
  document.getElementById("bookingForm").reset();
  document.getElementById("availabilityNote").classList.remove("show");
}

// ====== CEK BENTROK JADWAL (mendukung rentang tanggal) ======
function checkAvailability(){
  const resourceId = document.getElementById("resourceSelect").value;
  const startDate = document.getElementById("startDateInput").value;
  const endDate = document.getElementById("endDateInput").value;
  const start = document.getElementById("startTime").value;
  const end = document.getElementById("endTime").value;
  const note = document.getElementById("availabilityNote");

  if(!resourceId || !startDate || !endDate || !start || !end){
    note.classList.remove("show");
    return;
  }

  // Validasi: tanggal selesai tidak boleh sebelum tanggal mulai
  if(endDate < startDate){
    note.classList.add("show");
    note.classList.remove("ok");
    note.classList.add("conflict");
    note.textContent = `⚠ Tanggal selesai tidak boleh sebelum tanggal mulai`;
    return;
  }

  // Dua rentang [startDate,endDate] dan [b.startDate,b.endDate] overlap jika
  // startDate <= b.endDate DAN endDate >= b.startDate. Untuk hari yang sama
  // dalam rentang tersebut, baru dicek juga apakah jamnya beririsan.
  const conflict = BOOKINGS.find(b =>
    b.resourceId === resourceId &&
    b.status !== "rejected" &&
    startDate <= b.endDate && endDate >= b.startDate &&
    start < b.end && end > b.start
  );

  note.classList.add("show");
  if(conflict){
    note.classList.remove("ok");
    note.classList.add("conflict");
    const conflictRange = conflict.startDate === conflict.endDate
      ? fmtDateLong(conflict.startDate)
      : `${fmtDateLong(conflict.startDate)} – ${fmtDateLong(conflict.endDate)}`;
    note.textContent = `⚠ Bentrok dengan jadwal ${conflict.start}–${conflict.end} pada ${conflictRange} (${conflict.purpose})`;
  } else {
    note.classList.remove("conflict");
    note.classList.add("ok");
    note.textContent = `✓ Unit tersedia pada rentang waktu ini`;
  }
}

// ====== REKAPITULASI: render tabel + filter + sort + export Excel ======
const statusLabelMap = { approved: "Disetujui", pending: "Menunggu" };
const typeLabelMap = { mobil: "Mobil Dinas", ruangan: "Ruang Rapat" };

// State sorting tabel rekap: kolom aktif & arah (asc/desc)
let recapSortKey = "date";
let recapSortDir = "asc";

function getFilteredRecapData(){
  const statusFilter = document.getElementById("recapStatusFilter").value;
  const monthFilter = document.getElementById("recapMonthFilter").value; // format YYYY-MM

  let data = BOOKINGS.filter(b => {
    if(statusFilter !== "all" && b.status !== statusFilter) return false;
    // Booking dianggap masuk bulan filter jika rentang tanggalnya (startDate-endDate)
    // bersinggungan dengan bulan tersebut — bukan cuma exact match startDate saja,
    // supaya booking multi-hari yang melintasi pergantian bulan tetap muncul.
    if(monthFilter){
      const monthStart = monthFilter + "-01";
      const monthEnd = monthFilter + "-31";
      if(!(b.startDate <= monthEnd && b.endDate >= monthStart)) return false;
    }
    return true;
  });

  // Sorting berdasarkan kolom yang dipilih user lewat tombol header
  const dir = recapSortDir === "asc" ? 1 : -1;
  data.sort((a, b) => {
    let valA, valB;
    switch(recapSortKey){
      case "date": valA = a.startDate + a.start; valB = b.startDate + b.start; break;
      case "time": valA = a.start; valB = b.start; break;
      case "type": valA = getResource(a.resourceId).type; valB = getResource(b.resourceId).type; break;
      case "unit": valA = getResource(a.resourceId).name; valB = getResource(b.resourceId).name; break;
      case "purpose": valA = a.purpose; valB = b.purpose; break;
      case "requester": valA = a.requester; valB = b.requester; break;
      case "division": valA = a.division || ""; valB = b.division || ""; break;
      case "letterNumber": valA = a.letterNumber || ""; valB = b.letterNumber || ""; break;
      case "status": valA = a.status; valB = b.status; break;
      default: valA = a.startDate; valB = b.startDate;
    }
    return valA.localeCompare(valB) * dir;
  });

  return data;
}

function renderRecapTable(){
  const data = getFilteredRecapData();
  const tbody = document.getElementById("recapTableBody");
  const emptyState = document.getElementById("recapEmpty");

  if(data.length === 0){
    tbody.innerHTML = "";
    emptyState.classList.add("show");
  } else {
    emptyState.classList.remove("show");
    tbody.innerHTML = data.map((b, idx) => {
      const res = getResource(b.resourceId);
      const dateCell = b.startDate === b.endDate
        ? fmtDateLong(b.startDate)
        : `${fmtDateLong(b.startDate)} – <br>${fmtDateLong(b.endDate)}`;
      return `
        <tr>
          <td class="col-no">${idx + 1}</td>
          <td>${dateCell}</td>
          <td>${b.start}–${b.end}</td>
          <td>${typeLabelMap[res.type]}</td>
          <td>${res.name} <span style="color:var(--ink-faint)">(${res.code})</span></td>
          <td class="col-purpose">${b.purpose}</td>
          <td>${b.requester}</td>
          <td>${b.division || "-"}</td>
          <td>${b.letterNumber || "-"}</td>
          <td><span class="recap-status-badge ${b.status}">${statusLabelMap[b.status]}</span></td>
        </tr>`;
    }).join("");
  }

  // Update indikator visual arah sort (▲/▼) pada tombol header yang sedang aktif
  document.querySelectorAll(".sort-btn").forEach(btn => {
    const icon = btn.querySelector(".sort-icon");
    if(btn.dataset.sort === recapSortKey){
      icon.textContent = recapSortDir === "asc" ? "▲" : "▼";
      btn.classList.add("sort-active");
    } else {
      icon.textContent = "⇅";
      btn.classList.remove("sort-active");
    }
  });

  // Summary ringkas: cukup Total dan Menunggu sesuai hasil filter saat ini
  const total = data.length;
  const pending = data.filter(b => b.status === "pending").length;
  document.getElementById("recapSummary").innerHTML = `
    <span>Total: <strong>${total}</strong></span>
    <span>Menunggu: <strong>${pending}</strong></span>
  `;
}

// ====== APPROVAL / ADMIN: terima atau hapus pengajuan ======
function renderApprovalList(){
  const body = document.getElementById("approvalBody");

  // Tampilkan semua booking yang masih relevan untuk ditindaklanjuti,
  // diurutkan supaya yang "Menunggu" muncul lebih dulu (paling butuh aksi).
  const sorted = [...BOOKINGS].sort((a, b) => {
    if(a.status !== b.status) return a.status === "pending" ? -1 : 1;
    return (a.startDate + a.start).localeCompare(b.startDate + b.start);
  });

  if(sorted.length === 0){
    body.innerHTML = `
      <div class="empty-day">
        <strong>Belum ada pengajuan</strong>
        <span>Belum ada data peminjaman untuk dikelola.</span>
      </div>`;
    return;
  }

  body.innerHTML = sorted.map(b => {
    const res = getResource(b.resourceId);
    const statusLabel = statusLabelMap[b.status] || b.status;
    const dateText = b.startDate === b.endDate
      ? fmtDateLong(b.startDate)
      : `${fmtDateLong(b.startDate)} – ${fmtDateLong(b.endDate)}`;
    return `
      <div class="booking-card type-${res.type}" data-booking-id="${b.id}">
        <div class="booking-card-top">
          <span class="booking-time">${b.start} – ${b.end}</span>
          <span class="status-pill ${b.status}">${statusLabel}</span>
        </div>
        <div class="booking-range">📅 ${dateText}</div>
        <div class="booking-resource">${res.type === "mobil" ? "🚗" : "🏛"} ${res.name} <span style="color:var(--ink-faint); font-weight:400;">· ${res.code}</span></div>
        <div class="booking-purpose">${b.purpose}</div>
        <div class="booking-requester">👤 ${b.requester}${b.division ? ` <span class="booking-division">· ${b.division}</span>` : ""}</div>
        ${b.letterNumber ? `<div class="booking-letter">📄 ${b.letterNumber}</div>` : ""}
        <div class="approval-actions">
          <button type="button" class="btn-approve" data-action="approve" data-id="${b.id}" ${b.status === "approved" ? "disabled" : ""}>
            ✓ Terima
          </button>
          <button type="button" class="btn-delete" data-action="delete" data-id="${b.id}">
            🗑 Hapus
          </button>
        </div>
      </div>`;
  }).join("");
}

function openApproval(){
  document.getElementById("approvalOverlay").classList.add("open");
  renderApprovalList();
}

function closeApproval(){
  document.getElementById("approvalOverlay").classList.remove("open");
}

function openRecap(){
  document.getElementById("recapOverlay").classList.add("open");
  // Default filter bulan = bulan saat ini, supaya rekap yang relevan
  // langsung terlihat tanpa perlu pilih manual setiap kali dibuka.
  const now = new Date();
  const currentMonthValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  document.getElementById("recapMonthFilter").value = currentMonthValue;
  renderRecapTable();
}

function closeRecap(){
  document.getElementById("recapOverlay").classList.remove("open");
}

function exportRecapToExcel(){
  const data = getFilteredRecapData();

  if(data.length === 0){
    alert("Tidak ada data untuk diekspor. Coba ubah filter terlebih dahulu.");
    return;
  }

  // Tanggal Mulai/Selesai dikirim sebagai objek Date asli (bukan string format
  // panjang) supaya Excel mengenalinya sebagai kolom Date sungguhan — bisa
  // di-sort, difilter, dan diformat ulang oleh user di Excel.
  const rows = data.map(b => {
    const res = getResource(b.resourceId);
    return {
      "Tanggal Mulai": new Date(b.startDate + "T00:00:00"),
      "Tanggal Selesai": new Date(b.endDate + "T00:00:00"),
      "Jam Mulai": b.start,
      "Jam Selesai": b.end,
      "Jenis": typeLabelMap[res.type],
      "Unit": res.name,
      "Kode/Lokasi": res.code,
      "Keperluan": b.purpose,
      "Pemohon": b.requester,
      "Bidang/Divisi": b.division || "-",
      "Nomor Surat/Nota Dinas": b.letterNumber || "-",
      "Status": statusLabelMap[b.status]
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows, { cellDates: true });

  // Set format tampilan cell untuk kolom Tanggal Mulai (A) & Tanggal Selesai (B)
  // jadi "dd/mm/yyyy" — format umum di Indonesia — bukan format default Excel.
  const dateFormat = "dd/mm/yyyy";
  const rowCount = rows.length;
  for(let r = 2; r <= rowCount + 1; r++){
    ["A","B"].forEach(col => {
      const cellRef = `${col}${r}`;
      if(worksheet[cellRef]){
        worksheet[cellRef].z = dateFormat;
      }
    });
  }

  // Lebar kolom otomatis biar tidak terlalu sempit dibuka di Excel
  worksheet["!cols"] = [
    { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 14 },
    { wch: 18 }, { wch: 14 }, { wch: 32 }, { wch: 18 }, { wch: 16 }, { wch: 20 }, { wch: 12 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rekapitulasi");

  const today = fmtDateStr(new Date());
  XLSX.writeFile(workbook, `Rekapitulasi-Peminjaman-AmanKedan-${today}.xlsx`);
}

// ====== EVENT BINDINGS ======
document.addEventListener("DOMContentLoaded", () => {
  renderResourceList();
  renderCalendar();

  // Sidebar toggle (mobile burger menu)
  const sidebar = document.getElementById("sidebar");
  const scrim = document.getElementById("sidebarScrim");

  function openSidebar(){
    sidebar.classList.add("open");
    scrim.classList.add("open");
    document.body.classList.add("sidebar-locked");
  }
  function closeSidebar(){
    sidebar.classList.remove("open");
    scrim.classList.remove("open");
    document.body.classList.remove("sidebar-locked");
  }

  document.getElementById("openSidebarBtn").addEventListener("click", openSidebar);
  document.getElementById("closeSidebarBtn").addEventListener("click", closeSidebar);
  scrim.addEventListener("click", closeSidebar);

  // Mobile "+" button in topbar opens the same booking modal
  document.getElementById("btnNewBookingMobile").addEventListener("click", () => openModal());

  // Close sidebar automatically if window is resized to desktop width
  window.addEventListener("resize", () => {
    if(window.innerWidth >= 900) closeSidebar();
  });

  // (Filter checkbox Jenis Resource telah dihapus dari sidebar — activeTypes
  // sekarang konstan berisi semua jenis, lihat deklarasi di bagian STATE)

  // Month navigation
  document.getElementById("prevMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });
  document.getElementById("nextMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });
  document.getElementById("todayBtn").addEventListener("click", () => {
    currentDate = new Date();
    renderCalendar();
  });

  // Drawer
  document.getElementById("closeDrawer").addEventListener("click", closeDrawer);
  document.getElementById("drawerOverlay").addEventListener("click", (e) => {
    if(e.target.id === "drawerOverlay") closeDrawer();
  });
  document.getElementById("drawerNewBooking").addEventListener("click", () => {
    closeDrawer();
    openModal(selectedDateStr);
  });

  // Modal open/close
  document.getElementById("btnNewBooking").addEventListener("click", () => openModal());
  document.getElementById("closeModal").addEventListener("click", closeModal);
  document.getElementById("cancelModal").addEventListener("click", closeModal);
  document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if(e.target.id === "modalOverlay") closeModal();
  });

  // Segmented control (jenis resource di form)
  document.querySelectorAll(".seg-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFormType = btn.dataset.type;
      populateResourceSelect();
    });
  });

  // Live availability check
  ["resourceSelect","startDateInput","endDateInput","startTime","endTime"].forEach(id => {
    document.getElementById(id).addEventListener("change", checkAvailability);
  });

  // Saat tanggal mulai diubah, set otomatis "min" tanggal selesai supaya
  // tidak bisa dipilih tanggal selesai sebelum tanggal mulai.
  document.getElementById("startDateInput").addEventListener("change", (e) => {
    const endDateInput = document.getElementById("endDateInput");
    endDateInput.min = e.target.value;
    if(endDateInput.value < e.target.value){
      endDateInput.value = e.target.value;
    }
  });

  // Submit form (demo only — belum ada backend)
  document.getElementById("bookingForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const resourceId = document.getElementById("resourceSelect").value;
    const res = getResource(resourceId);
    const startDate = document.getElementById("startDateInput").value;
    const endDate = document.getElementById("endDateInput").value;
    const start = document.getElementById("startTime").value;
    const end = document.getElementById("endTime").value;
    const purpose = document.getElementById("purposeInput").value;
    const requester = document.getElementById("nameInput").value;
    const division = document.getElementById("divisionInput").value;
    const letterNumber = document.getElementById("letterNumberInput").value;

    BOOKINGS.push({
      id: "bk-" + Date.now(),
      resourceId, startDate, endDate, start, end, purpose, requester, division, letterNumber,
      status: "pending"
    });

    closeModal();
    renderCalendar();
    renderResourceList(); // unit yang baru dibooking hari ini bisa langsung hilang dari daftar tersedia

    const rangeText = startDate === endDate
      ? fmtDateLong(startDate)
      : `${fmtDateLong(startDate)} – ${fmtDateLong(endDate)}`;
    alert(`Pengajuan berhasil dikirim!\n\n${res.name} · ${rangeText}\n${start}–${end}\nNomor Surat: ${letterNumber || "-"}\nStatus: Menunggu persetujuan`);
  });

  // Recap modal: open/close
  document.getElementById("btnRecap").addEventListener("click", () => {
    closeSidebar(); // tutup sidebar mobile dulu kalau lagi terbuka
    openRecap();
  });
  document.getElementById("closeRecap").addEventListener("click", closeRecap);
  document.getElementById("recapOverlay").addEventListener("click", (e) => {
    if(e.target.id === "recapOverlay") closeRecap();
  });

  // Approval/Admin drawer: open/close
  document.getElementById("btnApproval").addEventListener("click", () => {
    closeSidebar(); // tutup sidebar mobile dulu kalau lagi terbuka
    openApproval();
  });
  document.getElementById("closeApproval").addEventListener("click", closeApproval);
  document.getElementById("approvalOverlay").addEventListener("click", (e) => {
    if(e.target.id === "approvalOverlay") closeApproval();
  });

  // Delegasi klik tombol Terima/Hapus di dalam daftar approval (daftar
  // di-render ulang secara dinamis, jadi listener dipasang di parent tetap).
  document.getElementById("approvalBody").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if(!btn) return;
    const bookingId = btn.dataset.id;
    const booking = BOOKINGS.find(b => b.id === bookingId);
    if(!booking) return;

    if(btn.dataset.action === "approve"){
      booking.status = "approved";
      renderApprovalList();
      renderCalendar();
      renderResourceList();
    } else if(btn.dataset.action === "delete"){
      const confirmed = confirm(`Hapus pengajuan ini?\n\n${booking.purpose}\nPemohon: ${booking.requester}\n\nTindakan ini tidak dapat dibatalkan.`);
      if(confirmed){
        const idx = BOOKINGS.findIndex(b => b.id === bookingId);
        if(idx !== -1) BOOKINGS.splice(idx, 1);
        renderApprovalList();
        renderCalendar();
        renderResourceList();
      }
    }
  });

  // ===== LOGIN OPTIONS =====
  // Catatan: ini adalah prototype frontend tanpa backend/OAuth sungguhan.
  // Google & Microsoft butuh integrasi OAuth nyata (client ID, redirect, dst)
  // yang hanya bisa berjalan di server sungguhan — jadi di sini ditampilkan
  // sebagai placeholder yang jujur, bukan pura-pura berhasil login.
  document.getElementById("btnLoginGoogle").addEventListener("click", () => {
    alert("Login dengan Google memerlukan integrasi OAuth di backend.\n\nIni adalah tampilan prototype — hubungkan ke Google Identity Services saat backend sudah siap.");
  });
  document.getElementById("btnLoginMicrosoft").addEventListener("click", () => {
    alert("Login dengan Microsoft memerlukan integrasi OAuth (Azure AD/Entra ID) di backend.\n\nIni adalah tampilan prototype — hubungkan ke Microsoft Identity Platform saat backend sudah siap.");
  });

  // Login Email: ini bisa disimulasikan di sisi frontend karena tidak butuh
  // redirect ke provider luar — submit akan mengganti identitas user yang
  // tampil di topbar & sidebar, supaya tetap ada feedback nyata buat demo.
  function openLoginEmail(){
    document.getElementById("loginEmailOverlay").classList.add("open");
  }
  function closeLoginEmail(){
    document.getElementById("loginEmailOverlay").classList.remove("open");
    document.getElementById("loginEmailForm").reset();
  }
  document.getElementById("btnLoginEmail").addEventListener("click", () => {
    closeSidebar();
    openLoginEmail();
  });
  document.getElementById("closeLoginEmail").addEventListener("click", closeLoginEmail);
  document.getElementById("cancelLoginEmail").addEventListener("click", closeLoginEmail);
  document.getElementById("loginEmailOverlay").addEventListener("click", (e) => {
    if(e.target.id === "loginEmailOverlay") closeLoginEmail();
  });
  document.getElementById("loginEmailForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmailInput").value;
    // Ambil bagian sebelum @ sebagai nama tampilan sederhana, dan inisial
    // dua huruf pertama untuk avatar — supaya UI user-info terasa "hidup".
    const namePart = email.split("@")[0].replace(/[._]/g, " ");
    const displayName = namePart.replace(/\b\w/g, c => c.toUpperCase());
    const initials = displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

    document.querySelectorAll(".user-name").forEach(el => el.textContent = displayName);
    document.querySelectorAll(".user-email").forEach(el => el.textContent = email);
    document.querySelectorAll(".user-avatar").forEach(el => el.textContent = initials);

    closeLoginEmail();
    alert(`Berhasil masuk sebagai ${displayName}.`);
  });

  // Recap filters — live update tabel begitu filter diganti
  ["recapStatusFilter","recapMonthFilter"].forEach(id => {
    document.getElementById(id).addEventListener("change", renderRecapTable);
  });

  // Ordering: klik header kolom untuk sort — klik lagi pada kolom yang sama
  // membalik arah (asc <-> desc), klik kolom lain mulai dari asc.
  document.querySelectorAll(".sort-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.sort;
      if(recapSortKey === key){
        recapSortDir = recapSortDir === "asc" ? "desc" : "asc";
      } else {
        recapSortKey = key;
        recapSortDir = "asc";
      }
      renderRecapTable();
    });
  });

  // Export ke Excel
  document.getElementById("btnExportExcel").addEventListener("click", exportRecapToExcel);
});
