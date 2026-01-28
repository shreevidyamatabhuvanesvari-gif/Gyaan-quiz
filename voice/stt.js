/* ==========================================================
   voice/stt.js — USER-GESTURE SAFE STT (FINAL)
   RESPONSIBILITY:
   - Start ONLY on user click
   - Send recognized text to host (onText)
   - No auto-think, no hidden calls
   ========================================================== */

(function (global) {
  "use strict";

  const SpeechRecognition =
    global.SpeechRecognition || global.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn("STT not supported");
    global.AnjaliSTT = { available: false };
    return;
  }

  let recognition = null;
  let listening = false;
  let unlocked = false;

  function normalize(t) {
    return typeof t === "string"
      ? t.trim()
      : "";
  }

  function create() {
    const r = new SpeechRecognition();
    r.lang = "hi-IN";
    r.continuous = false;        // 👈 IMPORTANT
    r.interimResults = false;

    r.onresult = e => {
      const text = normalize(e.results[0][0].transcript);
      if (!text) return;

      if (typeof global.AnjaliSTT.onText === "function") {
        global.AnjaliSTT.onText(text);
      }
    };

    r.onend = () => {
      listening = false;
    };

    r.onerror = () => {
      listening = false;
    };

    return r;
  }

  function start() {
    if (!unlocked || listening) return;

    recognition = create();
    recognition.start();
    listening = true;
  }

  function stop() {
    if (recognition) {
      recognition.stop();
      recognition = null;
    }
    listening = false;
  }

  /* ===============================
     PUBLIC API
     =============================== */
  global.AnjaliSTT = {
    available: true,

    /** MUST call inside button click */
    unlock() {
      unlocked = true;
    },

    start() {
      start();
    },

    stop() {
      stop();
    },

    isListening() {
      return listening;
    },

    onText: null
  };

})(window);
