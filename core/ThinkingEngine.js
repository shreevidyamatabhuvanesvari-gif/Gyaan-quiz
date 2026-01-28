/* ======================================================
   core/ThinkingEngine.js — FINAL CLEAN CORE (ADMIN-COMPAT)
   ====================================================== */

(function (global) {
  "use strict";

  const STORAGE_KEY = "ANJALI_THINKING_MEMORY_V3";

  const DEFAULT_MEMORY = {
    concepts: [],
    stats: { learned: 0, answered: 0 }
  };

  let Memory = structuredClone(DEFAULT_MEMORY);

  /* ===============================
     LOAD / SAVE
     =============================== */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      Memory.concepts = Array.isArray(parsed.concepts) ? parsed.concepts : [];
      Memory.stats = parsed.stats || { learned: 0, answered: 0 };
    } catch {
      Memory = structuredClone(DEFAULT_MEMORY);
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Memory));
  }

  load();

  /* ===============================
     TEXT NORMALIZATION
     =============================== */
  const STOP_WORDS = ["का","की","के","कब","कौन","क्या","था","है","से","में"];

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
      .filter(w => w && !STOP_WORDS.includes(w));
  }

  /* ===============================
     MATCHING
     =============================== */
  function findConcept(tokens) {
    let best = null;
    let score = 0;
    for (const c of Memory.concepts) {
      const s = c.signals.filter(x => tokens.includes(x)).length;
      if (s > score) {
        score = s;
        best = c;
      }
    }
    return score > 0 ? best : null;
  }

  /* ===============================
     LEARNING
     =============================== */
  function learn(question, answer) {
    const signals = tokenize(question);
    if (signals.length < 2) return;

    const exists = findConcept(signals);
    if (exists) {
      exists.answer = answer;
      exists.confidence += 1;
      save();
      return;
    }

    Memory.concepts.push({
      id: Date.now().toString(),
      signals,
      answer,
      confidence: 1
    });

    Memory.stats.learned++;
    save();
  }

  /* ===============================
     THINK
     =============================== */
  function think(input) {
    const tokens = tokenize(input);
    if (!tokens.length) {
      return { text: "मुझे प्रश्न स्पष्ट नहीं मिला।" };
    }

    const concept = findConcept(tokens);
    if (concept) {
      concept.confidence += 0.5;
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
     🔑 ADMIN COMPATIBILITY BRIDGE
     =============================== */
  function addConcept(id, signals, responder) {
    if (!signals || !responder) return;
    learn(signals.join(" "), responder());
  }

  /* ===============================
     EXPORT
     =============================== */
  global.ThinkingEngine = {
    think,
    teach: learn,
    addConcept,          // ✅ यही missing link था
    inspect: () => structuredClone(Memory)
  };

})(window);
