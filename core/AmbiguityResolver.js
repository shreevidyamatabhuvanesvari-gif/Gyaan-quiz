/* ======================================================
   AmbiguityResolver.js
   PURPOSE:
   - Ranked concepts में ambiguity detect करना
   - Clarification या final decision देना
   ====================================================== */

(function (global) {
  "use strict";

  function resolve(ranked, bias = {}) {
    if (!Array.isArray(ranked) || ranked.length === 0) {
      return null;
    }

    // केवल एक concept है → सीधा वही
    if (ranked.length === 1) {
      return ranked[0];
    }

    const top = ranked[0];
    const second = ranked[1];

    // सुरक्षा
    if (!top.score || !second.score) {
      return top;
    }

    // entropy ratio
    const entropy = second.score / top.score;

    // अगर बहुत पास-पास हैं → ambiguity
    if (entropy > 0.65) {
      return {
        clarify: true,
        options: [
          top.concept.id,
          second.concept.id
        ]
      };
    }

    // नहीं तो top decision
    return top;
  }

  global.AmbiguityResolver = {
    resolve
  };

})(window);
