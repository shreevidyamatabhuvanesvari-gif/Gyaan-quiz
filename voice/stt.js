/* =====================================================
   voice/stt.js
   PURPOSE:
   - Interrupt-aware listening (रुको / चुप / बदलो)
   - Adaptive 2-minute rolling listening window
   - Non-authoritarian STT
   ===================================================== */

(function (global) {
  "use strict";

  // ====== Web Speech Support Check ======
  const SpeechRecognition =
    global.SpeechRecognition || global.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn("❌ SpeechRecognition API समर्थित नहीं है");
    return;
  }

  // ====== CONFIG ======
  const MAX_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
  const INTERRUPT_KEYWORDS = [
    "रुको",
    "चुप",
    "बंद",
    "अगला",
    "प्रश्न बदलो",
    "यह नहीं"
  ];

  // ====== STATE ======
  let recognition = null;
  let listening = false;
  let windowTimer = null;
  let lastHeardAt = 0;

  // ====== CALLBACK HOOKS (Index / Engine set करेगा) ======
  const Hooks = {
    onText: null,        // (text) => {}
    onInterrupt: null,  // (keyword) => {}
    onStop: null        // () => {}
  };

  // ====== INTERNAL HELPERS ======
  function resetWindowTimer() {
    clearTimeout(windowTimer);
    windowTimer = setTimeout(() => {
      stopListening();
    }, MAX_WINDOW_MS);
  }

  function containsInterrupt(text) {
    return INTERRUPT_KEYWORDS.find(k => text.includes(k)) || null;
  }

  // ====== CORE FUNCTIONS ======
  function startListening() {
    if (listening) return;

    recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.continuous = true;     // लगातार सुनना
    recognition.interimResults = false;

    recognition.onstart = () => {
      listening = true;
      lastHeardAt = Date.now();
      resetWindowTimer();
      console.log("🎧 STT सुनना शुरू");
    };

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript.trim();

      if (!text) return;

      console.log("👂 सुना:", text);

      lastHeardAt = Date.now();
      resetWindowTimer(); // 🔁 2 मिनट फिर से शुरू

      // 🔴 Interrupt Check
      const interrupt = containsInterrupt(text);
      if (interrupt) {
        console.log("🛑 Interrupt मिला:", interrupt);

        if (typeof Hooks.onInterrupt === "function") {
          Hooks.onInterrupt(interrupt, text);
        }
        return;
      }

      // 🧠 Normal Text Flow
      if (typeof Hooks.onText === "function") {
        Hooks.onText(text);
      }
    };

    recognition.onerror = (e) => {
      console.warn("⚠️ STT error:", e.error);
    };

    recognition.onend = () => {
      // अगर window के अंदर है तो फिर से चालू
      if (listening && Date.now() - lastHeardAt < MAX_WINDOW_MS) {
        recognition.start();
      } else {
        stopListening();
      }
    };

    recognition.start();
  }

  function stopListening() {
    listening = false;
    clearTimeout(windowTimer);

    if (recognition) {
      try { recognition.stop(); } catch {}
      recognition = null;
    }

    console.log("🔇 STT बंद");

    if (typeof Hooks.onStop === "function") {
      Hooks.onStop();
    }
  }

  // ====== PUBLIC API ======
  global.AnjaliSTT = {
    start: startListening,
    stop: stopListening,

    onText(fn) {
      Hooks.onText = fn;
    },

    onInterrupt(fn) {
      Hooks.onInterrupt = fn;
    },

    onStop(fn) {
      Hooks.onStop = fn;
    },

    isListening() {
      return listening;
    }
  };

})(window);
