import { 
  db, 
  doc, 
  getDoc, 
  setDoc 
} from "../firebase-config.js";

/**
 * Menampilkan Toast Notification mengambang yang smooth & profesional
 */
function showToast(message, isError = false) {
  const toast = document.getElementById("toast-profil-wilayah");
  const toastMsg = document.getElementById("toast-message");

  if (toast && toastMsg) {
    toastMsg.innerText = message;
    
    if (isError) {
      toast.classList.add("error");
    } else {
      toast.classList.remove("error");
    }

    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  } else {
    console.log(`[Toast ${isError ? 'Error' : 'Success'}]: ${message}`);
  }
}

/**
 * Membuat Template Baris Input RT Baru (Repeater Element)
 */
function createRtInputRow(rtData = {}) {
  const container = document.createElement("div");
  container.className = "rt-item-card";
  
  container.innerHTML = `
    <div class="rt-item-header">
      <span class="rt-item-title">Data Pengurus RT</span>
      <button type="button" class="btn-remove-rt">Hapus</button>
    </div>

    <div class="form-group-custom">
      <label>NOMOR RT</label>
      <input type="text" class="input-custom rt-nomor" placeholder="Contoh: RT 01" value="${rtData.nomor_rt || ''}" required>
    </div>

    <div class="form-group-custom">
      <label>KETUA RT</label>
      <input type="text" class="input-custom rt-ketua" placeholder="Nama Ketua RT" value="${rtData.ketua || ''}">
    </div>

    <div class="grid-two-col">
      <div class="form-group-custom">
        <label>SEKRETARIS</label>
        <input type="text" class="input-custom rt-sekretaris" placeholder="Nama Sekretaris" value="${rtData.sekretaris || ''}">
      </div>

      <div class="form-group-custom">
        <label>BENDAHARA</label>
        <input type="text" class="input-custom rt-bendahara" placeholder="Nama Bendahara" value="${rtData.bendahara || ''}">
      </div>
    </div>
  `;

  // Event Listener untuk Tombol Hapus Baris RT
  container.querySelector(".btn-remove-rt").addEventListener("click", () => {
    container.remove();
  });

  return container;
}

/**
 * Membaca data Profil Wilayah & Struktur Organisasi dari Firestore (Form Input)
 */
export async function loadProfilWilayahData() {
  try {
    const docRef = doc(db, "profil", "wilayah");
    const docSnap = await getDoc(docRef);

    const listRtContainer = document.getElementById("container-list-rt");
    if (listRtContainer) listRtContainer.innerHTML = "";

    if (docSnap.exists()) {
      const data = docSnap.data();

      // Set value identitas wilayah
      if (document.getElementById("wilayah-pedukuhan")) document.getElementById("wilayah-pedukuhan").value = data.pedukuhan || "";
      if (document.getElementById("wilayah-desa")) document.getElementById("wilayah-desa").value = data.desa || "";
      if (document.getElementById("wilayah-kecamatan")) document.getElementById("wilayah-kecamatan").value = data.kecamatan || "";
      if (document.getElementById("wilayah-kabupaten")) document.getElementById("wilayah-kabupaten").value = data.kabupaten || "";
      if (document.getElementById("wilayah-provinsi")) document.getElementById("wilayah-provinsi").value = data.provinsi || "";
      if (document.getElementById("wilayah-kodepos")) document.getElementById("wilayah-kodepos").value = data.kode_pos || "";
      if (document.getElementById("wilayah-deskripsi")) document.getElementById("wilayah-deskripsi").value = data.deskripsi || "";

      // Set value Dukuh (Nama & Kontak)
      if (document.getElementById("dukuh-nama")) document.getElementById("dukuh-nama").value = data.dukuh?.nama || "";
      if (document.getElementById("dukuh-kontak")) document.getElementById("dukuh-kontak").value = data.dukuh?.kontak || "";

      // Render daftar RT jika ada
      if (data.daftar_rt && Array.isArray(data.daftar_rt) && listRtContainer) {
        data.daftar_rt.forEach(rt => {
          listRtContainer.appendChild(createRtInputRow(rt));
        });
      }
    }

    // Jika daftar RT kosong, berikan 1 baris default
    if (listRtContainer && listRtContainer.children.length === 0) {
      listRtContainer.appendChild(createRtInputRow({ nomor_rt: "RT 01" }));
    }
  } catch (err) {
    console.error("Gagal membaca Profil Wilayah dari Firestore:", err);
  }
}

/**
 * Membaca & Menampilkan data Profil Wilayah untuk Halaman Profil Readonly (pages/profil.html)
 */
export async function displayReadonlyProfilWilayah() {
  try {
    const docRef = doc(db, "profil", "wilayah");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      const pedukuhan = data.pedukuhan || "-";
      const desa = data.desa || "-";
      const kecamatan = data.kecamatan || "-";
      const kabupaten = data.kabupaten || "-";
      const provinsi = data.provinsi || "-";
      const kodePos = data.kode_pos || "-";
      const deskripsi = data.deskripsi || "Belum ada deskripsi profil wilayah yang ditambahkan.";

      // Header & Banner
      if (document.getElementById("view-pedukuhan")) {
        document.getElementById("view-pedukuhan").innerText = "Pedukuhan " + pedukuhan;
      }
      if (document.getElementById("view-desa-kecamatan")) {
        document.getElementById("view-desa-kecamatan").innerText = `${desa}, ${kecamatan}, ${kabupaten}`;
      }

      // Rincian Administrasi
      if (document.getElementById("val-pedukuhan")) document.getElementById("val-pedukuhan").innerText = pedukuhan;
      if (document.getElementById("val-desa")) document.getElementById("val-desa").innerText = desa;
      if (document.getElementById("val-kecamatan")) document.getElementById("val-kecamatan").innerText = kecamatan;
      if (document.getElementById("val-kabupaten")) document.getElementById("val-kabupaten").innerText = kabupaten;
      if (document.getElementById("val-provinsi")) document.getElementById("val-provinsi").innerText = provinsi;
      if (document.getElementById("val-kodepos")) document.getElementById("val-kodepos").innerText = kodePos;
      if (document.getElementById("val-deskripsi")) document.getElementById("val-deskripsi").innerText = deskripsi;

      // Render Nama & Kontak Dukuh pada Diagram Struktur
      if (document.getElementById("val-dukuh-nama")) {
        document.getElementById("val-dukuh-nama").innerText = data.dukuh?.nama || "-";
      }
      if (document.getElementById("val-dukuh-kontak")) {
        document.getElementById("val-dukuh-kontak").innerText = data.dukuh?.kontak || "-";
      }

      // Render Grid Tree RT pada Diagram Struktur
      const containerRt = document.getElementById("container-rt-tree");
      if (containerRt) {
        containerRt.innerHTML = "";
        
        if (data.daftar_rt && Array.isArray(data.daftar_rt) && data.daftar_rt.length > 0) {
          data.daftar_rt.forEach(rt => {
            const card = document.createElement("div");
            card.className = "org-node-rt";
            card.innerHTML = `
              <div class="rt-badge-header">${rt.nomor_rt || 'RT'}</div>
              <div class="rt-person-row">
                <div class="rt-person-label">Ketua RT</div>
                <div class="rt-person-val">${rt.ketua || '-'}</div>
              </div>
              <div class="rt-person-row">
                <div class="rt-person-label">Sekretaris</div>
                <div class="rt-person-val">${rt.sekretaris || '-'}</div>
              </div>
              <div class="rt-person-row">
                <div class="rt-person-label">Bendahara</div>
                <div class="rt-person-val">${rt.bendahara || '-'}</div>
              </div>
            `;
            containerRt.appendChild(card);
          });
        } else {
          containerRt.innerHTML = `<div style="font-size: 12px; color: #94A3B8; text-align: center; grid-column: 1 / -1;">Belum ada data RT yang ditambahkan.</div>`;
        }
      }
    }
  } catch (err) {
    console.error("Gagal memuat profil wilayah readonly:", err);
  }
}

/**
 * Menyimpan / memperbarui data Profil Wilayah & Struktur RT ke Firestore
 */
export async function saveProfilWilayahData(event) {
  event.preventDefault();

  const btnSimpan = document.getElementById("btn-simpan-profil");
  if (btnSimpan) {
    btnSimpan.disabled = true;
    btnSimpan.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 0.8s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2 a10 10 0 0 1 10 10"></path>
      </svg>
      Menyimpan...
    `;
  }

  // Mengambil data dari array dinamis RT
  const daftarRtPayload = [];
  const rtCards = document.querySelectorAll("#container-list-rt .rt-item-card");

  rtCards.forEach(card => {
    const nomorRt = card.querySelector(".rt-nomor")?.value.trim() || "";
    const ketua = card.querySelector(".rt-ketua")?.value.trim() || "";
    const sekretaris = card.querySelector(".rt-sekretaris")?.value.trim() || "";
    const bendahara = card.querySelector(".rt-bendahara")?.value.trim() || "";

    if (nomorRt) {
      daftarRtPayload.push({
        nomor_rt: nomorRt,
        ketua: ketua,
        sekretaris: sekretaris,
        bendahara: bendahara
      });
    }
  });

  const payload = {
    pedukuhan: document.getElementById("wilayah-pedukuhan")?.value.trim() || "",
    desa: document.getElementById("wilayah-desa")?.value.trim() || "",
    kecamatan: document.getElementById("wilayah-kecamatan")?.value.trim() || "",
    kabupaten: document.getElementById("wilayah-kabupaten")?.value.trim() || "",
    provinsi: document.getElementById("wilayah-provinsi")?.value.trim() || "",
    kode_pos: document.getElementById("wilayah-kodepos")?.value.trim() || "",
    deskripsi: document.getElementById("wilayah-deskripsi")?.value.trim() || "",
    dukuh: {
      nama: document.getElementById("dukuh-nama")?.value.trim() || "",
      kontak: document.getElementById("dukuh-kontak")?.value.trim() || ""
    },
    daftar_rt: daftarRtPayload,
    updatedAt: new Date()
  };

  try {
    const docRef = doc(db, "profil", "wilayah");
    await setDoc(docRef, payload, { merge: true });
    
    showToast("Profil Wilayah & Struktur RT berhasil disimpan!", false);
  } catch (err) {
    console.error("Gagal menyimpan Profil Wilayah:", err);
    showToast("Gagal menyimpan profil: " + err.message, true);
  } finally {
    if (btnSimpan) {
      btnSimpan.disabled = false;
      btnSimpan.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        Simpan Ke Firestore
      `;
    }
  }
}

/**
 * Inisialisasi event listener form Profil Wilayah
 */
export function initProfilWilayahModule() {
  loadProfilWilayahData();

  // Event handler untuk tombol "+ Tambah RT Baru"
  const btnTambahRt = document.getElementById("btn-tambah-rt");
  if (btnTambahRt) {
    btnTambahRt.onclick = () => {
      const container = document.getElementById("container-list-rt");
      if (container) {
        const nextRtIndex = container.children.length + 1;
        container.appendChild(createRtInputRow({ nomor_rt: `RT 0${nextRtIndex}` }));
      }
    };
  }

  // Event handler submit form
  const formWilayah = document.getElementById("form-profil-wilayah");
  if (formWilayah) {
    formWilayah.removeEventListener("submit", saveProfilWilayahData);
    formWilayah.addEventListener("submit", saveProfilWilayahData);
  }
}