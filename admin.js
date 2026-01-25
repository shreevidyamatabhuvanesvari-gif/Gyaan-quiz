/* =========================================================
   ADMIN.JS – REAL KNOWLEDGE BUILDER
   Environment:
   - Chrome / Android Browser
   - GitHub Pages
   - Mobile Network
   - LocalStorage
   ========================================================= */

const KEY = "KNOWLEDGE_DB";

/* ===== STATE ===== */
let editIndex = null;

/* ===== ELEMENTS ===== */
const qEl    = document.getElementById("q");
const optsEl = document.getElementById("opts");
const ansEl  = document.getElementById("ans");
const expEl  = document.getElementById("exp");
const listEl = document.getElementById("list");

/* ===== STORAGE HELPERS ===== */
function loadData() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

/* ===== SAVE / UPDATE ITEM ===== */
function saveItem() {
  const q = qEl.value.trim();
  const opts = optsEl.value
    .split("\n")
    .map(o => o.trim())
    .filter(o => o !== "");

  const ans = parseInt(ansEl.value.trim(), 10);
  const exp = expEl.value.trim();

  if (!q) {
    alert("प्रश्न खाली है");
    return;
  }

  if (opts.length < 2) {
    alert("कम से कम 2 विकल्प होने चाहिए");
    return;
  }

  if (isNaN(ans) || ans < 0 || ans >= opts.length) {
    alert("सही उत्तर का index गलत है");
    return;
  }

  const data = loadData();
  const item = { q, opts, ans, exp };

  if (editIndex !== null) {
    data[editIndex] = item;
    editIndex = null;
  } else {
    data.push(item);
  }

  saveData(data);
  clearForm();
  renderList();
}

/* ===== RENDER LIST ===== */
function renderList() {
  const data = loadData();
  listEl.innerHTML = "";

  if (data.length === 0) {
    listEl.innerHTML = "<p>कोई ज्ञान सेव नहीं है</p>";
    return;
  }

  data.forEach((d, i) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <b>${d.q}</b>
      <div style="font-size:14px;margin:4px 0;">
        ✔ सही उत्तर: ${d.opts[d.ans] || ""}
      </div>
      <div class="actions">
        <button class="upd" onclick="editItem(${i})">✏️ Edit</button>
        <button class="del" onclick="deleteItem(${i})">❌ Delete</button>
      </div>
    `;

    listEl.appendChild(card);
  });
}

/* ===== EDIT ITEM ===== */
function editItem(index) {
  const data = loadData();
  const d = data[index];

  qEl.value    = d.q;
  optsEl.value = d.opts.join("\n");
  ansEl.value  = d.ans;
  expEl.value  = d.exp || "";

  editIndex = index;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ===== DELETE ITEM ===== */
function deleteItem(index) {
  if (!confirm("क्या यह प्रश्न हटाना है?")) return;

  const data = loadData();
  data.splice(index, 1);
  saveData(data);
  renderList();
}

/* ===== CLEAR FORM ===== */
function clearForm() {
  qEl.value = "";
  optsEl.value = "";
  ansEl.value = "";
  expEl.value = "";
}

/* ===== STT (Speech-to-Text) ===== */
function sttFill(targetId) {
  if (!("webkitSpeechRecognition" in window)) {
    alert("यह ब्राउज़र Speech-to-Text सपोर्ट नहीं करता");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "hi-IN";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    document.getElementById(targetId).value += text;
  };

  recognition.onerror = () => {
    alert("आवाज़ पहचान में समस्या हुई");
  };

  recognition.start();
}

/* ===== INIT ===== */
renderList();
