/* ======================================================
   learning/ConceptBridge.js — FINAL (DECISIVE)
   ROLE:
   - Bridge Admin-stored Q/A → ThinkingEngine concepts
   - Single source: ANJALI_ADMIN_KNOWLEDGE_V1
   - No UI, no learning, no mutation
   ====================================================== */

(function (global) {
  "use strict";

  const ADMIN_KEY = "ANJALI_ADMIN_KNOWLEDGE_V1";

  // Safety checks
  if (!global.ThinkingEngine || typeof global.ThinkingEngine.addConcept !== "function") {
    console.warn("ConceptBridge: ThinkingEngine not ready");
    return;
  }

  let raw;
  try {
    raw = JSON.parse(localStorage.getItem(ADMIN_KEY)) || [];
  } catch (e) {
    console.error("ConceptBridge: Invalid admin data");
    return;
  }

  if (!Array.isArray(raw) || raw.length === 0) {
    console.warn("ConceptBridge: No admin concepts found");
    return;
  }

  raw.forEach(item => {
    if (
      !item ||
      typeof item.id !== "string" ||
      typeof item.q !== "string" ||
      typeof item.a !== "string"
    ) {
      return;
    }

    const signals = item.q
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);

    if (signals.length === 0) return;

    // निर्णायक injection
    ThinkingEngine.addConcept(
      item.id,
      signals,
      () => item.a
    );
  });

  console.log("✅ ConceptBridge: Concepts injected into ThinkingEngine");

})(window);
