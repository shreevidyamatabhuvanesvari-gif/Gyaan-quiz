/* ======================================================
   ResponseEngine.js
   PURPOSE:
   - ThinkingEngine के निर्णय को
     मानव-पठनीय उत्तर में बदलना
   - कोई सीख नहीं, कोई निर्णय नहीं
   - केवल सुरक्षित प्रस्तुति (Response Formatter)
   ====================================================== */

(function (global) {
  "use strict";

  if (global.ResponseEngine) return; // double-load safety

  /* ===============================
     INTERNAL HELPERS
     =============================== */

  function safeText(val) {
    if (typeof val !== "string") return "";
    return val.replace(/\s+/g, " ").trim();
  }

  function buildClarifyResponse(options) {
    if (!Array.isArray(options) || options.length === 0) {
      return "क्या आप अपना प्रश्न थोड़ा और स्पष्ट कर सकते हैं?";
    }
    return (
      "क्या आप इनमें से किसी के बारे में पूछ रहे हैं: " +
      options.join(" या ") +
      "?"
    );
  }

  function buildUnknownResponse() {
    return "इस प्रश्न का उत्तर अभी मेरे पास उपलब्ध नहीं है।";
  }

  /* ===============================
     PUBLIC API
     =============================== */
  const ResponseEngine = {

    /**
     * ThinkingEngine के आउटपुट को
     * अंतिम उत्तर में बदले
     * @param {Object|null} decision
     * @returns {{text: string, meta?: Object}}
     */
    respond(decision) {
      try {
        if (!decision || typeof decision !== "object") {
          return { text: buildUnknownResponse() };
        }

        // ambiguity case
        if (decision.clarify === true) {
          return {
            text: buildClarifyResponse(decision.options || []),
            meta: { type: "clarify" }
          };
        }

        // normal answer
        if (decision.text) {
          return {
            text: safeText(decision.text),
            meta: {
              type: "answer",
              conceptId: decision.conceptId || null
            }
          };
        }

        return { text: buildUnknownResponse() };

      } catch (e) {
        console.error("ResponseEngine error:", e);
        return {
          text: "उत्तर तैयार करते समय एक समस्या आई।"
        };
      }
    }
  };

  /* ===============================
     EXPORT
     =============================== */
  global.ResponseEngine = ResponseEngine;

})(window);
