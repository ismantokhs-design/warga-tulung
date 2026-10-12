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
  'profil-wilayah': 'profil-wilayah.html',
  'event': 'event.html',
  'acara-kegiatan': 'acara-kegiatan.html',
  'notulen-rapat': 'notulen-rapat.html',
  'pesan': 'pesan.html',
  'more': 'more.html',
  'admin-panel': 'kependudukan.html',
  'keuangan': 'keuangan.html',
  'laporan': 'laporan.html',
  'grafik': 'grafik.html',
  'pengaturan': 'pengaturan.html',
  'setting-user': 'setting-user.html'
};

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
        await initDynamicFormEvents(pageId);
      } else {
        console.error(`Gagal mengambil file ./pages/${pageFiles[pageId]}`);
      }
    } catch (err) {
      console.error(`Gagal memuat ${pageFiles[pageId]}:`, err);
    }
  } else {
    await initDynamicFormEvents(pageId);
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
async function initDynamicFormEvents(pageId) {
  // PROFIL RINGKASAN WARGA
  if (pageId === 'profil') {
    displayReadonlyProfilWilayah();
  }

  // EVENT WARGA
  if (pageId === 'event') {
    const publicContainer = document.getElementById('public-events-list') || document.getElementById('container-event-list');
    
    if (publicContainer) {
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, orderBy('createdAt', 'desc'));

      onSnapshot(q, (snapshot) => {
        publicContainer.innerHTML = '';

        if (snapshot.empty) {
          publicContainer.innerHTML = '<div class="event-empty-box">Belum ada kegiatan/event warga.</div>';
          return;
        }

        snapshot.forEach((docSnap) => {
          const item = docSnap.data();
          if (item.aktif === false) return;

          let tglFormatted = 'Tanggal tidak ditentukan';
          if (item.tanggal) {
            const d = new Date(item.tanggal);
            tglFormatted = d.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
          }

          const card = document.createElement('div');
          card.className = 'event-display-card';
          const defaultImg = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=600';

          card.innerHTML = `
            <img src="${item.imageUrl || defaultImg}" alt="${item.judul || 'Event'}" class="event-card-banner">
            <div class="event-card-body">
              <span class="event-card-date">${tglFormatted}</span>
              <h3 class="event-card-title">${item.judul || 'Tanpa Judul'}</h3>
              <p class="event-card-desc">${item.deskripsi || '-'}</p>
              <a href="javascript:void(0)" class="event-read-more">
                Baca selengkapnya 
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </a>
            </div>
          `;

          publicContainer.appendChild(card);
        });

        if (publicContainer.children.length === 0) {
          publicContainer.innerHTML = '<div class="event-empty-box">Belum ada event aktif.</div>';
        }
      }, (err) => {
        console.error("Gagal memuat event:", err);
      });
    }
  }

  // ACARA & KEGIATAN
  if (pageId === 'acara-kegiatan') {
    try {
      const mod = await import('./modules/acara-kegiatan.js');
      if (mod && typeof mod.initAcaraModule === 'function') {
        mod.initAcaraModule();
      }
    } catch (err) {
      console.error("Gagal memuat modul acara-kegiatan.js:", err);
    }
  }

  // NOTULEN RAPAT
  if (pageId === 'notulen-rapat') {
    try {
      const mod = await import('./modules/notulen-rapat.js');
      if (mod && typeof mod.initNotulenModule === 'function') {
        mod.initNotulenModule();
      }
    } catch (err) {
      console.error("Gagal memuat modul notulen-rapat.js:", err);
    }
  }

  // SETTING USER (KEAMANAN AKUN)
  if (pageId === 'setting-user') {
    try {
      const mod = await import('./modules/setting-user.js');
      if (mod && typeof mod.initSettingUserModule === 'function') {
        mod.initSettingUserModule();
      }
    } catch (err) {
      console.error("Gagal memuat modul setting-user.js:", err);
    }
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

  if (pageId === 'profil-wilayah') {
    initProfilWilayahModule();
  }
}

// 7. SWITCH PAGE GLOBAL
window.switchPage = async function(pageId, element) {
  await loadPageContent(pageId);

  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
    page.style.display = 'none';
  });

  document.querySelectorAll('.sidebar-item, .nav-item').forEach(item => {
    item.classList.remove('active');
  });

  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
    targetPage.style.display = 'block';
  }

  if (element) {
    element.classList.add('active');
  } else {
    const subPages = ['more', 'admin-panel', 'keuangan', 'laporan', 'grafik', 'pengaturan', 'setting-user', 'profil-wilayah', 'acara-kegiatan', 'notulen-rapat'];
    if (subPages.includes(pageId)) {
      const activeMore = document.getElementById('nav-more-link');
      if (activeMore) activeMore.classList.add('active');
    }
  }

  const mainContainer = document.querySelector('.main-content');
  if (mainContainer) {
    mainContainer.scrollTop = 0;
  }
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

// 9b. LISTEN NOTULEN RAPAT TERBARU BERANDA (REALTIME FIRESTORE)
function listenNotulenTerbaruBeranda() {
  const container = document.getElementById("beranda-notulen-card-container");
  if (!container) return;

  const notulenRef = collection(db, "notulen_rapat");
  const q = query(notulenRef, orderBy("createdAt", "desc"), limit(1));

  onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      container.innerHTML = `
        <p style="color: #94A3B8; font-style: italic; font-size: 13px; margin: 0;">
          Belum ada catatan notulen rapat.
        </p>
      `;
      return;
    }

    snapshot.forEach((docSnap) => {
      const item = docSnap.data();

      let tglText = "-";
      if (item.tanggal) {
        const d = new Date(item.tanggal);
        tglText = d.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric"
        });
      }

      container.innerHTML = `
        <div class="info-badges-row">
          <span class="badge-wilayah">📍 ${item.lokasi || 'Balai RT'}</span>
          <span class="badge-category" style="background:#F1F5F9; color:#475569;">👤 ${item.pemimpin || 'Pengurus'}</span>
          
          <div class="info-time-text">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>${tglText}</span>
          </div>
        </div>

        <h3 class="info-item-title">${item.agenda || 'Tanpa Agenda'}</h3>
        <p class="info-item-desc" style="white-space: pre-line;">${item.isi || '-'}</p>
      `;
    });
  });
}

// 10. LISTEN AUTH STATUS
onAuthStateChanged(auth, async (user) => {
  if (user) {
    document.getElementById("login-overlay").style.display = "none";
    document.getElementById("app-container").style.display = "flex";

    listenInformasiTerbaruBeranda();
    listenNotulenTerbaruBeranda();

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const nama = userData.nama || "Pengguna";
      document.getElementById("user-name").innerText = "Selamat datang, " + nama;
      document.getElementById("user-location").innerText = userData.rt_rw || "RT 03 / RW 05";

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
    }

    const navMoreLink = document.getElementById("nav-more-link");
    if (navMoreLink) {
      navMoreLink.classList.remove("hidden");
    }

  } else {
    await loadLoginPage();
    clearLoginForm();
    document.getElementById("login-overlay").style.display = "flex";
    document.getElementById("app-container").style.display = "none";
  }
});

// 11. LOGOUT & DELEGATION KLIK GLOBAL
document.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("click", async (e) => {
    if (e.target && (e.target.id === "btn-logout" || e.target.closest("#btn-logout"))) {
      await signOut(auth);
      clearLoginForm();
    }
  });

  const bottomNav = document.querySelector(".bottom-nav");
  if (bottomNav) {
    bottomNav.addEventListener("click", (e) => {
      const navItem = e.target.closest(".nav-item");
      if (!navItem) return;

      if (navItem.id === "nav-more-link") {
        e.preventDefault();
        window.switchPage('more', navItem);
      }
    });
  }
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