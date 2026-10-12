import { 
  db, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  onSnapshot, 
  query, 
  orderBy 
} from "../firebase-config.js";

let unsubscribeEvents = null;
let unsubscribeInfo = null;

// ==========================================
// 1. PEMUATAN DATA REALTIME UNTUK PENGUMUMAN (TAB INFO)
// ==========================================
export function loadInformasiRealtime() {
  const containerInfo = document.getElementById("container-info-list");
  const filterSelect = document.getElementById("filter-wilayah-info");
  if (!containerInfo) return;

  const infoRef = collection(db, "informasi");
  const q = query(infoRef, orderBy("createdAt", "desc"));

  if (unsubscribeInfo) unsubscribeInfo();

  unsubscribeInfo = onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      containerInfo.innerHTML = `
        <div class="info-empty-card" style="text-align: center; padding: 20px; color: #94A3B8;">
          <p class="empty-text-italic">Belum ada pengumuman.</p>
        </div>
      `;
      return;
    }

    const selectedWilayah = filterSelect ? filterSelect.value : "Semua Wilayah";
    renderInfoList(snapshot, selectedWilayah);

    if (filterSelect) {
      filterSelect.onchange = (e) => {
        renderInfoList(snapshot, e.target.value);
      };
    }
  }, (err) => {
    console.error("Gagal memuat data informasi:", err);
  });
}

function renderInfoList(snapshot, filterWilayah) {
  const containerInfo = document.getElementById("container-info-list");
  if (!containerInfo) return;

  containerInfo.innerHTML = "";

  let count = 0;
  snapshot.forEach((docSnap) => {
    const item = docSnap.data();
    const infoId = docSnap.id;

    if (filterWilayah !== "Semua Wilayah" && item.targetWilayah && !item.targetWilayah.includes(filterWilayah)) {
      return;
    }

    count++;
    const card = document.createElement("div");
    card.className = "event-card-item";
    card.style.marginBottom = "12px";

    const tglFormatted = item.tglWaktu ? new Date(item.tglWaktu).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

    card.innerHTML = `
      <div class="event-card-left" style="flex: 1;">
        <div class="event-meta-info" style="width: 100%;">
          <h3 class="event-title-text">${item.judul || 'Tanpa Judul'}</h3>
          <span class="event-subtitle-text">${item.isi || '-'}</span>
          <span class="event-status-label" style="font-size: 11px; color: #64748B;">${item.kategori || 'Pengumuman'} • ${item.targetWilayah || 'Semua Wilayah'} • ${tglFormatted}</span>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <label class="switch-toggle">
          <input type="checkbox" class="toggle-status-info" data-id="${infoId}" ${item.aktif !== false ? 'checked' : ''}>
          <span class="slider-toggle"></span>
        </label>
        <button type="button" class="btn-delete-info" data-id="${infoId}" style="background:none; border:none; color:#ef4444; font-size:16px; cursor:pointer;">🗑️</button>
      </div>
    `;

    containerInfo.appendChild(card);
  });

  if (count === 0) {
    containerInfo.innerHTML = `
      <div class="info-empty-card" style="text-align: center; padding: 20px; color: #94A3B8;">
        <p class="empty-text-italic">Belum ada pengumuman untuk wilayah ini.</p>
      </div>
    `;
  }
}

// ==========================================
// 2. PEMUATAN DATA REALTIME UNTUK EVENT (TAB EVENT)
// ==========================================
export function loadEventsRealtime() {
  // Hanya mencari container khusus event di dalam modul pengurus
  const containerList = document.getElementById("container-kegiatan-list") || document.getElementById("container-event-list");
  if (!containerList) return;

  const eventsRef = collection(db, "events");
  const q = query(eventsRef, orderBy("createdAt", "desc"));

  if (unsubscribeEvents) unsubscribeEvents();

  unsubscribeEvents = onSnapshot(q, (snapshot) => {
    containerList.innerHTML = "";

    if (snapshot.empty) {
      containerList.innerHTML = `
        <div class="event-empty-state" style="text-align: center; padding: 30px; color: #64748B;">
          Belum ada agenda kegiatan warga yang ditambahkan.
        </div>
      `;
      return;
    }

    snapshot.forEach((docSnap) => {
      const item = docSnap.data();
      const eventId = docSnap.id;

      const card = document.createElement("div");
      card.className = "event-card-item";
      card.style.cssText = "background: #fff; padding: 12px; border-radius: 12px; margin-bottom: 10px; border: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center;";

      const tglFormatted = item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

      card.innerHTML = `
        <div class="event-card-left" style="display: flex; gap: 12px; align-items: center;">
          <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=200'}" alt="${item.judul || 'Event'}" class="event-thumb" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover;">
          <div class="event-meta-info">
            <h3 class="event-title-text" style="font-size: 14px; font-weight: 700; color: #0F172A; margin: 0;">${item.judul || 'Tanpa Judul'}</h3>
            <span class="event-subtitle-text" style="font-size: 12px; color: #64748B; display: block; margin-top: 2px;">${item.deskripsi || '-'}</span>
            <span class="event-status-label" style="font-size: 10px; color: #00875A; font-weight: 600;">${tglFormatted}</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <label class="switch-toggle">
            <input type="checkbox" class="toggle-status-event" data-id="${eventId}" ${item.aktif !== false ? 'checked' : ''}>
            <span class="slider-toggle"></span>
          </label>
          <button type="button" class="btn-delete-event" data-id="${eventId}" style="background:none; border:none; color:#ef4444; font-size:16px; cursor:pointer;">🗑️</button>
        </div>
      `;

      containerList.appendChild(card);
    });
  }, (err) => {
    console.error("Gagal memuat data event:", err);
  });
}

// ==========================================
// 3. INISIALISASI MODUL & BINDING EVENTS
// ==========================================
export function initAcaraModule() {
  loadInformasiRealtime();
  loadEventsRealtime();

  // SWITCH TAB NAVIGASI KHUSUS DI ACARA-KEGIATAN.HTML
  const btnTabs = document.querySelectorAll(".tab-item, .tab-btn, [data-tab]");
  btnTabs.forEach((btn) => {
    btn.onclick = (e) => {
      e.preventDefault();
      const tabTarget = btn.getAttribute("data-tab") || (btn.innerText.trim().toLowerCase() === "event" ? "event" : "info");

      btnTabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const areaInfo = document.getElementById("tab-content-info") || document.getElementById("section-info");
      const areaEvent = document.getElementById("tab-content-event") || document.getElementById("section-event");
      const labelTittle = document.getElementById("title-kategori-aktif");
      const btnHeader = document.getElementById("btn-trigger-tambah");

      if (tabTarget === "event") {
        if (areaInfo) areaInfo.style.display = "none";
        if (areaEvent) areaEvent.style.display = "block";
        if (labelTittle) labelTittle.innerText = "Daftar Event / Kegiatan Aktif";
        if (btnHeader) {
          btnHeader.innerText = "+ Tambah Event";
          btnHeader.setAttribute("data-type", "event");
        }
      } else {
        if (areaInfo) areaInfo.style.display = "block";
        if (areaEvent) areaEvent.style.display = "none";
        if (labelTittle) labelTittle.innerText = "Daftar Pengumuman Aktif";
        if (btnHeader) {
          btnHeader.innerText = "+ Tambah Informasi";
          btnHeader.setAttribute("data-type", "info");
        }
      }
    };
  });

  // DELEGASI KLIK UNTUK HAPUS & MODAL
  document.addEventListener("click", async (e) => {
    const btnDeleteInfo = e.target.closest(".btn-delete-info");
    if (btnDeleteInfo) {
      const id = btnDeleteInfo.getAttribute("data-id");
      if (confirm("Hapus pengumuman ini?")) {
        await deleteDoc(doc(db, "informasi", id));
      }
      return;
    }

    const btnDeleteEvent = e.target.closest(".btn-delete-event");
    if (btnDeleteEvent) {
      const id = btnDeleteEvent.getAttribute("data-id");
      if (confirm("Hapus agenda kegiatan ini?")) {
        await deleteDoc(doc(db, "events", id));
      }
      return;
    }

    const btnTrigger = e.target.closest("#btn-trigger-tambah");
    if (btnTrigger) {
      const type = btnTrigger.getAttribute("data-type");
      if (type === "event") {
        const modalE = document.getElementById("modal-tambah-event");
        if (modalE) modalE.classList.add("active");
      } else {
        const modalI = document.getElementById("modal-tambah-informasi");
        if (modalI) modalI.classList.add("active");
      }
    }
  });

  // TOGGLE STATUS LISTENER
  document.addEventListener("change", async (e) => {
    if (e.target.classList.contains("toggle-status-info")) {
      const id = e.target.getAttribute("data-id");
      await updateDoc(doc(db, "informasi", id), { aktif: e.target.checked });
    }
    if (e.target.classList.contains("toggle-status-event")) {
      const id = e.target.getAttribute("data-id");
      await updateDoc(doc(db, "events", id), { aktif: e.target.checked });
    }
  });
}