/* ======================================================
   AnjaliCore.js — FINAL CORE BRIDGE (VERIFIED)
   RESPONSIBILITY:
   - Admin Q/A → ThinkingEngine Concepts
   - Safe, Idempotent, Side-effect free
   ====================================================== */

(function (global) {
  "use strict";

  const ADMIN_KEY = "ANJALI_ADMIN_KNOWLEDGE_V1";
  const CORE_FLAG = "__ANJALI_CORE_LOADED__";

  // 🛑 Double-load protection (hard)
  if (global[CORE_FLAG] === true) return;
  global[CORE_FLAG] = true;

  if (!global.ThinkingEngine || typeof global.ThinkingEngine.addConcept !== "function") {
    console.error("AnjaliCore: ThinkingEngine unavailable");
    return;
  }

  /* ===============================
     TEXT NORMALIZATION
     =============================== */
  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* ===============================
     SIGNAL EXTRACTION (ROBUST)
     =============================== */
  function extractSignals(question) {
    const tokens = normalize(question).split(" ").filter(Boolean);
    const signals = new Set();

    // unigrams
    tokens.forEach(t => {
      if (t.length >= 2) signals.add(t);
    });

    // bigrams
    for (let i = 0; i < tokens.length - 1; i++) {
      const bi = tokens[i] + " " + tokens[i + 1];
      if (bi.length >= 4) signals.add(bi);
    }

    return Array.from(signals);
  }

  /* ===============================
     LOAD ADMIN DATA (SAFE)
     =============================== */
  let adminData;
  try {
    adminData = JSON.parse(localStorage.getItem(ADMIN_KEY) || "[]");
  } catch (e) {
    console.error("AnjaliCore: Invalid admin storage JSON", e);
    return;
  }

  if (!Array.isArray(adminData) || adminData.length === 0) {
    console.warn("AnjaliCore: No admin knowledge found");
    return;
  }

  /* ===============================
     REGISTER CONCEPTS
     =============================== */
  let loadedCount = 0;

  adminData.forEach(item => {
    if (
      !item ||
      typeof item.id !== "string" ||
      typeof item.q !== "string" ||
      typeof item.a !== "string"
    ) {
      return;
    }

    const conceptId = "ADMIN_" + item.id;
    const signals = extractSignals(item.q);
    if (!signals.length) return;

    const answerText = item.a; // immutable capture

    ThinkingEngine.addConcept(
      conceptId,
      signals,
      function responder() {
        return answerText;
      }
    );

    loadedCount++;
  });

  console.log("✅ AnjaliCore: Concepts loaded =", loadedCount);

})(window);
