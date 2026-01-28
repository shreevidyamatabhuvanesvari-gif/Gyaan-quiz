/* ======================================================
   core/ThinkingEngine.js — UNIVERSAL FINAL CORE
   PURPOSE:
   - Universal question understanding (chat / voice / text)
   - Correct concept disambiguation
   - Admin panel compatible
   - No false-positive answers
   ====================================================== */

(function (global) {
  "use strict";

  const STORAGE_KEY = "ANJALI_THINKING_MEMORY_V4";

  /* ===============================
     DEFAULT MEMORY
     =============================== */
  const DEFAULT_MEMORY = {
    concepts: [],   // { id, signals[], answer, confidence }
    stats: { learned: 0, answered: 0 }
  };

  let Memory = structuredClone(DEFAULT_MEMORY);

  /* ===============================
     LOAD / SAVE (SAFE)
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
     LANGUAGE NORMALIZATION
     =============================== */

  const STOP_WORDS = [
    "का","की","के","कब","कौन","क्या","था","है","थे","से","में","पर"
  ];

  const STRONG_KEYWORDS = [
    "संविधान","राष्ट्रपति","आंदोलन","वर्ष","कब","कौन","पहले","प्रथम"
  ];

  function normalize(text) {
    if (typeof text !== "string") return "";
    return text
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(text) {
    return normalize(text)
      .split(" ")
      .filter(w => w && !STOP_WORDS.includes(w));
  }

  /* ===============================
     CONCEPT MATCHING (SMART)
     =============================== */
  function scoreConcept(tokens, concept) {
    let score = 0;

    for (const s of concept.signals) {
      if (tokens.includes(s)) {
        score += STRONG_KEYWORDS.includes(s) ? 3 : 1;
      }
    }
    return score;
  }

  function findBestConcept(tokens) {
    let best = null;
    let bestScore = 0;

    for (const c of Memory.concepts) {
      const s = scoreConcept(tokens, c);
      if (s > bestScore) {
        bestScore = s;
        best = c;
      }
    }

    // 🔒 Minimum threshold
    return bestScore >= 2 ? best : null;
  }

  /* ===============================
     LEARNING (DEDUP SAFE)
     =============================== */
  function learn(question, answer) {
    const signals = tokenize(question);
    if (signals.length < 2) return;

    const existing = findBestConcept(signals);
    if (existing) {
      existing.answer = answer;
      existing.confidence += 1;
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
     THINK (MAIN ENTRY)
     =============================== */
  function think(input) {
    const tokens = tokenize(input);
    if (!tokens.length) {
      return { text: "मुझे प्रश्न स्पष्ट नहीं मिला।" };
    }

    const concept = findBestConcept(tokens);

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
     🔑 ADMIN BRIDGE (CRITICAL)
     =============================== */
  function addConcept(id, signals, responder) {
    if (!Array.isArray(signals) || typeof responder !== "function") return;
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
    inspect: () => structuredClone(Memory)
  };

})(window);
