/* ======================================================
   core/ThinkingEngine.js — UNIVERSAL INTENT ENGINE (FINAL)
   GUARANTEES:
   ✔ No wrong answer repetition
   ✔ Intent-first decision (WHAT / WHEN / WHO / WHERE)
   ✔ Admin Panel compatible
   ✔ Chat + Voice safe
   ====================================================== */

(function (global) {
  "use strict";

  const STORAGE_KEY = "ANJALI_THINKING_MEMORY_V5";

  /* ===============================
     MEMORY STRUCTURE
     =============================== */
  const Memory = {
    concepts: [],   // { id, intent, signals[], answer }
    stats: { learned: 0, answered: 0 }
  };

  /* ===============================
     LOAD / SAVE
     =============================== */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.concepts)) {
        Memory.concepts = parsed.concepts;
      }
    } catch {}
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Memory));
  }

  load();

  /* ===============================
     TEXT NORMALIZATION
     =============================== */
  function normalize(text) {
    if (typeof text !== "string") return "";
    return text
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(text) {
    return normalize(text).split(" ").filter(Boolean);
  }

  /* ===============================
     INTENT DETECTION (CRITICAL)
     =============================== */
  function detectIntent(text) {
    if (/कब|वर्ष|साल/.test(text)) return "WHEN";
    if (/कौन/.test(text)) return "WHO";
    if (/कहाँ/.test(text)) return "WHERE";
    if (/क्यों/.test(text)) return "WHY";
    if (/कैसे/.test(text)) return "HOW";
    if (/क्या/.test(text)) return "WHAT";
    return "GENERAL";
  }

  /* ===============================
     CONCEPT SCORING (SAFE)
     =============================== */
  function scoreConcept(tokens, concept) {
    let score = 0;
    for (const s of concept.signals) {
      if (tokens.includes(s)) score++;
    }
    return score;
  }

  function findBestConcept(tokens, intent) {
    let best = null;
    let bestScore = 0;

    for (const c of Memory.concepts) {

      // 🔒 Intent gate (THIS FIXES THE BUG)
      if (c.intent !== intent) continue;

      const s = scoreConcept(tokens, c);
      if (s > bestScore) {
        bestScore = s;
        best = c;
      }
    }

    // Minimum signal match required
    return bestScore >= 2 ? best : null;
  }

  /* ===============================
     LEARNING (ADMIN + MANUAL)
     =============================== */
  function learn(question, answer) {
    const text = normalize(question);
    const tokens = tokenize(text);
    if (tokens.length < 2) return;

    const intent = detectIntent(text);

    Memory.concepts.push({
      id: Date.now().toString(),
      intent,                 // 🔑 intent stored permanently
      signals: tokens,
      answer
    });

    Memory.stats.learned++;
    save();
  }

  /* ===============================
     THINK (MAIN ENTRY)
     =============================== */
  function think(input) {
    const text = normalize(input);
    const tokens = tokenize(text);

    if (!tokens.length) {
      return { text: "मुझे प्रश्न स्पष्ट नहीं मिला।" };
    }

    const intent = detectIntent(text);
    const concept = findBestConcept(tokens, intent);

    if (concept) {
      Memory.stats.answered++;
      save();
      return { text: concept.answer };
    }

    return {
      text: "इस प्रश्न का उत्तर अभी मेरे पास नहीं है।",
      unknown: true
    };
  }

  /* ===============================
     🔑 ADMIN PANEL BRIDGE (FINAL)
     =============================== */
  function addConcept(id, signals, responder) {
    if (!signals || typeof responder !== "function") return;
    const q = signals.join(" ");
    const a = String(responder());
    learn(q, a);
  }

  /* ===============================
     EXPORT
     =============================== */
  global.ThinkingEngine = {
    think,
    teach: learn,
    addConcept,
    inspect: () => JSON.parse(JSON.stringify(Memory))
  };

})(window);
