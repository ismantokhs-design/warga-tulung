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
  onSnapshot 
} from "./firebase-config.js";

const pageFiles = {
  'more': 'more.html',
  'admin-panel': 'kependudukan.html',
  'pengaturan': 'pengaturan.html',
  'setting-user': 'setting-user.html',
  'profil-wilayah': 'profil-wilayah.html'
};

let globalUsersList = [];

// 1. LOAD KONTEN HALAMAN DINAMIS VIA FETCH
async function loadPageContent(pageId) {
  const container = document.getElementById(pageId);
  
  if (container && pageFiles[pageId] && container.getAttribute("data-loaded") !== "true") {
    try {
      const res = await fetch(`./pages/${pageFiles[pageId]}`);
      if (res.ok) {
        container.innerHTML = await res.text();
        container.setAttribute("data-loaded", "true");
        initDynamicFormEvents(pageId);
      } else {
        console.error(`Gagal mengambil file ./pages/${pageFiles[pageId]}`);
      }
    } catch (err) {
      console.error(`Gagal memuat ${pageFiles[pageId]}:`, err);
    }
  }
}

// 2. LOAD LOGIN OVERLAY
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

// 3. RESET FORM LOGIN
function clearLoginForm() {
  const formLogin = document.getElementById("form-login");
  const inputPassword = document.getElementById("login-password");
  const eyeIcon = document.getElementById("eye-icon");
  const errorMsg = document.getElementById("login-error-msg");

  if (formLogin) formLogin.reset();
  if (errorMsg) errorMsg.classList.add("hidden");

  if (inputPassword && eyeIcon) {
    inputPassword.type = "password";
    eyeIcon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
  }
}

// 4. EVENT LOGIN & SHOW/HIDE PASSWORD
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
          ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
          : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
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
            errorText.innerText = "Email atau kata sandi salah. Silakan periksa kembali.";
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
          btnSubmit.innerText = "Masuk Aplikasi";
        }
      }
    });
  }
}

// 5. INISIALISASI EVENT DYNAMIC PAGES
function initDynamicFormEvents(pageId) {
  // A. KEPENDUDUKAN
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

  // B. SETTING USER
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

  // C. PROFIL WILAYAH
  if (pageId === 'profil-wilayah') {
    loadProfilWilayahData();

    const formWilayah = document.getElementById("form-profil-wilayah");
    if (formWilayah) {
      formWilayah.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("btn-simpan-profil");
        if (btn) btn.innerText = "Menyimpan...";

        try {
          await setDoc(doc(db, "profil", "wilayah"), {
            rt: document.getElementById("wilayah-rt").value,
            rw: document.getElementById("wilayah-rw").value,
            desa: document.getElementById("wilayah-desa").value,
            kecamatan: document.getElementById("wilayah-kecamatan").value,
            alamat: document.getElementById("wilayah-alamat").value,
            updatedAt: new Date()
          }, { merge: true });

          alert("Profil Wilayah berhasil disimpan!");
        } catch (err) {
          alert("Gagal menyimpan profil: " + err.message);
        } finally {
          if (btn) btn.innerText = "Simpan Ke Firestore";
        }
      });
    }
  }
}

// 6. SWITCH PAGE GLOBAL
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
};

// 7. REGISTER SERVICE WORKER
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW Tulung Berhasil:', reg.scope))
      .catch(err => console.error('SW Tulung Gagal:', err));
  });
}

// 8. LISTEN AUTH
onAuthStateChanged(auth, async (user) => {
  if (user) {
    document.getElementById("login-overlay").style.display = "none";
    document.getElementById("app-container").style.display = "block";

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      document.getElementById("user-name").innerText = "Selamat datang, " + userData.nama;
      document.getElementById("user-location").innerText = userData.rt_rw;

      const userRole = (userData.role || "warga").toLowerCase();
      const navMoreLink = document.getElementById("nav-more-link");

      if (userRole === "admin" || userRole === "pengurus") {
        navMoreLink.classList.remove("hidden");
        navMoreLink.style.display = "flex";
      } else {
        navMoreLink.classList.add("hidden");
        navMoreLink.style.display = "none";
      }
    }
  } else {
    await loadLoginPage();
    clearLoginForm();
    document.getElementById("login-overlay").style.display = "flex";
    document.getElementById("app-container").style.display = "none";
  }
});

// 9. LOGOUT
document.addEventListener("DOMContentLoaded", () => {
  const btnLogout = document.getElementById("btn-logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      await signOut(auth);
      clearLoginForm();
    });
  }
});

// 10. LOAD USER KEPENDUDUKAN
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

// 11. LOAD USER SETTING USER
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

// 12. LOAD PROFIL WILAYAH
async function loadProfilWilayahData() {
  try {
    const docSnap = await getDoc(doc(db, "profil", "wilayah"));
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (document.getElementById("wilayah-rt")) document.getElementById("wilayah-rt").value = data.rt || "";
      if (document.getElementById("wilayah-rw")) document.getElementById("wilayah-rw").value = data.rw || "";
      if (document.getElementById("wilayah-desa")) document.getElementById("wilayah-desa").value = data.desa || "";
      if (document.getElementById("wilayah-kecamatan")) document.getElementById("wilayah-kecamatan").value = data.kecamatan || "";
      if (document.getElementById("wilayah-alamat")) document.getElementById("wilayah-alamat").value = data.alamat || "";
    }
  } catch (err) {
    console.error("Gagal membaca profil wilayah:", err);
  }
}

// 13. STATISTIK
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