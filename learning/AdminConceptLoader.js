/* ======================================================
   AdminConceptLoader.js
   PURPOSE:
   - Admin में सेव प्रश्नों को ThinkingEngine के concepts में लोड करना
   - कोई सीखना नहीं
   - कोई UI नहीं
   - कोई अन्य एप प्रभावित नहीं
   ====================================================== */

(function () {
  "use strict";

  const ADMIN_KEY = "ANJALI_ADMIN_KNOWLEDGE_V1";

  if (!window.ThinkingEngine || !window.KnowledgeReader) return;

  let raw;
  try {
    raw = JSON.parse(localStorage.getItem(ADMIN_KEY)) || [];
  } catch {
    raw = [];
  }

  if (!Array.isArray(raw)) return;

  raw.forEach(item => {
    if (!item.id || !item.q || !item.a) return;

    // पहले से जोड़ा हो तो दोबारा नहीं
    ThinkingEngine.addConcept(
      item.id,
      item.q.split(/\s+/), // signals
      () => item.a         // responder
    );
  });

})();
