/* ==========================================================
   voice/stt.js — STT CONTROLLER (FINAL & COMPATIBLE)
   RESPONSIBILITY:
   - User gesture के बाद mic start
   - Speech → text निकालना
   - Text को index / main तक भेजना (onText)
   - कोई सोच, सीख, जवाब नहीं
   ========================================================== */

(function (global) {
  "use strict";

  /* ===============================
     BROWSER SUPPORT
     =============================== */
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn("STT not supported in this browser.");
    return;
  }

  /* ===============================
     STATE
     =============================== */
  let recognition = null;
  let listening = false;

  /* ===============================
     UTILS
     =============================== */
  function normalize(text) {
    if (typeof text !== "string") return "";
    return text.trim();
  }

  /* ===============================
     CORE START
     =============================== */
  function startListening() {
    if (listening) return;

    recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = event => {
      const last =
        event.results[event.results.length - 1][0].transcript;

      const text = normalize(last);
      if (!text) return;

      /* 👉 MICRO COMMAND BUFFER (optional) */
      if (global.CommandBuffer?.feed) {
        CommandBuffer.feed(text);
      }

      /* 👉 MAIN HANDSHAKE */
      if (typeof AnjaliSTT.onText === "function") {
        AnjaliSTT.onText(text);
      }
    };

    recognition.onerror = () => {
      stopListening();
    };

    recognition.onend = () => {
      listening = false;
    };

    try {
      recognition.start();
      listening = true;
    } catch (e) {
      console.error("STT start failed", e);
    }
  }

  /* ===============================
     CORE STOP
     =============================== */
  function stopListening() {
    if (!recognition) return;

    try {
      recognition.stop();
    } catch (_) {}

    recognition = null;
    listening = false;
  }

  /* ===============================
     PUBLIC API (LOCKED)
     =============================== */
  global.AnjaliSTT = {
    startListening,
    stopListening,

    /* index / main यहाँ attach करेंगे */
    onText: null,

    isListening() {
      return listening;
    }
  };

})(window);
