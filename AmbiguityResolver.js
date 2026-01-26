/* ==========================================================
   AmbiguityResolver.js
   Purpose:
   - Resolve real ambiguity in ranked concepts
   - No hidden globals
   - No unsafe assumptions
   - Fully defensive & deterministic
   ========================================================== */

(function (global) {
  "use strict";

  /* ===============================
     SAFE UTILS
     =============================== */

  function isNumber(n) {
    return typeof n === "number" && !isNaN(n) && isFinite(n);
  }

  function safeScore(x) {
    return isNumber(x && x.score) ? x.score : 0;
  }

  function safeSupport(x) {
    return isNumber(x && x.support) ? x.support : 0;
  }

  /* ===============================
     CORE AMBIGUITY RESOLUTION
     =============================== */

  /**
   * @param {Array} ranked
   *   Expected shape:
   *   [
   *     { concept:{id}, score:Number, support:Number },
   *     ...
   *   ]
   *
   * @param {Object} biasMap
   *   { conceptId : Number }
   *
   * @returns {Object|null}
   *   - winning ranked item
   *   - or { clarify:true, options:[ids...] }
   *   - or null if undecidable
   */
  function resolve(ranked, biasMap) {
    /* ---------- Guard clauses ---------- */
    if (!Array.isArray(ranked) || ranked.length === 0) return null;
    if (ranked.length === 1) return ranked[0];

    const top = ranked[0];
    const second = ranked[1];

    const topScore = safeScore(top);
    const secondScore = safeScore(second);

    /* ---------- 1. Zero-risk dominance ---------- */
    if (secondScore === 0 && topScore > 0) {
      return top;
    }

    if (topScore === 0) {
      return null;
    }

    const dominance = topScore / secondScore;

    if (dominance > 1.6) {
      return top;
    }

    /* ---------- 2. Support strength ---------- */
    const topSupport = safeSupport(top);
    const secondSupport = safeSupport(second);

    if (
      topSupport > 0.6 &&
      topSupport > secondSupport
    ) {
      return top;
    }

    /* ---------- 3. Distribution check ---------- */
    if (ranked.length >= 3) {
      const third = ranked[2];
      const thirdScore = safeScore(third);

      const spread = topScore - thirdScore;

      if (spread < topScore * 0.25) {
        return {
          clarify: true,
          options: ranked
            .slice(0, 3)
            .map(x => x.concept && x.concept.id)
            .filter(Boolean)
        };
      }
    }

    /* ---------- 4. Learned bias ---------- */
    const bias =
      biasMap && typeof biasMap === "object" ? biasMap : {};

    const biasTop = isNumber(bias[top.concept.id])
      ? bias[top.concept.id]
      : 1;

    const biasSecond = isNumber(bias[second.concept.id])
      ? bias[second.concept.id]
      : 1;

    if (biasTop > biasSecond * 1.3) {
      return top;
    }

    /* ---------- 5. Genuine ambiguity ---------- */
    return {
      clarify: true,
      options: [top.concept.id, second.concept.id]
    };
  }

  /* ===============================
     EXPORT
     =============================== */
  global.AmbiguityResolver = {
    resolve
  };

})(window);
