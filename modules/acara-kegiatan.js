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
// 1. PEMUATAN DATA REALTIME UNTUK PENGUMUMAN (TAB 1)
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
        <div class="info-empty-card">
          <p class="empty-text-italic">Belum ada pengumuman.</p>
        </div>
      `;
      return;
    }

    const selectedWilayah = filterSelect ? filterSelect.value : "Semua Wilayah";
    renderInfoList(snapshot, selectedWilayah);

    // Event Listener untuk Filter Dropdown Wilayah
    if (filterSelect) {
      filterSelect.onchange = (e) => {
        renderInfoList(snapshot, e.target.value);
      };
    }
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

    // Filter berdasarkan Target Wilayah
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
        <input type="checkbox" class="event-checkbox">
        <div class="event-meta-info" style="width: 100%;">
          <h3 class="event-title-text">${item.judul || 'Tanpa Judul'}</h3>
          <span class="event-subtitle-text">${item.isi || '-'}</span>
          <span class="event-status-label">${item.kategori || 'Pengumuman'} • ${item.targetWilayah || 'Semua Wilayah'} • ${tglFormatted}</span>
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
      <div class="info-empty-card">
        <p class="empty-text-italic">Belum ada pengumuman untuk wilayah ini.</p>
      </div>
    `;
  }

  // Handle Hapus Info
  document.querySelectorAll(".btn-delete-info").forEach(btn => {
    btn.onclick = async (e) => {
      const id = e.target.getAttribute("data-id");
      if (confirm("Hapus pengumuman ini?")) {
        await deleteDoc(doc(db, "informasi", id));
      }
    };
  });

  // Handle Toggle Status Info
  document.querySelectorAll(".toggle-status-info").forEach(toggle => {
    toggle.onchange = async (e) => {
      const id = e.target.getAttribute("data-id");
      await updateDoc(doc(db, "informasi", id), {
        aktif: e.target.checked
      });
    };
  });
}

// ==========================================
// 2. PEMUATAN DATA REALTIME UNTUK EVENT (TAB 2)
// ==========================================
export function loadEventsRealtime() {
  const containerList = document.getElementById("container-event-list");
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

      card.innerHTML = `
        <div class="event-card-left">
          <input type="checkbox" class="event-checkbox">
          <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=200'}" alt="${item.judul || 'Event'}" class="event-thumb">
          <div class="event-meta-info">
            <h3 class="event-title-text">${item.judul || 'Tanpa Judul'}</h3>
            <span class="event-subtitle-text">${item.deskripsi || '-'}</span>
            <span class="event-status-label">Status</span>
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

    // Handle Hapus Event
    document.querySelectorAll(".btn-delete-event").forEach(btn => {
      btn.onclick = async (e) => {
        const id = e.target.getAttribute("data-id");
        if (confirm("Hapus agenda kegiatan ini?")) {
          await deleteDoc(doc(db, "events", id));
        }
      };
    });

    // Handle Toggle Status Event
    document.querySelectorAll(".toggle-status-event").forEach(toggle => {
      toggle.onchange = async (e) => {
        const id = e.target.getAttribute("data-id");
        await updateDoc(doc(db, "events", id), {
          aktif: e.target.checked
        });
      };
    });
  });
}

// ==========================================
// 3. INISIALISASI MODUL & FORM SUBMIT
// ==========================================
export function initAcaraModule() {
  loadInformasiRealtime();
  loadEventsRealtime();

  // --- FORM SUBMIT INFORMASI BARU ---
  const formInfo = document.getElementById("form-tambah-informasi");
  if (formInfo) {
    formInfo.onsubmit = async (e) => {
      e.preventDefault();

      const judul = document.getElementById("info-judul")?.value.trim();
      const targetWilayah = document.getElementById("info-wilayah")?.value;
      const kategori = document.getElementById("info-kategori")?.value;
      const tglWaktu = document.getElementById("info-tgl-waktu")?.value;
      const isi = document.getElementById("info-isi")?.value.trim();

      if (!judul || !isi || !tglWaktu) {
        alert("Judul, Tanggal/Waktu, dan Isi Pengumuman wajib diisi!");
        return;
      }

      try {
        await addDoc(collection(db, "informasi"), {
          judul,
          targetWilayah: targetWilayah || "Semua Wilayah (RT / RW)",
          kategori: kategori || "Pengumuman",
          tglWaktu,
          isi,
          aktif: true,
          createdAt: new Date().toISOString()
        });

        alert("Pengumuman berhasil dipublikasikan!");
        formInfo.reset();

        const modalInfo = document.getElementById("modal-tambah-informasi");
        if (modalInfo) modalInfo.classList.remove("active");

      } catch (err) {
        console.error("Gagal menambahkan pengumuman:", err);
        alert("Gagal mempublikasikan pengumuman: " + err.message);
      }
    };
  }

  // --- UPLOAD GAMBAR PREVIEW UNTUK EVENT ---
  const btnTriggerFile = document.getElementById("btn-trigger-file");
  const inputFile = document.getElementById("input-file-gambar");
  const fileNameDisplay = document.getElementById("file-name-display");
  const imgPreview = document.getElementById("img-preview");
  const previewText = document.getElementById("preview-text");

  if (btnTriggerFile && inputFile) {
    btnTriggerFile.onclick = () => inputFile.click();
  }

  if (inputFile) {
    inputFile.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (fileNameDisplay) fileNameDisplay.innerText = file.name;
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (imgPreview) {
            imgPreview.src = ev.target.result;
            imgPreview.style.display = "block";
          }
          if (previewText) previewText.style.display = "none";
        };
        reader.readAsDataURL(file);
      }
    };
  }

  // --- FORM SUBMIT EVENT BARU ---
  const formEvent = document.getElementById("form-tambah-event");
  if (formEvent) {
    formEvent.onsubmit = async (e) => {
      e.preventDefault();

      const nama = document.getElementById("event-nama")?.value.trim();
      const deskripsi = document.getElementById("event-deskripsi")?.value.trim();

      if (!nama) {
        alert("Nama event wajib diisi!");
        return;
      }

      try {
        await addDoc(collection(db, "events"), {
          judul: nama,
          deskripsi: deskripsi || "",
          imageUrl: imgPreview && imgPreview.style.display !== "none" ? imgPreview.src : "",
          tanggal: new Date().toISOString(),
          aktif: true,
          createdAt: new Date().toISOString()
        });

        alert("Event berhasil disimpan!");
        formEvent.reset();

        if (imgPreview) imgPreview.style.display = "none";
        if (previewText) previewText.style.display = "block";
        if (fileNameDisplay) fileNameDisplay.innerText = "Tidak ada yang dipilih";

        const modalEvent = document.getElementById("modal-tambah-event");
        if (modalEvent) modalEvent.classList.remove("active");

      } catch (err) {
        console.error("Gagal menambahkan event:", err);
        alert("Gagal menyimpan event: " + err.message);
      }
    };
  }
}