import { db } from "../firebase-config.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. FUNGSI UTAMA INISIALISASI MODULE (Untuk Profil Wilayah Admin)
export async function initProfilWilayahModule() {
  const form = document.getElementById("form-profil-wilayah");
  const btnTambahRt = document.getElementById("btn-tambah-rt");

  // Load data awal dari Firestore untuk form admin
  await loadProfilWilayahData();

  // Event Listener Tambah Baris RT
  if (btnTambahRt) {
    btnTambahRt.removeEventListener("click", addRtRow);
    btnTambahRt.addEventListener("click", addRtRow);
  }

  // Event Listener Submit Form
  if (form) {
    form.removeEventListener("submit", handleSimpanProfil);
    form.addEventListener("submit", handleSimpanProfil);
  }
}

// 2. LOAD DATA DARI FIRESTORE DENGAN PENGAMAN (ANTI-CRASH)
export async function loadProfilWilayahData() {
  try {
    const docRef = doc(db, "profil", "wilayah");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // Mengisi field input secara aman (menggunakan helper anti-crash)
      setInputValue("wilayah-pedukuhan", data.pedukuhan || "");
      setInputValue("wilayah-desa", data.desa || "");
      setInputValue("wilayah-kecamatan", data.kecamatan || "");
      setInputValue("wilayah-kabupaten", data.kabupaten || "");
      setInputValue("wilayah-provinsi", data.provinsi || "");
      setInputValue("wilayah-kodepos", data.kodepos || "");
      setInputValue("wilayah-deskripsi", data.deskripsi || "");

      setInputValue("dukuh-nama", data.dukuh_nama || "");
      setInputValue("dukuh-kontak", data.dukuh_kontak || "");

      // Render daftar RT jika ada
      const containerRt = document.getElementById("container-list-rt");
      if (containerRt) {
        containerRt.innerHTML = "";
        if (Array.isArray(data.daftar_rt) && data.daftar_rt.length > 0) {
          data.daftar_rt.forEach((rt) => addRtRow(null, rt));
        } else {
          addRtRow();
        }
      }
    } else {
      const containerRt = document.getElementById("container-list-rt");
      if (containerRt && containerRt.children.length === 0) {
        addRtRow();
      }
    }
  } catch (err) {
    console.error("Gagal memuat data Profil Wilayah dari Firestore:", err);
  }
}

// 3. FUNGSI TAMBAH BARIS RT DINAMIS
function addRtRow(e = null, rtData = { rt: "", ketua: "", kontak: "" }) {
  if (e) e.preventDefault();

  const container = document.getElementById("container-list-rt");
  if (!container) return;

  const rtIndex = container.children.length + 1;
  const card = document.createElement("div");
  card.className = "rt-item-card";

  card.innerHTML = `
    <div class="rt-item-header">
      <span class="rt-item-title">DATA RT #${rtIndex}</span>
      <button type="button" class="btn-remove-rt">Hapus</button>
    </div>
    <div class="grid-two-col">
      <div class="form-group-custom">
        <label>NOMOR RT</label>
        <input type="text" class="input-custom input-rt-nomor" placeholder="Contoh: RT 01" value="${rtData.rt || ''}">
      </div>
      <div class="form-group-custom">
        <label>NAMA KETUA RT</label>
        <input type="text" class="input-custom input-rt-ketua" placeholder="Nama Ketua RT" value="${rtData.ketua || ''}">
      </div>
    </div>
    <div class="form-group-custom">
      <label>KONTAK KETUA RT (WA)</label>
      <input type="text" class="input-custom input-rt-kontak" placeholder="0812..." value="${rtData.kontak || ''}">
    </div>
  `;

  // Event hapus baris
  const btnRemove = card.querySelector(".btn-remove-rt");
  if (btnRemove) {
    btnRemove.addEventListener("click", () => {
      card.remove();
      updateRtTitles();
    });
  }

  container.appendChild(card);
}

// Update nomor urut judul RT setelah ada yang dihapus
function updateRtTitles() {
  const container = document.getElementById("container-list-rt");
  if (!container) return;
  const cards = container.querySelectorAll(".rt-item-card");
  cards.forEach((card, index) => {
    const title = card.querySelector(".rt-item-title");
    if (title) title.innerText = `DATA RT #${index + 1}`;
  });
}

// 4. HANDLER SIMPAN KE FIRESTORE
async function handleSimpanProfil(e) {
  e.preventDefault();

  const btnSubmit = document.getElementById("btn-simpan-profil");
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Menyimpan...";
  }

  try {
    const daftarRt = [];
    const containerRt = document.getElementById("container-list-rt");
    if (containerRt) {
      const cards = containerRt.querySelectorAll(".rt-item-card");
      cards.forEach((card) => {
        const nomor = card.querySelector(".input-rt-nomor")?.value || "";
        const ketua = card.querySelector(".input-rt-ketua")?.value || "";
        const kontak = card.querySelector(".input-rt-kontak")?.value || "";
        if (nomor || ketua) {
          daftarRt.push({ rt: nomor, ketua: ketua, kontak: kontak });
        }
      });
    }

    const payload = {
      pedukuhan: getInputValue("wilayah-pedukuhan"),
      desa: getInputValue("wilayah-desa"),
      kecamatan: getInputValue("wilayah-kecamatan"),
      kabupaten: getInputValue("wilayah-kabupaten"),
      provinsi: getInputValue("wilayah-provinsi"),
      kodepos: getInputValue("wilayah-kodepos"),
      deskripsi: getInputValue("wilayah-deskripsi"),
      dukuh_nama: getInputValue("dukuh-nama"),
      dukuh_kontak: getInputValue("dukuh-kontak"),
      daftar_rt: daftarRt,
      updatedAt: new Date()
    };

    await setDoc(doc(db, "profil", "wilayah"), payload, { merge: true });

    updateHeaderLocationText(payload.desa);

    showToast("Profil Wilayah berhasil disimpan!");
  } catch (err) {
    console.error("Gagal menyimpan profil wilayah:", err);
    showToast("Gagal menyimpan data: " + err.message, true);
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        <span>Simpan Ke Firestore</span>
      `;
    }
  }
}

// HELPER DEDIKASI UNTUK UPDATE LOKASI HEADER
function updateHeaderLocationText(desaName) {
  const userLocEl = document.getElementById("user-location");
  if (userLocEl && desaName) {
    const currentText = userLocEl.innerText;
    const parts = currentText.split(",");
    const rtRwPart = parts[0] ? parts[0].trim() : "RT 03 / RW 05";
    userLocEl.innerText = `${rtRwPart}, Desa ${desaName}`;
  }
}

// 5. HELPER UTILITY (ANTI NULL-POINTER & ANTI-CRASH)
function setInputValue(id, val) {
  const el = document.getElementById(id);
  if (el) {
    el.value = val;
  }
}

function getInputValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function setTextContent(id, text) {
  const el = document.getElementById(id);
  if (el) {
    el.innerText = text;
  }
}

function showToast(msg, isError = false) {
  const toast = document.getElementById("toast-profil-wilayah");
  const toastMsg = document.getElementById("toast-message");

  if (toast && toastMsg) {
    toastMsg.innerText = msg;
    if (isError) toast.classList.add("error");
    else toast.classList.remove("error");

    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  } else {
    alert(msg);
  }
}

// 6. DISPLAY READONLY UNTUK HALAMAN RINGKASAN WARGA (pages/profil.html)
export async function displayReadonlyProfilWilayah() {
  try {
    const docRef = doc(db, "profil", "wilayah");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // 1. Banner Utama
      const pedukuhanText = data.pedukuhan ? `Pedukuhan ${data.pedukuhan}` : "Pedukuhan -";
      const desaKecText = [
        data.desa ? `Desa ${data.desa}` : "",
        data.kecamatan ? `Kec. ${data.kecamatan}` : ""
      ].filter(Boolean).join(", ");

      setTextContent("view-pedukuhan", pedukuhanText);
      setTextContent("view-desa-kecamatan", desaKecText || "-");

      // 2. Data Dukuh
      setTextContent("val-dukuh-nama", data.dukuh_nama || "-");
      setTextContent("val-dukuh-kontak", data.dukuh_kontak ? `WA: ${data.dukuh_kontak}` : "-");

      // 3. Detail Wilayah Administrasi
      setTextContent("val-pedukuhan", data.pedukuhan || "-");
      setTextContent("val-desa", data.desa || "-");
      setTextContent("val-kecamatan", data.kecamatan || "-");
      setTextContent("val-kabupaten", data.kabupaten || "-");
      setTextContent("val-provinsi", data.provinsi || "-");
      setTextContent("val-kodepos", data.kodepos || "-");
      setTextContent("val-deskripsi", data.deskripsi || "Belum ada deskripsi profil wilayah yang ditambahkan.");

      // 4. Diagram Structure RT
      const containerRt = document.getElementById("container-rt-tree");
      if (containerRt) {
        containerRt.innerHTML = "";
        if (Array.isArray(data.daftar_rt) && data.daftar_rt.length > 0) {
          data.daftar_rt.forEach((rt) => {
            const rtCard = document.createElement("div");
            rtCard.className = "org-node-rt";
            rtCard.innerHTML = `
              <span class="rt-badge-header">${rt.rt || 'RT -'}</span>
              <div class="rt-person-row">
                <div class="rt-person-label">Ketua RT</div>
                <div class="rt-person-val">${rt.ketua || '-'}</div>
              </div>
              <div class="rt-person-row">
                <div class="rt-person-label">Kontak</div>
                <div class="rt-person-val">${rt.kontak || '-'}</div>
              </div>
            `;
            containerRt.appendChild(rtCard);
          });
        } else {
          containerRt.innerHTML = `
            <div style="font-size: 11px; color: #94A3B8; text-align: center; grid-column: 1 / -1;">
              Belum ada data RT yang terdaftar.
            </div>
          `;
        }
      }
    }
  } catch (err) {
    console.error("Gagal memuat profil wilayah readonly:", err);
  }
}