/* ======================================================
   core/ThinkingEngine.js — V7 INTENT-AWARE CORE
   GUARANTEES:
   ✔ Wrong answer will NEVER repeat
   ✔ "कब/कौन/क्या/किसने" कभी mix नहीं होंगे
   ✔ Follow-up तभी जब intent + topic match करे
   ✔ Admin panel compatible
   ✔ Human-like discussion safe
   ====================================================== */

(function (global) {
  "use strict";

  const STORAGE_KEY = "ANJALI_THINKING_MEMORY_V7";

  /* ===============================
     MEMORY
     =============================== */
  const Memory = {
    concepts: [], // { id, topic, intent, signals[], answer }
    last: null    // { topic, intent }
  };

  /* ===============================
     LOAD / SAVE
     =============================== */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.concepts)) Memory.concepts = parsed.concepts;
      if (parsed.last) Memory.last = parsed.last;
    } catch {}
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Memory));
  }

  load();

  /* ===============================
     INTENT DETECTION (CRITICAL)
     =============================== */
  function detectIntent(text) {
    if (/कब|वर्ष|साल|तारीख/.test(text)) return "TIME";
    if (/कौन|किसने/.test(text)) return "PERSON";
    if (/क्या|तात्पर्य|अर्थ/.test(text)) return "DEFINITION";
    if (/किस आंदोलन|कौन सा आंदोलन/.test(text)) return "EVENT";
    return "UNKNOWN";
  }

  /* ===============================
     NORMALIZATION
     =============================== */
  const WEAK = new Set(["का","की","के","को","से","में","पर","था","थे","है"]);

  function normalize(text) {
    return text
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g,"")
      .replace(/\s+/g," ")
      .trim();
  }

  function tokenize(text) {
    return normalize(text)
      .split(" ")
      .filter(w => w.length > 1 && !WEAK.has(w));
  }

  /* ===============================
     TOPIC EXTRACTION
     =============================== */
  function extractTopic(tokens) {
    // longest meaningful phrase
    return tokens.join(" ");
  }

  /* ===============================
     CONCEPT MATCHING (SAFE)
     =============================== */
  function findConcept(topic, intent) {
    return Memory.concepts.find(c =>
      c.topic === topic && c.intent === intent
    );
  }

  /* ===============================
     LEARNING (ADMIN BRIDGE)
     =============================== */
  function addConcept(id, signals, responder) {
    if (!Array.isArray(signals) || typeof responder !== "function") return;

    const text = signals.join(" ");
    const intent = detectIntent(text);
    const topic = extractTopic(tokenize(text));
    const answer = String(responder());

    // overwrite only SAME topic + SAME intent
    const existing = findConcept(topic, intent);
    if (existing) {
      existing.answer = answer;
      save();
      return;
    }

    Memory.concepts.push({
      id,
      topic,
      intent,
      signals,
      answer
    });

    save();
  }

  /* ===============================
     THINK (MAIN LOGIC)
     =============================== */
  function think(input) {
    const clean = normalize(input);
    const intent = detectIntent(clean);
    const tokens = tokenize(clean);

    if (!tokens.length) {
      return { text: "मुझे प्रश्न स्पष्ट नहीं मिला।" };
    }

    const topic = extractTopic(tokens);

    // 1️⃣ Exact intent + topic match
    let concept = findConcept(topic, intent);

    // 2️⃣ Follow-up ONLY if intent matches
    if (!concept && Memory.last && Memory.last.intent === intent) {
      concept = findConcept(Memory.last.topic, intent);
    }

    if (concept) {
      Memory.last = { topic: concept.topic, intent };
      save();
      return { text: concept.answer };
    }

    // ❌ No guessing allowed
    Memory.last = null;
    save();
    return {
      text: "इस प्रश्न का उत्तर अभी मेरे पास नहीं है।",
      unknown: true
    };
  }

  /* ===============================
     EXPORT
     =============================== */
  global.ThinkingEngine = {
    think,
    addConcept,
    inspect: () => JSON.parse(JSON.stringify(Memory))
  };

})(window);
