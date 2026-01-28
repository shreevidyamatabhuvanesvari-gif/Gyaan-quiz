/* ======================================================
   core/ThinkingEngine.js — V6.1 FOLLOW-UP ENGINE
   PURPOSE:
   - Context याद रखना (पिछला विषय)
   - अधूरे / follow-up प्रश्न समझना
   - गलत उत्तर दोहराव को रोकना
   ====================================================== */

(function (global) {
  "use strict";

  const STORAGE_KEY = "ANJALI_THINKING_MEMORY_V6_1";

  /* ===============================
     MEMORY
     =============================== */
  const DEFAULT_MEMORY = {
    concepts: [],   // { id, signals[], answer }
    context: null,  // last resolved concept
    stats: { learned: 0, answered: 0, rejected: 0 }
  };

  let Memory = structuredClone(DEFAULT_MEMORY);

  /* ===============================
     LOAD / SAVE
     =============================== */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw);
      Memory.concepts = Array.isArray(p.concepts) ? p.concepts : [];
      Memory.context = p.context || null;
      Memory.stats = p.stats || DEFAULT_MEMORY.stats;
    } catch {
      Memory = structuredClone(DEFAULT_MEMORY);
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Memory));
  }

  load();

  /* ===============================
     LANGUAGE PROCESSING
     =============================== */
  const FILLERS = new Set([
    "का","की","के","को","से","में","पर","था","थे","है","हुआ","हुई"
  ]);

  const QUESTION_WORDS = new Set([
    "कब","कौन","क्या","क्यों","कैसे","किस","किसने","किसका","किससे"
  ]);

  function normalize(text) {
    return typeof text === "string"
      ? text
          .toLowerCase()
          .replace(/[^\u0900-\u097F\s]/g, "")
          .replace(/\s+/g, " ")
          .trim()
      : "";
  }

  function tokenize(text) {
    return normalize(text)
      .split(" ")
      .filter(w => w.length > 1 && !FILLERS.has(w));
  }

  function analyze(text) {
    const tokens = tokenize(text);
    return {
      tokens,
      qWords: tokens.filter(t => QUESTION_WORDS.has(t)),
      content: tokens.filter(t => !QUESTION_WORDS.has(t))
    };
  }

  /* ===============================
     CONCEPT MATCHING
     =============================== */
  function score(q, c) {
    let s = 0;
    for (const t of q.content) {
      if (c.signals.includes(t)) s += 2;
    }
    for (const qw of q.qWords) {
      if (c.signals.includes(qw)) s += 1;
    }
    return s;
  }

  function findBest(q) {
    let best = null, bestScore = 0;
    for (const c of Memory.concepts) {
      const sc = score(q, c);
      if (sc > bestScore) {
        bestScore = sc;
        best = c;
      }
    }
    return bestScore >= 3 ? best : null;
  }

  /* ===============================
     FOLLOW-UP RESOLUTION (NEW)
     =============================== */
  function resolveFollowUp(q) {
    // अगर प्रश्न छोटा है और context मौजूद है
    if (q.content.length <= 2 && Memory.context) {
      return Memory.context;
    }
    return null;
  }

  /* ===============================
     THINK (CONVERSATIONAL)
     =============================== */
  function think(input) {
    const q = analyze(input);
    if (!q.tokens.length) {
      return { text: "मुझे प्रश्न स्पष्ट नहीं मिला।" };
    }

    // 1️⃣ पहले नया concept ढूँढो
    let concept = findBest(q);

    // 2️⃣ नहीं मिला → follow-up जाँच
    if (!concept) {
      concept = resolveFollowUp(q);
    }

    // 3️⃣ फिर भी नहीं मिला
    if (!concept) {
      Memory.stats.rejected++;
      save();
      return {
        text: "इस प्रश्न का उत्तर अभी मेरे पास नहीं है।",
        unknown: true
      };
    }

    // 4️⃣ सफल उत्तर
    Memory.context = concept;   // 🔑 context अपडेट
    Memory.stats.answered++;
    save();

    return { text: concept.answer };
  }

  /* ===============================
     LEARNING (ADMIN)
     =============================== */
  function addConcept(id, signals, responder) {
    if (!Array.isArray(signals) || typeof responder !== "function") return;

    Memory.concepts.push({
      id: id || Date.now().toString(),
      signals,
      answer: String(responder())
    });

    Memory.stats.learned++;
    save();
  }

  /* ===============================
     EXPORT
     =============================== */
  global.ThinkingEngine = {
    think,
    addConcept,
    inspect: () => structuredClone(Memory)
  };

})(window);
