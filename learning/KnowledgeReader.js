/* ======================================================
   KnowledgeReader.js — FINAL (LOCKED)
   ROLE:
   - Read from KnowledgeBase
   - Validate + Sanitize
   - Provide VerifiedKnowledgeUnit to ThinkingEngine / AnswerEngine
   ====================================================== */

(function (global) {
  "use strict";

  /* ===============================
     INTERNAL UTILITIES
     =============================== */

  function isNonEmptyString(v) {
    return typeof v === "string" && v.trim().length > 0;
  }

  function isStringArray(arr) {
    return Array.isArray(arr) && arr.every(isNonEmptyString);
  }

  function safeString(v) {
    if (typeof v !== "string") return "";
    return v.replace(/<[^>]*>/g, "").trim(); // basic XSS strip
  }

  /* ===============================
     VALIDATION
     =============================== */

  function validateRaw(unit) {
    if (!unit || typeof unit !== "object") return false;

    if (!isNonEmptyString(unit.id)) return false;
    if (!isNonEmptyString(unit.title)) return false;
    if (!isNonEmptyString(unit.content)) return false;
    if (!isStringArray(unit.keywords)) return false;
    if (!isNonEmptyString(unit.source)) return false;

    return true;
  }

  /* ===============================
     SANITIZATION
     =============================== */

  function sanitize(unit) {
    if (!validateRaw(unit)) return null;

    const clean = {
      id: unit.id.trim(),
      title: safeString(unit.title),
      content: safeString(unit.content),
      keywords: unit.keywords.map(k => k.trim()),
      source: safeString(unit.source),

      meta: {
        verified: true,
        integrity: "ok"
      }
    };

    if (
      !clean.title ||
      !clean.content ||
      !clean.keywords.length
    ) {
      clean.meta.integrity = "suspect";
      clean.meta.reason = "Sanitization resulted in empty fields";
    }

    return clean;
  }

  /* ===============================
     CORE READERS
     =============================== */

  function readAll() {
    if (!global.KnowledgeBase || typeof KnowledgeBase.all !== "function") {
      return [];
    }

    const rawList = KnowledgeBase.all();
    if (!Array.isArray(rawList)) return [];

    const verified = [];

    for (let i = 0; i < rawList.length; i++) {
      const clean = sanitize(rawList[i]);
      if (clean) verified.push(clean);
    }

    return verified;
  }

  function readById(id) {
    if (!isNonEmptyString(id)) return null;
    if (!global.KnowledgeBase || typeof KnowledgeBase.getById !== "function") {
      return null;
    }

    const raw = KnowledgeBase.getById(id);
    if (!raw) return null;

    return sanitize(raw);
  }

  function matchByText(text) {
    if (!isNonEmptyString(text)) return [];

    const t = text.toLowerCase();
    const all = readAll();

    return all.filter(unit =>
      unit.keywords.some(kw =>
        t.includes(kw.toLowerCase())
      )
    );
  }

  /* ===============================
     PUBLIC API (LOCKED)
     =============================== */

  const KnowledgeReader = Object.freeze({
    readAll,
    readById,
    matchByText,
    validateRaw
  });

  /* ===============================
     EXPORT
     =============================== */

  global.KnowledgeReader = KnowledgeReader;

})(window);
