/* ==========================================================
   voice/stt.js — HUMAN-OBEDIENT STT CORE (FINAL)
   PURPOSE:
   - Continuous listening (2-minute window)
   - Immediate command obedience (stop / interrupt / change / pause / resume)
   - Zero interference with ThinkingEngine logic
   - No learning, no knowledge mutation
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     SAFETY CHECK
     =============================== */
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn("STT not supported in this browser.");
    return;
  }

  /* ===============================
     CONFIG
     =============================== */
  const LISTEN_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

  /* ===============================
     COMMAND DICTIONARY (LOCKED)
     =============================== */
  const COMMANDS = {
    STOP: [
      "रुको", "बस", "चुप", "चुप रहो", "अभी बंद", "मत बोलो", "रोक दो"
    ],
    INTERRUPT: [
      "सुनो", "एक मिनट", "रुक जाओ", "मेरी बात सुनो", "बीच में मत बोलो"
    ],
    CHANGE: [
      "प्रश्न बदलो", "अगला", "दूसरा सवाल", "यह नहीं", "कुछ और", "बदल दो"
    ],
    PAUSE: [
      "रुको ज़रा", "ठहरो", "रुकिए", "थोड़ा समय दो", "wait"
    ],
    RESUME: [
      "जारी रखो", "फिर से शुरू", "continue", "आगे बताओ"
    ]
  };

  /* ===============================
     STATE
     =============================== */
  let recognition = null;
  let listenTimer = null;
  let paused = false;

  /* ===============================
     UTILS
     =============================== */
  function normalize(text) {
    if (typeof text !== "string") return "";
    return text.trim().toLowerCase();
  }

  function matchCommand(text) {
    for (const type in COMMANDS) {
      if (
        COMMANDS[type].some(cmd =>
          text.includes(cmd.toLowerCase())
        )
      ) {
        return type;
      }
    }
    return null;
  }

  function resetListenWindow() {
    clearTimeout(listenTimer);
    listenTimer = setTimeout(() => {
      restartRecognition();
    }, LISTEN_WINDOW_MS);
  }

  function stopTTS() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  /* ===============================
     CORE CONTROL HANDLERS
     =============================== */
  function handleCommand(cmdType, rawText) {
    switch (cmdType) {
      case "STOP":
      case "INTERRUPT":
        stopTTS();
        paused = false;
        break;

      case "PAUSE":
        stopTTS();
        paused = true;
        break;

      case "RESUME":
        paused = false;
        break;

      case "CHANGE":
        stopTTS();
        paused = false;
        if (window.AnjaliPresence?.onChangeRequest) {
          window.AnjaliPresence.onChangeRequest();
        }
        break;
    }

    if (window.AnjaliPresence?.onImmediateCommand) {
      window.AnjaliPresence.onImmediateCommand(cmdType, rawText);
    }
  }

  function forwardToThinking(text) {
    if (paused) return;

    if (window.ThinkingEngine?.think) {
      window.ThinkingEngine.think(text);
    }
  }

  /* ===============================
     RECOGNITION LIFECYCLE
     =============================== */
  function startRecognition() {
    if (recognition) return;

    recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = event => {
      const result =
        event.results[event.results.length - 1][0].transcript;

      const text = normalize(result);
      if (!text) return;

      resetListenWindow();

      const cmd = matchCommand(text);
      if (cmd) {
        handleCommand(cmd, text);
      } else {
        forwardToThinking(text);
      }
    };

    recognition.onerror = () => {
      restartRecognition();
    };

    recognition.onend = () => {
      restartRecognition();
    };

    recognition.start();
    resetListenWindow();
  }

  function restartRecognition() {
    try {
      if (recognition) {
        recognition.onend = null;
        recognition.stop();
        recognition = null;
      }
    } catch (_) {}

    startRecognition();
  }

  /* ===============================
     PUBLIC API (SAFE)
     =============================== */
  window.AnjaliSTT = {
    start() {
      startRecognition();
    },
    stop() {
      clearTimeout(listenTimer);
      if (recognition) {
        recognition.stop();
        recognition = null;
      }
    },
    isPaused() {
      return paused;
    }
  };

  /* ===============================
     AUTO START
     =============================== */
  startRecognition();

})();
