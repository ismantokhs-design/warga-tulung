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

let unsubscribeNotulen = null;

// ==========================================
// 1. PEMUATAN DATA REALTIME NOTULEN RAPAT
// ==========================================
export function loadNotulenRealtime() {
  const container = document.getElementById("container-notulen-list");
  if (!container) return;

  const notulenRef = collection(db, "notulen_rapat");
  const q = query(notulenRef, orderBy("createdAt", "desc"));

  if (unsubscribeNotulen) unsubscribeNotulen();

  unsubscribeNotulen = onSnapshot(q, (snapshot) => {
    container.innerHTML = "";

    if (snapshot.empty) {
      container.innerHTML = `
        <div style="background: #fff; border-radius: 14px; padding: 24px; text-align: center; color: #94A3B8; font-size: 12px; font-style: italic; border: 1px solid #E2E8F0;">
          Belum ada catatan notulen rapat yang disimpan.
        </div>
      `;
      return;
    }

    snapshot.forEach((docSnap) => {
      const item = docSnap.data();
      const notulenId = docSnap.id;

      let tglFormatted = "-";
      if (item.tanggal) {
        const d = new Date(item.tanggal);
        tglFormatted = d.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric"
        });
      }

      const card = document.createElement("div");
      card.className = "notulen-card";

      card.innerHTML = `
        <div class="notulen-card-header">
          <h3 class="notulen-card-title">${item.agenda || "Tanpa Agenda"}</h3>
          <span class="notulen-badge-tgl">${tglFormatted}</span>
        </div>

        <div class="notulen-meta">
          <div class="notulen-meta-item">
            <span>📍 ${item.lokasi || "Balai RT"}</span>
          </div>
          <div class="notulen-meta-item">
            <span>👤 ${item.pemimpin || "Pengurus"}</span>
          </div>
        </div>

        <div class="notulen-isi">${item.isi || "-"}</div>

        <div class="notulen-actions">
          <button type="button" class="btn-action-icon btn-edit-notulen" data-id="${notulenId}" data-agenda="${item.agenda || ''}" data-tgl="${item.tanggal || ''}" data-lokasi="${item.lokasi || ''}" data-pemimpin="${item.pemimpin || ''}" data-isi="${item.isi || ''}">✏️ Edit</button>
          <button type="button" class="btn-action-icon btn-delete-notulen" data-id="${notulenId}" style="color: #EF4444;">🗑️ Hapus</button>
        </div>
      `;

      container.appendChild(card);
    });
  }, (err) => {
    console.error("Gagal memuat notulen rapat:", err);
  });
}

// ==========================================
// 2. INISIALISASI MODUL & EVENT LISTENERS
// ==========================================
export function initNotulenModule() {
  loadNotulenRealtime();

  const modal = document.getElementById("modal-notulen");
  const form = document.getElementById("form-notulen-rapat");
  const docIdInput = document.getElementById("notulen-doc-id");

  // BUKA MODAL TAMBAH
  document.addEventListener("click", (e) => {
    const btnOpen = e.target.closest("#btn-open-modal-notulen");
    if (btnOpen && modal) {
      if (form) form.reset();
      if (docIdInput) docIdInput.value = "";
      document.getElementById("modal-notulen-title").innerText = "Tambah Notulen Rapat";
      modal.classList.add("active");
    }

    // TUTUP MODAL
    const btnClose = e.target.closest("#btn-close-modal-notulen");
    if (btnClose && modal) {
      modal.classList.remove("active");
    }

    // HAPUS NOTULEN
    const btnDelete = e.target.closest(".btn-delete-notulen");
    if (btnDelete) {
      const id = btnDelete.getAttribute("data-id");
      if (confirm("Apakah Anda yakin ingin menghapus notulen rapat ini?")) {
        deleteDoc(doc(db, "notulen_rapat", id));
      }
    }

    // EDIT NOTULEN
    const btnEdit = e.target.closest(".btn-edit-notulen");
    if (btnEdit && modal) {
      if (docIdInput) docIdInput.value = btnEdit.getAttribute("data-id");
      document.getElementById("notulen-agenda").value = btnEdit.getAttribute("data-agenda");
      document.getElementById("notulen-tgl").value = btnEdit.getAttribute("data-tgl");
      document.getElementById("notulen-lokasi").value = btnEdit.getAttribute("data-lokasi");
      document.getElementById("notulen-pemimpin").value = btnEdit.getAttribute("data-pemimpin");
      document.getElementById("notulen-isi").value = btnEdit.getAttribute("data-isi");

      document.getElementById("modal-notulen-title").innerText = "Edit Notulen Rapat";
      modal.classList.add("active");
    }
  });

  // SUBMIT FORM (TAMBAH / EDIT)
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();

      const editId = docIdInput ? docIdInput.value : "";
      const agenda = document.getElementById("notulen-agenda").value.trim();
      const tanggal = document.getElementById("notulen-tgl").value;
      const lokasi = document.getElementById("notulen-lokasi").value.trim();
      const pemimpin = document.getElementById("notulen-pemimpin").value.trim();
      const isi = document.getElementById("notulen-isi").value.trim();

      try {
        if (editId) {
          await updateDoc(doc(db, "notulen_rapat", editId), {
            agenda,
            tanggal,
            lokasi: lokasi || "Balai RT",
            pemimpin: pemimpin || "Pengurus",
            isi,
            updatedAt: new Date().toISOString()
          });
          alert("Notulen rapat berhasil diperbarui!");
        } else {
          await addDoc(collection(db, "notulen_rapat"), {
            agenda,
            tanggal,
            lokasi: lokasi || "Balai RT",
            pemimpin: pemimpin || "Pengurus",
            isi,
            createdAt: new Date().toISOString()
          });
          alert("Notulen rapat berhasil disimpan!");
        }

        form.reset();
        if (modal) modal.classList.remove("active");
      } catch (err) {
        console.error("Gagal menyimpan notulen:", err);
        alert("Terjadi kesalahan: " + err.message);
      }
    };
  }
}