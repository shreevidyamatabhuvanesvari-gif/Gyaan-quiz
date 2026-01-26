(function (global) {
  "use strict";

  const STORAGE_KEY = "THINKING_ENGINE_MEMORY_V2";

  /* ===============================
     MEMORY
     =============================== */
  function loadMemory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      return {
        concepts: Array.isArray(data.concepts) ? data.concepts : [],
        bias: typeof data.bias === "object" ? data.bias : {}
      };
    } catch (e) {
      return { concepts: [], bias: {} };
    }
  }

  function saveMemory() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Memory));
  }

  const Memory = loadMemory();

  /* ===============================
     NORMALIZATION + TOKENIZATION
     =============================== */
  function normalize(text) {
    if (typeof text !== "string") return "";
    return text
      .toLowerCase()
      .replace(/[^\u0900-\u097F\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(text) {
    return normalize(text).split(" ").filter(Boolean);
  }

  function ngrams(tokens, n) {
    const res = [];
    for (let i = 0; i <= tokens.length - n; i++) {
      res.push(tokens.slice(i, i + n).join(" "));
    }
    return res;
  }

  /* ===============================
     1. THALAMUS
     =============================== */
  function thalamus(raw) {
    if (typeof raw !== "string") return null;
    const t = raw.trim();
    return t.length < 2 ? null : normalize(t);
  }

  /* ===============================
     2. CORTEX (SEMANTIC SCORING)
     =============================== */
  function cortex(normText) {
    const tokens = tokenize(normText);
    if (!tokens.length) return [];

    const uni = tokens;
    const bi = ngrams(tokens, 2);
    const tri = ngrams(tokens, 3);

    const results = [];

    for (const c of Memory.concepts) {
      let score = 0;

      for (const s of c.signals) {
        if (uni.includes(s)) score += 1;
        if (bi.includes(s)) score += 3;
        if (tri.includes(s)) score += 5;
      }

      if (score > 0) {
        const bias = Memory.bias[c.id] || 1;
        results.push({
          concept: c,
          score: score * c.weight * bias
        });
      }
    }
    return results;
  }

  /* ===============================
     3. BASAL GANGLIA (RANKING)
     =============================== */
  function basalGanglia(matches) {
    if (!Array.isArray(matches) || !matches.length) return null;
    return matches
      .slice()
      .sort((a, b) => b.score - a.score);
  }

  /* ===============================
     4. PREFRONTAL (ENTROPY CHECK)
     =============================== */
  function prefrontal(ranked) {
    if (!ranked || ranked.length === 0) return null;
    if (ranked.length === 1) return ranked[0];

    const top = ranked[0];
    const second = ranked[1];

    const entropy = second.score / top.score;

    if (entropy > 0.65) {
      return {
        clarify: true,
        options: [top.concept.id, second.concept.id]
      };
    }
    return top;
  }

  /* ===============================
     5. HIPPOCAMPUS (LEARNING)
     =============================== */
  function learn(conceptId, success) {
    if (typeof conceptId !== "string") return;

    const c = Memory.concepts.find(x => x.id === conceptId);
    if (!c) return;

    c.weight += success ? 1.5 : -1;
    if (c.weight < 1) c.weight = 1;

    Memory.bias[conceptId] = (Memory.bias[conceptId] || 1) + (success ? 0.2 : -0.1);
    if (Memory.bias[conceptId] < 0.5) Memory.bias[conceptId] = 0.5;

    saveMemory();
  }

  /* ===============================
     6. NEUROPLASTICITY
     =============================== */
  function addConcept(id, signals, responder) {
    if (!id || typeof responder !== "function") return;
    if (!Array.isArray(signals) || !signals.length) return;

    if (Memory.concepts.find(c => c.id === id)) return;

    Memory.concepts.push({
      id,
      signals: signals.map(normalize),
      respond: responder,
      weight: 5
    });

    Memory.bias[id] = 1;
    saveMemory();
  }

  /* ===============================
     THINK
     =============================== */
  function think(input) {
    const norm = thalamus(input);
    if (!norm) return { text: "मुझे प्रश्न स्पष्ट नहीं मिला।" };

    const matches = cortex(norm);
    if (!matches.length)
      return { text: "इस प्रश्न का उत्तर अभी मेरे पास नहीं है।" };

    const ranked = basalGanglia(matches);
    const decision = prefrontal(ranked);

    if (!decision)
      return { text: "मैं इस प्रश्न पर निश्चित निर्णय नहीं ले सका।" };

    if (decision.clarify) {
      return { clarify: true, options: decision.options };
    }

    return {
      text: decision.concept.respond(),
      conceptId: decision.concept.id
    };
  }

  /* ===============================
     EXPORT
     =============================== */
  global.ThinkingEngine = {
    think,
    learn,
    addConcept
  };

})(window);
