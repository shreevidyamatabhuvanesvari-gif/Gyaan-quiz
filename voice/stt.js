/* ==========================================================
   voice/stt.js — FINAL MIC-UNLOCK SAFE VERSION
   ========================================================== */

(function (global) {
  "use strict";

  const SpeechRecognition =
    global.SpeechRecognition || global.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    global.AnjaliSTT = { available: false };
    return;
  }

  let recognition = null;
  let listening = false;
  let unlocked = false;

  function normalize(t) {
    return typeof t === "string" ? t.trim() : "";
  }

  function startRecognition() {
    if (!unlocked || listening) return;

    recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.continuous = false;      // 🔴 MUST be false
    recognition.interimResults = false;

    recognition.onresult = e => {
      const text = normalize(e.results[0][0].transcript);
      listening = false;

      if (text && typeof global.AnjaliSTT.onText === "function") {
        global.AnjaliSTT.onText(text);
      }
    };

    recognition.onerror = () => {
      listening = false;
    };

    recognition.onend = () => {
      listening = false;
    };

    recognition.start();   // 🎯 यही mic खोलता है
    listening = true;
  }

  function stopRecognition() {
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
      startRecognition();
    },

    stop() {
      stopRecognition();
    },

    isListening() {
      return listening;
    },

    onText: null
  };

})(window);
