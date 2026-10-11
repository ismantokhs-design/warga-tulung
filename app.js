import { 
  auth, 
  db, 
  secondaryAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  deleteDoc,
  collection, 
  onSnapshot,
  query,
  orderBy,
  limit
} from "./firebase-config.js";

import { 
  initProfilWilayahModule, 
  displayReadonlyProfilWilayah 
} from "./modules/profil-wilayah.js";

// PEMETAAN FILE HTML DALAM FOLDER PAGES
const pageFiles = {
  'profil': 'profil.html',
  'event': 'event.html',
  'pesan': 'pesan.html', // <-- DITAMBAHKAN AGAR HALAMAN PESAN DAPAT DIMUAT DINAMIS
  'more': 'more.html',
  'admin-panel': 'kependudukan.html',
  'keuangan': 'keuangan.html',
  'laporan': 'laporan.html',
  'grafik': 'grafik.html',
  'pengaturan': 'pengaturan.html',
  'setting-user': 'setting-user.html',
  'profil-wilayah': 'profil-wilayah.html'
};

let globalUsersList = [];

// 1. HANDLER DROPDOWN PROFILE & GANTI PASSWORD
window.toggleProfileDropdown = function(event) {
  event.stopPropagation();
  const dropdown = document.getElementById("profile-dropdown-menu");
  if (dropdown) {
    dropdown.classList.toggle("hidden");
  }
};

document.addEventListener("click", () => {
  const dropdown = document.getElementById("profile-dropdown-menu");
  if (dropdown && !dropdown.classList.contains("hidden")) {
    dropdown.classList.add("hidden");
  }
});

window.openChangePasswordModal = function() {
  alert("Fitur Ganti Password dapat dihubungkan ke Firebase updatePassword.");
};

// 2. LOAD KONTEN DINAMIS DARI FOLDER PAGES
async function loadPageContent(pageId) {
  const container = document.getElementById(pageId);
  if (!container) return;

  if (pageFiles[pageId] && container.innerHTML.trim() === "") {
    try {
      const res = await fetch(`./pages/${pageFiles[pageId]}`);
      if (res.ok) {
        container.innerHTML = await res.text();
        initDynamicFormEvents(pageId);
      } else {
        console.error(`Gagal mengambil file ./pages/${pageFiles[pageId]}`);
      }
    } catch (err) {
      console.error(`Gagal memuat ${pageFiles[pageId]}:`, err);
    }
  } else if (container.innerHTML.trim() !== "") {
    // Jalankan ulang listener/render jika halaman sudah ada di DOM
    initDynamicFormEvents(pageId);
  }
}

// 3. LOAD LOGIN OVERLAY
async function loadLoginPage() {
  const loginOverlay = document.getElementById("login-overlay");
  if (loginOverlay && loginOverlay.innerHTML.trim() === "") {
    try {
      const res = await fetch("./pages/login.html");
      if (res.ok) {
        loginOverlay.innerHTML = await res.text();
        initLoginEvents();
      }
    } catch (err) {
      console.error("Gagal memuat login.html:", err);
    }
  }
}

// 4. RESET FORM LOGIN
function clearLoginForm() {
  const formLogin = document.getElementById("form-login");
  const inputPassword = document.getElementById("login-password");
  const eyeIcon = document.getElementById("eye-icon");
  const errorMsg = document.getElementById("login-error-msg");

  if (formLogin) formLogin.reset();
  if (errorMsg) errorMsg.classList.add("hidden");

  if (inputPassword && eyeIcon) {
    inputPassword.type = "password";
    eyeIcon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`;
  }
}

// 5. EVENT LOGIN & TOGGLE PASSWORD
function initLoginEvents() {
  const btnToggle = document.getElementById("btn-toggle-pass");
  if (btnToggle) {
    btnToggle.addEventListener("click", () => {
      const input = document.getElementById("login-password");
      const icon = document.getElementById("eye-icon");
      if (input && icon) {
        const isPass = input.type === "password";
        input.type = isPass ? "text" : "password";
        icon.innerHTML = isPass 
          ? `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`
          : `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`;
      }
    });
  }

  const formLogin = document.getElementById("form-login");
  const errorMsg = document.getElementById("login-error-msg");
  const errorText = document.getElementById("login-error-text");
  const btnSubmit = document.getElementById("btn-submit-login");
  const authCard = document.getElementById("auth-card-login");
  const inputEmail = document.getElementById("login-email");
  const inputPassword = document.getElementById("login-password");

  if (inputEmail && inputPassword) {
    const hideErrorOnType = () => {
      if (errorMsg && !errorMsg.classList.contains("hidden")) {
        errorMsg.classList.add("hidden");
      }
    };
    inputEmail.addEventListener("input", hideErrorOnType);
    inputPassword.addEventListener("input", hideErrorOnType);
  }

  if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const email = inputEmail.value.trim();
      const pass = inputPassword.value;

      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerText = "Memproses...";
      }

      if (errorMsg) errorMsg.classList.add("hidden");

      try {
        await signInWithEmailAndPassword(auth, email, pass);
      } catch (err) {
        if (errorMsg && errorText) {
          if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
            errorText.innerText = "Email atau kata sandi tidak sesuai. Silakan coba lagi.";
          } else if (err.code === "auth/too-many-requests") {
            errorText.innerText = "Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat.";
          } else {
            errorText.innerText = "Gagal masuk. Periksa koneksi internet Anda.";
          }
          errorMsg.classList.remove("hidden");
        }

        if (authCard) {
          authCard.classList.remove("shake-card");
          void authCard.offsetWidth;
          authCard.classList.add("shake-card");
        }

        if (inputPassword) {
          inputPassword.focus();
          inputPassword.select();
        }
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = `MASUK SISTEM <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left: 6px;"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`;
        }
      }
    });
  }
}

// 6. INISIALISASI EVENT DYNAMIC PAGES
function initDynamicFormEvents(pageId) {
  if (pageId === 'profil') {
    displayReadonlyProfilWilayah();
  }

  if (pageId === 'admin-panel') {
    const formRegister = document.getElementById("form-register-warga");
    if (formRegister) {
      formRegister.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nama = document.getElementById("reg-nama").value;
        const email = document.getElementById("reg-email").value;
        const pass = document.getElementById("reg-password").value;
        const rtrw = document.getElementById("reg-rtrw").value;
        const role = document.getElementById("reg-role").value;

        try {
          const res = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
          const newUser = res.user;

          await setDoc(doc(db, "users", newUser.uid), {
            uid: newUser.uid,
            nama: nama,
            email: email,
            rt_rw: rtrw,
            role: role,
            createdAt: new Date()
          });

          await signOut(secondaryAuth);
          alert("Berhasil mendaftarkan warga: " + nama);
          formRegister.reset();
        } catch (err) {
          alert("Gagal mendaftar warga: " + err.message);
        }
      });
    }
    loadUsersTable();
  }

  if (pageId === 'setting-user') {
    loadSettingUsersRealtime();

    const formAddUser = document.getElementById("form-setting-add-user");
    if (formAddUser) {
      formAddUser.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btnSubmit = document.getElementById("btn-submit-add-user");
        const editUid = document.getElementById("setting-user-edit-id").value;

        const nama = document.getElementById("setting-user-nama").value.trim();
        const email = document.getElementById("setting-user-email").value.trim();
        const pass = document.getElementById("setting-user-password").value;
        const rtrw = document.getElementById("setting-user-rtrw").value.trim();
        const role = document.getElementById("setting-user-role").value;

        if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.innerText = "Memproses...";
        }

        try {
          if (editUid) {
            await updateDoc(doc(db, "users", editUid), {
              nama: nama,
              email: email,
              rt_rw: rtrw,
              role: role,
              updatedAt: new Date()
            });
            alert("Data pengguna berhasil diperbarui!");
            resetUserForm();
          } else {
            const res = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
            const newUser = res.user;

            await setDoc(doc(db, "users", newUser.uid), {
              uid: newUser.uid,
              nama: nama,
              email: email,
              rt_rw: rtrw,
              role: role,
              createdAt: new Date()
            });

            await signOut(secondaryAuth);
            alert("Berhasil menambahkan pengguna baru: " + nama);
            resetUserForm();
          }
        } catch (err) {
          alert("Gagal memproses pengguna: " + err.message);
        } finally {
          if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerText = editUid ? "Simpan Perubahan" : "Tambah User Baru";
          }
        }
      });
    }

    const searchInput = document.getElementById("search-setting-user");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const keyword = e.target.value.toLowerCase();
        const filtered = globalUsersList.filter(u => 
          (u.nama && u.nama.toLowerCase().includes(keyword)) || 
          (u.email && u.email.toLowerCase().includes(keyword))
        );
        renderSettingUsersTable(filtered);
      });
    }
  }

  if (pageId === 'profil-wilayah') {
    initProfilWilayahModule();
  }
}

// 7. SWITCH PAGE GLOBAL
window.switchPage = async function(pageId, element) {
  await loadPageContent(pageId);

  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  
  const targetPage = document.getElementById(pageId);
  if (targetPage) targetPage.classList.add('active');

  if (element) {
    element.classList.add('active');
  } else {
    const moreNav = document.getElementById('nav-more-link');
    const subPages = ['more', 'admin-panel', 'keuangan', 'laporan', 'grafik', 'pengaturan', 'setting-user', 'profil-wilayah'];
    if (moreNav && subPages.includes(pageId)) {
      moreNav.classList.add('active');
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 8. REGISTER SERVICE WORKER
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW Tulung Berhasil:', reg.scope))
      .catch(err => console.error('SW Tulung Gagal:', err));
  });
}

// 9. LISTEN INFORMASI TERBARU BERANDA (REALTIME FIRESTORE)
function listenInformasiTerbaruBeranda() {
  const container = document.getElementById("beranda-info-card-container");
  if (!container) return;

  const infoRef = collection(db, "informasi");
  const q = query(infoRef, orderBy("createdAt", "desc"), limit(1));

  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      container.innerHTML = `
        <p style="color: #94A3B8; font-style: italic; font-size: 13px; margin: 0;">
          Belum ada informasi wilayah terbaru.
        </p>
      `;
      return;
    }

    snapshot.forEach((docSnap) => {
      const item = docSnap.data();

      let tglText = "-";
      if (item.tglWaktu) {
        const d = new Date(item.tglWaktu);
        tglText = d.toLocaleString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }) + " WIB";
      }

      container.innerHTML = `
        <div class="info-badges-row">
          <span class="badge-category">${item.kategori || 'Pengumuman'}</span>
          <span class="badge-wilayah">${item.targetWilayah || 'Semua Wilayah'}</span>
          
          <div class="info-time-text">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>${tglText}</span>
          </div>
        </div>

        <h3 class="info-item-title">${item.judul || 'Tanpa Judul'}</h3>
        <p class="info-item-desc">${item.isi || '-'}</p>
      `;
    });
  });
}

// 10. LISTEN AUTH STATUS
onAuthStateChanged(auth, async (user) => {
  if (user) {
    document.getElementById("login-overlay").style.display = "none";
    document.getElementById("app-container").style.display = "block";

    // JALANKAN LISTENER PAPAN INFORMASI BERANDA
    listenInformasiTerbaruBeranda();

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const nama = userData.nama || "Pengguna";
      document.getElementById("user-name").innerText = "Selamat datang, " + nama;

      try {
        const wilayahDoc = await getDoc(doc(db, "profil", "wilayah"));
        if (wilayahDoc.exists()) {
          const dataW = wilayahDoc.data();
          const desaName = dataW.desa ? `Desa ${dataW.desa}` : "";
          const userRtRw = userData.rt_rw || "";
          
          const lokasiLengkap = [userRtRw, desaName].filter(Boolean).join(", ");
          document.getElementById("user-location").innerText = lokasiLengkap || (userData.rt_rw || "RT 03 / RW 05");
        } else {
          document.getElementById("user-location").innerText = userData.rt_rw || "RT 03 / RW 05";
        }
      } catch (err) {
        console.error("Gagal memuat profil wilayah untuk header:", err);
        document.getElementById("user-location").innerText = userData.rt_rw || "RT 03 / RW 05";
      }

      const initials = nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      if (document.getElementById("user-avatar-initials")) {
        document.getElementById("user-avatar-initials").innerText = initials || "PE";
      }
      if (document.getElementById("dropdown-user-name")) {
        document.getElementById("dropdown-user-name").innerText = nama;
      }
      if (document.getElementById("dropdown-user-role")) {
        document.getElementById("dropdown-user-role").innerText = userData.role || "Warga";
      }

      const userRole = (userData.role || "warga").toLowerCase();
      const navMoreLink = document.getElementById("nav-more-link");

      if (navMoreLink) {
        if (userRole === "admin" || userRole === "pengurus") {
          navMoreLink.classList.remove("hidden");
        } else {
          navMoreLink.classList.add("hidden");
        }
      }
    }
  } else {
    await loadLoginPage();
    clearLoginForm();
    document.getElementById("login-overlay").style.display = "flex";
    document.getElementById("app-container").style.display = "none";
  }
});

// 11. LOGOUT
document.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("click", async (e) => {
    if (e.target && (e.target.id === "btn-logout" || e.target.closest("#btn-logout"))) {
      await signOut(auth);
      clearLoginForm();
    }
  });
});

// 12. LOAD USER KEPENDUDUKAN
function loadUsersTable() {
  const usersRef = collection(db, "users");
  onSnapshot(usersRef, (snapshot) => {
    const tbody = document.getElementById("users-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const user = docSnap.data();
      let badgeClass = "badge-warga";
      const roleLower = (user.role || "warga").toLowerCase();

      if (roleLower === "admin") badgeClass = "badge-admin";
      else if (roleLower === "pengurus") badgeClass = "badge-pengurus";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${user.nama || "-"}</strong></td>
        <td>${user.email || "-"}</td>
        <td>${user.rt_rw || "-"}</td>
        <td><span class="badge-role ${badgeClass}">${user.role || "warga"}</span></td>
      `;
      tbody.appendChild(tr);
    });
  });
}

// 13. LOAD USER SETTING USER
function loadSettingUsersRealtime() {
  const usersRef = collection(db, "users");
  onSnapshot(usersRef, (snapshot) => {
    globalUsersList = [];
    snapshot.forEach((docSnap) => {
      globalUsersList.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderSettingUsersTable(globalUsersList);
  });
}

function renderSettingUsersTable(users) {
  const tbody = document.getElementById("setting-users-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center">Pengguna tidak ditemukan.</td></tr>`;
    return;
  }

  users.forEach((user) => {
    let badgeClass = "badge-warga";
    const roleLower = (user.role || "warga").toLowerCase();
    if (roleLower === "admin") badgeClass = "badge-admin";
    else if (roleLower === "pengurus") badgeClass = "badge-pengurus";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <strong>${user.nama || "Tanpa Nama"}</strong><br>
        <span style="font-size: 11px; color: var(--text-muted);">${user.email || "-"}</span><br>
        <span style="font-size: 10px; color: var(--text-muted);">${user.rt_rw || "-"}</span>
      </td>
      <td>
        <span class="badge-role ${badgeClass}">${user.role || "warga"}</span>
      </td>
      <td style="text-align: center; white-space: nowrap;">
        <button type="button" class="btn-edit-user" data-id="${user.id}" style="background: #3b82f6; color: white; border: none; padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; margin-right: 4px;">Edit</button>
        <button type="button" class="btn-delete-user" data-id="${user.id}" data-nama="${user.nama || 'User'}" style="background: #ef4444; color: white; border: none; padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer;">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll(".btn-edit-user").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const uid = e.target.getAttribute("data-id");
      const targetUser = globalUsersList.find(u => u.id === uid);
      if (!targetUser) return;

      document.getElementById("setting-user-edit-id").value = uid;
      document.getElementById("setting-user-nama").value = targetUser.nama || "";
      document.getElementById("setting-user-email").value = targetUser.email || "";
      document.getElementById("setting-user-rtrw").value = targetUser.rt_rw || "";
      document.getElementById("setting-user-role").value = targetUser.role || "warga";

      document.getElementById("form-user-title").innerText = "Edit Data Pengguna";
      document.getElementById("form-user-desc").innerText = "Perbarui informasi pengguna yang dipilih.";
      document.getElementById("btn-submit-add-user").innerText = "Simpan Perubahan";
      document.getElementById("group-user-password").style.display = "none";
      document.getElementById("btn-cancel-edit-user").classList.remove("hidden");

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  document.querySelectorAll(".btn-delete-user").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const uid = e.target.getAttribute("data-id");
      const nama = e.target.getAttribute("data-nama");

      if (confirm(`Apakah Anda yakin ingin menghapus data pengguna "${nama}" dari Firestore?`)) {
        try {
          await deleteDoc(doc(db, "users", uid));
          alert("Pengguna berhasil dihapus.");
        } catch (err) {
          alert("Gagal menghapus pengguna: " + err.message);
        }
      }
    });
  });
}

document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "btn-cancel-edit-user") {
    resetUserForm();
  }
});

function resetUserForm() {
  const form = document.getElementById("form-setting-add-user");
  if (form) form.reset();

  const editId = document.getElementById("setting-user-edit-id");
  if (editId) editId.value = "";

  const title = document.getElementById("form-user-title");
  if (title) title.innerText = "Tambah Pengguna Baru";

  const desc = document.getElementById("form-user-desc");
  if (desc) desc.innerText = "Entri akun baru untuk warga atau pengurus RT/RW.";

  const btnSubmit = document.getElementById("btn-submit-add-user");
  if (btnSubmit) btnSubmit.innerText = "Tambah User Baru";

  const passGroup = document.getElementById("group-user-password");
  if (passGroup) passGroup.style.display = "block";

  const btnCancel = document.getElementById("btn-cancel-edit-user");
  if (btnCancel) btnCancel.classList.add("hidden");
}

// 14. STATISTIK
const statRef = doc(db, "kependudukan", "statistik");
onSnapshot(statRef, (docSnap) => {
  if (docSnap.exists()) {
    const data = docSnap.data();
    const totalJiwa = document.getElementById("stat-total-jiwa");
    const totalKK = document.getElementById("stat-kk");
    if (totalJiwa) totalJiwa.innerText = data.total_jiwa || 0;
    if (totalKK) totalKK.innerText = data.total_kk || 0;
  }
});