/* ==========================================================
   voice/stt.js — HUMAN-SAFE, USER-GESTURE STT (PRODUCTION)
   RESPONSIBILITY:
   - Start listening ONLY after explicit user action
   - Continuous listening with safe auto-restart
   - Command detection (STOP / PAUSE / RESUME / CHANGE)
   - Forward clean text to host app (main / chat)
   - Zero dependency on ThinkingEngine / TTS
   ========================================================== */

(function (global) {
  "use strict";

  /* ===============================
     BROWSER SUPPORT CHECK
     =============================== */
  const SpeechRecognition =
    global.SpeechRecognition || global.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn("❌ STT not supported in this browser");
    global.AnjaliSTT = {
      available: false,
      startListening() {
        throw new Error("STT not supported");
      },
      stopListening() {},
      isListening() {
        return false;
      }
    };
    return;
  }

  /* ===============================
     CONFIG
     =============================== */
  const LISTEN_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
  const LANG = "hi-IN";

  /* ===============================
     COMMAND DICTIONARY (SAFE)
     =============================== */
  const COMMANDS = {
    STOP: ["रुको", "बस", "चुप", "चुप रहो", "मत बोलो"],
    PAUSE: ["रुक जाओ", "ठहरो", "रुको ज़रा"],
    RESUME: ["जारी रखो", "फिर शुरू", "आगे बताओ"],
    CHANGE: ["प्रश्न बदलो", "अगला सवाल", "कुछ और"]
  };

  /* ===============================
     INTERNAL STATE
     =============================== */
  let recognition = null;
  let listening = false;
  let paused = false;
  let listenTimer = null;
  let userGestureUnlocked = false;

  /* ===============================
     UTILS
     =============================== */
  function normalize(text) {
    return typeof text === "string"
      ? text.trim().toLowerCase()
      : "";
  }

  function detectCommand(text) {
    for (const type in COMMANDS) {
      if (COMMANDS[type].some(cmd => text.includes(cmd))) {
        return type;
      }
    }
    return null;
  }

  function resetListenTimer() {
    clearTimeout(listenTimer);
    listenTimer = setTimeout(() => {
      restart();
    }, LISTEN_TIMEOUT_MS);
  }

  /* ===============================
     CORE RECOGNITION
     =============================== */
  function createRecognition() {
    const r = new SpeechRecognition();
    r.lang = LANG;
    r.continuous = true;
    r.interimResults = false;

    r.onresult = e => {
      const transcript =
        e.results[e.results.length - 1][0].transcript;

      const text = normalize(transcript);
      if (!text) return;

      resetListenTimer();

      const cmd = detectCommand(text);
      if (cmd) {
        if (global.AnjaliSTT.onCommand) {
          global.AnjaliSTT.onCommand(cmd, text);
        }
        if (cmd === "STOP" || cmd === "PAUSE") paused = true;
        if (cmd === "RESUME") paused = false;
        return;
      }

      if (paused) return;

      if (global.AnjaliSTT.onText) {
        global.AnjaliSTT.onText(text);
      }
    };

    r.onerror = () => restart();
    r.onend = () => restart();

    return r;
  }

  function startInternal() {
    if (listening || !userGestureUnlocked) return;

    recognition = createRecognition();
    recognition.start();
    listening = true;
    paused = false;
    resetListenTimer();
  }

  function stopInternal() {
    clearTimeout(listenTimer);
    if (recognition) {
      recognition.onend = null;
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
     PUBLIC API (SAFE)
     =============================== */
  global.AnjaliSTT = {
    available: true,

    /**
     * MUST be called inside a user click / tap handler
     */
    unlockByUserGesture() {
      userGestureUnlocked = true;
    },

    startListening() {
      if (!userGestureUnlocked) {
        console.warn("❌ STT blocked: user gesture not detected");
        return;
      }
      startInternal();
    },

    stopListening() {
      stopInternal();
    },

    isListening() {
      return listening;
    },

    /* hooks (assigned by main / chat) */
    onText: null,
    onCommand: null
  };

})(window);
