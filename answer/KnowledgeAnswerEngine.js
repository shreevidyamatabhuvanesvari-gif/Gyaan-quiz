/* ======================================================
   KnowledgeAnswerEngine.js
   PURPOSE:
   - ThinkingEngine के निर्णय को
     मानव-पठनीय उत्तर में बदलना
   - KnowledgeReader से सत्यापित ज्ञान पढ़ना
   - कोई नया ज्ञान न बनाना, न बदलना
   ====================================================== */

(function (global) {
  "use strict";

  if (!global.KnowledgeReader) {
    console.error("KnowledgeAnswerEngine: KnowledgeReader missing");
    return;
  }

  const KnowledgeAnswerEngine = {

    /**
     * ThinkingEngine के result को उत्तर में बदलता है
     * @param {Object} decision
     * @returns {Object|null}
     *
     * Expected decision shape:
     * {
     *   conceptId: string,
     *   confidence?: number
     * }
     */
    respond(decision) {
      if (!decision || typeof decision !== "object") {
        return null;
      }

      const conceptId = decision.conceptId;
      if (typeof conceptId !== "string") {
        return null;
      }

      const unit = KnowledgeReader.getById(conceptId);
      if (!unit) {
        return {
          text: "इस विषय पर मेरे पास प्रमाणित जानकारी उपलब्ध नहीं है।",
          source: null
        };
      }

      return {
        text: unit.content,
        title: unit.title || "",
        source: unit.source || "",
        updatedAt: unit.updatedAt || null,
        confidence:
          typeof decision.confidence === "number"
            ? decision.confidence
            : null
      };
    }
  };

  /* ===============================
     EXPORT
     =============================== */
  global.KnowledgeAnswerEngine = KnowledgeAnswerEngine;

})(window);
