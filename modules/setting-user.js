import { 
  db, 
  secondaryAuth, 
  createUserWithEmailAndPassword, 
  signOut, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  onSnapshot 
} from "../firebase-config.js";

let globalUsersList = [];
let unsubscribeUsers = null;

// ==========================================
// 1. PEMUATAN DATA REALTIME USER
// ==========================================
export function loadSettingUsersRealtime() {
  const usersRef = collection(db, "users");

  if (unsubscribeUsers) unsubscribeUsers();

  unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
    globalUsersList = [];
    snapshot.forEach((docSnap) => {
      globalUsersList.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderSettingUsersTable(globalUsersList);
  }, (err) => {
    console.error("Gagal memuat data pengguna:", err);
  });
}

function renderSettingUsersTable(users) {
  const tbody = document.getElementById("setting-users-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #94A3B8;">Pengguna tidak ditemukan.</td></tr>`;
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
        <span style="font-size: 11px; color: #64748B;">${user.email || "-"}</span><br>
        <span style="font-size: 10px; color: #94A3B8;">${user.rt_rw || "-"}</span>
      </td>
      <td>
        <span class="badge-role ${badgeClass}">${user.role || "warga"}</span>
      </td>
      <td style="text-align: center; white-space: nowrap;">
        <button type="button" class="btn-edit-user" data-id="${user.id}" style="background: #3B82F6; color: white; border: none; padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; margin-right: 4px;">Edit</button>
        <button type="button" class="btn-delete-user" data-id="${user.id}" data-nama="${user.nama || 'User'}" style="background: #EF4444; color: white; border: none; padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer;">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // LISTEN BUKA MODAL EDIT USER
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

      const modalUser = document.getElementById("modal-setting-user");
      if (modalUser) modalUser.classList.add("active");
    });
  });

  // LISTEN HAPUS USER
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

// ==========================================
// 2. RESET FORM POPUP MODAL
// ==========================================
export function resetUserForm() {
  const form = document.getElementById("form-setting-add-user");
  if (form) form.reset();

  const editId = document.getElementById("setting-user-edit-id");
  if (editId) editId.value = "";

  const title = document.getElementById("form-user-title");
  if (title) title.innerText = "Tambah Pengguna Baru";

  const desc = document.getElementById("form-user-desc");
  if (desc) desc.innerText = "Entri akun baru untuk warga atau pengurus RT/RW.";

  const btnSubmit = document.getElementById("btn-submit-add-user");
  if (btnSubmit) btnSubmit.innerText = "Simpan User";

  const passGroup = document.getElementById("group-user-password");
  if (passGroup) passGroup.style.display = "block";
}

// ==========================================
// 3. INISIALISASI MODUL & EVENT LISTENERS
// ==========================================
export function initSettingUserModule() {
  loadSettingUsersRealtime();

  const modalUser = document.getElementById("modal-setting-user");

  // BUKA MODAL TAMBAH USER / TUTUP MODAL
  document.addEventListener("click", (e) => {
    const btnOpen = e.target.closest("#btn-open-modal-user");
    if (btnOpen && modalUser) {
      resetUserForm();
      modalUser.classList.add("active");
    }

    const btnCancel = e.target.closest("#btn-cancel-edit-user") || e.target.classList.contains("modal-user-overlay");
    if (btnCancel && modalUser) {
      modalUser.classList.remove("active");
    }
  });

  // SUBMIT FORM TAMBAH / EDIT USER
  const formAddUser = document.getElementById("form-setting-add-user");
  if (formAddUser) {
    formAddUser.onsubmit = async (e) => {
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
            updatedAt: new Date().toISOString()
          });
          alert("Data pengguna berhasil diperbarui!");
        } else {
          const res = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
          const newUser = res.user;

          await setDoc(doc(db, "users", newUser.uid), {
            uid: newUser.uid,
            nama: nama,
            email: email,
            rt_rw: rtrw,
            role: role,
            createdAt: new Date().toISOString()
          });

          await signOut(secondaryAuth);
          alert("Berhasil menambahkan pengguna baru: " + nama);
        }

        resetUserForm();
        if (modalUser) modalUser.classList.remove("active");

      } catch (err) {
        alert("Gagal memproses pengguna: " + err.message);
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerText = editUid ? "Simpan Perubahan" : "Simpan User";
        }
      }
    };
  }

  // EVENT PENCARIAN USER
  const searchInput = document.getElementById("search-setting-user");
  if (searchInput) {
    searchInput.oninput = (e) => {
      const keyword = e.target.value.toLowerCase();
      const filtered = globalUsersList.filter(u => 
        (u.nama && u.nama.toLowerCase().includes(keyword)) || 
        (u.email && u.email.toLowerCase().includes(keyword))
      );
      renderSettingUsersTable(filtered);
    };
  }
}