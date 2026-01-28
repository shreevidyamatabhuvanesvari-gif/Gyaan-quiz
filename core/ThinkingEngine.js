/* ======================================================
   core/ThinkingEngine.js — FINAL CLEAN CORE
   FIXED:
   - Safe memory load
   - No duplicate concepts
   - Meaningful signals
   - Fast learning
   - UI-safe TTS hook
   ====================================================== */

(function (global) {
  "use strict";

  const STORAGE_KEY = "ANJALI_THINKING_MEMORY_V3";

  /* ===============================
     DEFAULT MEMORY SHAPE
     =============================== */
  const DEFAULT_MEMORY = {
    concepts: [],
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
      Memory = {
        concepts: Array.isArray(parsed.concepts) ? parsed.concepts : [],
        stats: {
          learned: Number(parsed.stats?.learned) || 0,
          answered: Number(parsed.stats?.answered) || 0
        }
      };
    } catch (_) {
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
  const STOP_WORDS = ["का", "की", "के", "कब", "कौन", "क्या", "था", "है", "से", "में"];

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
     UNDERSTANDING
     =============================== */
  function understand(input) {
    const tokens = tokenize(input);
    return { raw: input, tokens };
  }

  /* ===============================
     CONCEPT MATCHING
     =============================== */
  function findConcept(tokens) {
    let best = null;
    let bestScore = 0;

    for (const c of Memory.concepts) {
      let score = c.signals.filter(s => tokens.includes(s)).length;
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    return bestScore > 0 ? best : null;
  }

  /* ===============================
     FAST LEARNING (DEDUP SAFE)
     =============================== */
  function learn(question, answer) {
    const signals = tokenize(question);
    if (signals.length < 2) return;

    const existing = findConcept(signals);
    if (existing) {
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
     RESPONSE (TEXT ONLY)
     =============================== */
  function respond(text, unknown = false) {
    return { text, unknown };
  }

  /* ===============================
     CORE THINK
     =============================== */
  function think(input) {
    const meaning = understand(input);
    if (!meaning.tokens.length) {
      return respond("मुझे प्रश्न स्पष्ट नहीं मिला।");
    }

    const concept = findConcept(meaning.tokens);

    if (concept) {
      concept.confidence += 0.5;
      Memory.stats.answered++;
      save();
      return respond(concept.answer);
    }

    return respond(
      "इस प्रश्न का उत्तर अभी मेरे पास नहीं है। आप चाहें तो मुझे सिखा सकते हैं।",
      true
    );
  }

  /* ===============================
     PUBLIC TEACH API
     =============================== */
  function teach(question, answer) {
    if (!question || !answer) return false;
    learn(question, answer);
    return true;
  }

  /* ===============================
     EXPORT
     =============================== */
  global.ThinkingEngine = {
    think,
    teach,
    inspect: () => structuredClone(Memory)
  };

})(window);
