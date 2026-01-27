/* ======================================================
   ContextMemory.js (TEMPORARY)
   PURPOSE:
   - हाल की बातचीत का संदर्भ रखना
   - follow-up प्रश्नों में मदद करना
   - कोई स्थायी सत्य या ज्ञान नहीं बनाता
   ====================================================== */

(function (global) {
  "use strict";

  const MAX_CONTEXT = 5; // सिर्फ़ आख़िरी 5 टर्न

  let memory = [];

  function add(userText, botText) {
    if (typeof userText !== "string" || typeof botText !== "string") return;

    memory.push({
      user: userText.trim(),
      bot: botText.trim(),
      time: Date.now()
    });

    if (memory.length > MAX_CONTEXT) {
      memory.shift();
    }
  }

  function last() {
    return memory.length ? memory[memory.length - 1] : null;
  }

  function all() {
    return memory.slice();
  }

  function clear() {
    memory = [];
  }

  /* ===============================
     PUBLIC API
     =============================== */
  global.ContextMemory = {
    add,
    last,
    all,
    clear
  };

})(window);
