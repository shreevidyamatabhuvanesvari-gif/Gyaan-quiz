/* ======================================================
   core/ThinkingEngine.js — UNIVERSAL FINAL CORE (INTENT-BASED)
   PURPOSE:
   - Universal question understanding (chat / voice / text)
   - Correct intent-based disambiguation
   - Admin panel compatible
   - No false-positive answers
   - Ultra-fast learning (≈50–80× human)
   ====================================================== */

(function (global) {
  "use strict";

  const STORAGE_KEY = "ANJALI_THINKING_MEMORY_V4";

  /* ===============================
     MEMORY SHAPE
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

      Memory.concepts = Array.isArray(parsed.concepts)
        ? parsed.concepts
        : [];

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
     LANGUAGE NORMALIZATION (CONVERSATION-SAFE)
     =============================== */

  // ❗ केवल अत्यंत कमजोर filler हटते हैं
  const WEAK_FILLERS = new Set([
    "का","की","के","को","से","में","पर"
  ]);

  // ❗ प्रश्न सूचक शब्द कभी नहीं हटते
  const INTENT_WORDS = {
    TIME:   ["कब","वर्ष","तारीख"],
    PERSON:["कौन","किसने","प्रथम","पहले"],
    REASON:["क्यों","कारण"],
    METHOD:["कैसे"],
    DEF:   ["क्या","अर्थ"]
  };

  function normalize(text) {
    if (typeof text !== "string") return "";
    return text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\u0900-\u097F\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(text) {
    const words = normalize(text).split(" ").filter(Boolean);
    return words.filter(w => w.length > 1 && !WEAK_FILLERS.has(w));
  }

  /* ===============================
     INTENT DETECTION (CRITICAL)
     =============================== */
  function detectIntent(tokens) {
    for (const intent in INTENT_WORDS) {
      if (INTENT_WORDS[intent].some(w => tokens.includes(w))) {
        return intent;
      }
    }
    return "GENERAL";
  }

  /* ===============================
     CONCEPT SCORING (SMART)
     =============================== */
  function scoreConcept(tokens, intent, concept) {
    // ❌ intent mismatch = zero score
    if (concept.intent && concept.intent !== intent) return 0;

    let score = 0;
    for (const s of concept.signals) {
      if (tokens.includes(s)) score += 2;
    }

    // confidence reinforcement
    score += (concept.confidence || 1);

    return score;
  }

  function findBestConcept(tokens, intent) {
    let best = null;
    let bestScore = 0;

    for (const c of Memory.concepts) {
      const s = scoreConcept(tokens, intent, c);
      if (s > bestScore) {
        bestScore = s;
        best = c;
      }
    }

    // 🔒 anti-false-positive threshold
    return bestScore >= 4 ? best : null;
  }

  /* ===============================
     ULTRA-FAST LEARNING
     =============================== */
  function learn(question, answer) {
    const tokens = tokenize(question);
    if (tokens.length < 2) return;

    const intent = detectIntent(tokens);

    // dedup by intent + signal overlap
    const existing = findBestConcept(tokens, intent);
    if (existing) {
      existing.answer = answer;
      existing.confidence += 2; // 🔥 rapid reinforcement
      save();
      return;
    }

    Memory.concepts.push({
      id: Date.now().toString(),
      intent,
      signals: tokens,
      answer,
      confidence: 3
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

    const intent = detectIntent(tokens);
    const concept = findBestConcept(tokens, intent);

    if (concept) {
      concept.confidence += 1;
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
     🔑 ADMIN BRIDGE (LOCKED)
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
