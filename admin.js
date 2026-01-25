/* =========================================================
   ADMIN.JS – REAL KNOWLEDGE BUILDER
   Storage KEY: KNOWLEDGE_DB
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
  } catch {
    return [];
  }
}

function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

/* ===== SAVE / UPDATE ===== */
function saveItem() {
  const q = qEl.value.trim();
  const opts = optsEl.value.split("\n").map(s=>s.trim()).filter(Boolean);
  const ans = parseInt(ansEl.value.trim(), 10);
  const exp = expEl.value.trim();

  if (!q || opts.length < 2 || isNaN(ans) || ans < 0 || ans >= opts.length) {
    alert("कृपया प्रश्न, कम से कम 2 विकल्प और सही उत्तर (index) भरें");
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

  if (!data.length) {
    listEl.innerHTML = "<p>कोई प्रश्न सेव नहीं है</p>";
    return;
  }

  data.forEach((d,i)=>{
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <b>${d.q}</b>
      <div style="font-size:14px;margin:6px 0;">
        ✔ सही उत्तर: ${d.opts[d.ans]}
      </div>
      <div class="actions">
        <button class="upd" onclick="editItem(${i})">✏️ Edit</button>
        <button class="del" onclick="deleteItem(${i})">❌ Delete</button>
      </div>
    `;
    listEl.appendChild(card);
  });
}

/* ===== EDIT / DELETE ===== */
function editItem(i){
  const d = loadData()[i];
  qEl.value = d.q;
  optsEl.value = d.opts.join("\n");
  ansEl.value = d.ans;
  expEl.value = d.exp || "";
  editIndex = i;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteItem(i){
  if(!confirm("क्या यह प्रश्न हटाना है?")) return;
  const data = loadData();
  data.splice(i,1);
  saveData(data);
  renderList();
}

/* ===== CLEAR ===== */
function clearForm(){
  qEl.value = "";
  optsEl.value = "";
  ansEl.value = "";
  expEl.value = "";
}

/* ===== STT (Speech-to-Text) ===== */
function sttFill(targetId){
  if(!("webkitSpeechRecognition" in window)){
    alert("यह ब्राउज़र STT सपोर्ट नहीं करता");
    return;
  }
  const rec = new webkitSpeechRecognition();
  rec.lang = "hi-IN";
  rec.continuous = false;
  rec.interimResults = false;

  rec.onresult = e=>{
    document.getElementById(targetId).value += e.results[0][0].transcript;
  };
  rec.onerror = ()=>alert("आवाज़ पहचान में समस्या");
  rec.start();
}

/* ===== INIT ===== */
renderList();
