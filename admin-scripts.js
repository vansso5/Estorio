import { initializeApp, getApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// إعداد Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBUeCV2eX3LgA1X3WcEMcsTIubXN1YlVl4",
  authDomain: "myestore-34f65.firebaseapp.com",
  databaseURL: "https://myestore-34f65-default-rtdb.firebaseio.com",
  projectId: "myestore-34f65",
  storageBucket: "myestore-34f65.appspot.com",
  messagingSenderId: "14078917211",
  appId: "1:14078917211:web:a48eab2a7396c094f7dd7e",
  measurementId: "G-9181DX0XNJ"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

const adminsList = document.getElementById('adminsList');

onAuthStateChanged(auth, user => {
  if(user) loadAdminsList();
  else window.location.href = 'admin-login.html';
});

// إضافة أدمن جديد
export async function addNewAdmin() {
  const email = document.getElementById('newAdminEmail').value;
  const password = document.getElementById('newAdminPass').value;
  if(!email || !password) return alert('يرجى ملء البيانات');
  if(password.length < 6) return alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');

  try {
    let secondaryApp;
    try { secondaryApp = getApp("Secondary"); } 
    catch { secondaryApp = initializeApp(firebaseConfig, "Secondary"); }
    const secondaryAuth = getAuth(secondaryApp);

    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const newUser = userCredential.user;

    await set(ref(database, 'admins/' + newUser.uid), {
      email: email,
      createdAt: Date.now()
    });

    await signOut(secondaryAuth);

    alert(`✅ تم إنشاء الأدمن بنجاح: ${email}`);
    document.getElementById('newAdminEmail').value = '';
    document.getElementById('newAdminPass').value = '';

  } catch (err) {
    alert("❌ خطأ: " + err.message);
    console.error(err);
  }
}

// تحميل قائمة الأدمن
function loadAdminsList() {
  const adminsRef = ref(database, 'admins');
  onValue(adminsRef, snapshot => {
    adminsList.innerHTML = '';
    if(snapshot.exists()) {
      const admins = snapshot.val();
      Object.entries(admins).forEach(([uid, data]) => {
        const isMe = auth.currentUser && uid === auth.currentUser.uid;
        const div = document.createElement('div');
        div.style = "background:#fff; padding:12px; border-radius:10px; border:1px solid #eee; display:flex; justify-content:space-between; align-items:center;";
        div.innerHTML = `
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="background:#e2e8f0; width:35px; height:35px; border-radius:50%; display:flex; align-items:center; justify-content:center;">👤</div>
            <div>
              <div style="font-weight:bold; color:#333;">${data.email}</div>
              <div style="font-size:0.8rem; color:#888;">ID: ${uid.slice(0,5)}...</div>
            </div>
          </div>
          ${isMe ? '<span style="color:green; font-weight:bold;">(أنت)</span>' : `<button onclick="removeAdmin('${uid}')" style="background:#fff0f0; color:#e53e3e; border:1px solid #feb2b2; padding:5px 12px; border-radius:6px; cursor:pointer;">حظر 🚫</button>`}
        `;
        adminsList.appendChild(div);
      });
    } else adminsList.innerHTML = '<p>لا يوجد مسؤولين.</p>';
  });
}

// حذف أدمن
export async function removeAdmin(uid) {
  if(confirm("⚠️ هل أنت متأكد من حظر هذا المسؤول؟")) {
    try { await remove(ref(database, 'admins/' + uid)); alert("تم الحذف"); }
    catch(err){ alert("خطأ: "+err.message); }
  }
}

// نشر الدوال للعناصر في HTML
window.addNewAdmin = addNewAdmin;
window.removeAdmin = removeAdmin;