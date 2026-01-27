/* ======================================================
   KnowledgeBase.js
   PURPOSE:
   - प्रमाणित, अपडेट-योग्य सत्य का स्थिर भंडार
   - Read during runtime, Update/Delete one-by-one via Admin only
   ====================================================== */

(function (global) {
  "use strict";

  const STORAGE_KEY = "ANJALI_KNOWLEDGE_BASE_V1";

  /** @type {Array<Object>} */
  let knowledge = [];

  /* ===============================
     INTERNAL HELPERS
     =============================== */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      knowledge = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(knowledge)) knowledge = [];
    } catch (e) {
      console.error("KnowledgeBase load failed", e);
      knowledge = [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(knowledge));
    } catch (e) {
      console.error("KnowledgeBase save failed", e);
    }
  }

  function isValidUnit(unit) {
    return (
      unit &&
      typeof unit.id === "string" &&
      typeof unit.title === "string" &&
      typeof unit.content === "string" &&
      Array.isArray(unit.keywords) &&
      typeof unit.source === "string"
    );
  }

  /* ===============================
     PUBLIC API
     =============================== */
  const KnowledgeBase = {

    /** सभी ज्ञान-इकाइयाँ (read-only copy) */
    all() {
      return knowledge.slice();
    },

    /** keyword आधारित खोज */
    search(text) {
      if (typeof text !== "string") return [];
      const t = text.toLowerCase();
      return knowledge.filter(k =>
        k.keywords.some(kw => t.includes(kw.toLowerCase()))
      );
    },

    /** id से एक ज्ञान-इकाई */
    getById(id) {
      return knowledge.find(k => k.id === id) || null;
    },

    /** नया या अपडेटेड सत्य जोड़ना (Admin only) */
    upsert(unit) {
      if (!isValidUnit(unit)) {
        throw new Error("Invalid Knowledge Unit");
      }

      const idx = knowledge.findIndex(k => k.id === unit.id);
      const record = {
        ...unit,
        updatedAt: Date.now()
      };

      if (idx >= 0) {
        knowledge[idx] = record;   // update
      } else {
        knowledge.push(record);   // insert
      }
      save();
    },

    /** ✅ केवल एक-एक करके हटाना (Admin only) */
    remove(id) {
      const before = knowledge.length;
      knowledge = knowledge.filter(k => k.id !== id);
      if (knowledge.length !== before) {
        save();
      }
    }
  };

  /* ===============================
     INIT
     =============================== */
  load();
  global.KnowledgeBase = KnowledgeBase;

})(window);
