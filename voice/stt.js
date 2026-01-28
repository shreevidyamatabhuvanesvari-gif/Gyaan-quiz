/* ==========================================================
   voice/stt.js — FINAL 2-MINUTE ROLLING STT (PRODUCTION)
   ========================================================== */

(function (global) {
  "use strict";

  const SpeechRecognition =
    global.SpeechRecognition || global.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    global.AnjaliSTT = { available: false };
    return;
  }

  /* ===============================
     CONFIG
     =============================== */
  const LISTEN_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
  const LANG = "hi-IN";

  /* ===============================
     STATE
     =============================== */
  let recognition = null;
  let listening = false;
  let unlocked = false;
  let listenTimer = null;

  /* ===============================
     UTILS
     =============================== */
  function normalize(text) {
    return typeof text === "string" ? text.trim() : "";
  }

  function resetListenWindow() {
    clearTimeout(listenTimer);
    listenTimer = setTimeout(() => {
      stopInternal();
    }, LISTEN_WINDOW_MS);
  }

  /* ===============================
     CORE RECOGNITION
     =============================== */
  function createRecognition() {
    const r = new SpeechRecognition();
    r.lang = LANG;
    r.continuous = true;          // ✅ MUST be true
    r.interimResults = false;

    r.onresult = e => {
      const result =
        e.results[e.results.length - 1][0].transcript;

      const text = normalize(result);
      if (!text) return;

      resetListenWindow(); // 🔁 rolling 2-minute window

      if (typeof global.AnjaliSTT.onText === "function") {
        global.AnjaliSTT.onText(text);
      }
    };

    r.onerror = () => {
      restart(); // auto recover
    };

    r.onend = () => {
      restart(); // keep mic alive
    };

    return r;
  }

  function startInternal() {
    if (!unlocked || listening) return;

    recognition = createRecognition();
    recognition.start();
    listening = true;
    resetListenWindow();
  }

  function stopInternal() {
    clearTimeout(listenTimer);
    if (recognition) {
      recognition.onend = null;
      recognition.onerror = null;
      recognition.stop();
      recognition = null;
    }
    listening = false;
  }

  function restart() {
    if (!listening) return;
    stopInternal();
    startInternal();
  }

  /* ===============================
     PUBLIC API
     =============================== */
  global.AnjaliSTT = {
    available: true,

    /** MUST be called inside user click */
    unlock() {
      unlocked = true;
    },

    start() {
      startInternal();
    },

    stop() {
      stopInternal();
    },

    isListening() {
      return listening;
    },

    onText: null
  };

})(window);
