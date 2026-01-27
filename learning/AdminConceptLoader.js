/* ======================================================
   AdminConceptLoader.js
   PURPOSE:
   - Load Admin questions
   - Convert them into ThinkingEngine concepts
   - One-time safe sync
   ====================================================== */

(function () {
  "use strict";

  const ADMIN_KEY = "ANJALI_ADMIN_KNOWLEDGE_V1";

  if (!window.ThinkingEngine) return;

  let adminData;
  try {
    adminData = JSON.parse(localStorage.getItem(ADMIN_KEY)) || [];
  } catch {
    adminData = [];
  }

  if (!Array.isArray(adminData) || adminData.length === 0) return;

  adminData.forEach(item => {
    if (!item.id || !item.q || !item.a) return;

    // signals = प्रश्न के शब्द
    const signals = item.q
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);

    ThinkingEngine.addConcept(
      item.id,
      signals,
      () => item.a
    );
  });

})();
