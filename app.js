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
  onSnapshot 
} from "./firebase-config.js";

// 1. EVENT LISTENER TOGGLE SHOW PASSWORD
document.addEventListener("DOMContentLoaded", () => {
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
});

// 2. NAVIGASI HALAMAN
window.switchPage = function(pageId, element) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  
  const targetPage = document.getElementById(pageId);
  if (targetPage) targetPage.classList.add('active');

  if (element) {
    element.classList.add('active');
  } else {
    // Jika ganti ke sub-halaman (seperti admin-panel) dari menu More
    const moreNav = document.getElementById('nav-more-link');
    if (moreNav && (pageId === 'more' || pageId === 'admin-panel')) {
      moreNav.classList.add('active');
    }
  }
};

// 3. REGISTER SERVICE WORKER (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW Tulung Berhasil:', reg.scope))
      .catch(err => console.error('SW Tulung Gagal:', err));
  });
}

// 4. LISTEN STATUS AUTH & ROLE CHECKING
onAuthStateChanged(auth, async (user) => {
  if (user) {
    document.getElementById("login-overlay").style.display = "none";
    document.getElementById("app-container").style.display = "block";

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      document.getElementById("user-name").innerText = "Selamat datang, " + userData.nama;
      document.getElementById("user-location").innerText = userData.rt_rw;

      // CEK ROLE (ADMIN / PENGURUS DIBERIKAN AKSES MENU LAINNYA)
      const userRole = (userData.role || "warga").toLowerCase();
      const navMoreLink = document.getElementById("nav-more-link");

      if (userRole === "admin" || userRole === "pengurus") {
        navMoreLink.classList.remove("hidden");
        navMoreLink.style.display = "flex";
        loadUsersTable();
      } else {
        navMoreLink.classList.add("hidden");
        navMoreLink.style.display = "none";
      }
    }
  } else {
    document.getElementById("login-overlay").style.display = "flex";
    document.getElementById("app-container").style.display = "none";
  }
});

// 5. PROSES LOGIN
document.getElementById("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const pass = document.getElementById("login-password").value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    alert("Gagal masuk: " + err.message);
  }
});

// 6. PROSES LOGOUT
document.getElementById("btn-logout").addEventListener("click", () => signOut(auth));

// 7. PENDAFTARAN WARGA OLEH ADMIN / PENGURUS
document.getElementById("form-register-warga").addEventListener("submit", async (e) => {
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
    document.getElementById("form-register-warga").reset();
  } catch (err) {
    alert("Gagal mendaftar warga: " + err.message);
  }
});

// 8. AMBIL TABEL USERS REALTIME
function loadUsersTable() {
  const usersRef = collection(db, "users");
  onSnapshot(usersRef, (snapshot) => {
    const tbody = document.getElementById("users-table-body");
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

// 9. AMBIL STATISTIK REALTIME
const statRef = doc(db, "kependudukan", "statistik");
onSnapshot(statRef, (docSnap) => {
  if (docSnap.exists()) {
    const data = docSnap.data();
    document.getElementById("stat-total-jiwa").innerText = data.total_jiwa || 0;
    document.getElementById("stat-kk").innerText = data.total_kk || 0;
  }
});