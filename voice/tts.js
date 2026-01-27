/* ======================================================
   voice/tts.js — Human-like TTS Controller (FINAL)
   RESPONSIBILITY:
   - बोलना (Speak)
   - तुरंत चुप होना (Stop)
   - main.js के साथ सुरक्षित सहयोग
   ====================================================== */

(function (global) {
  "use strict";

  if (!("speechSynthesis" in window)) {
    console.warn("TTS not supported in this browser");
    return;
  }

  let currentUtterance = null;
  let speaking = false;
  let sessionId = 0;

  const DEFAULT_CONFIG = {
    lang: "hi-IN",
    rate: 0.75,
    pitch: 1.05,
    volume: 1
  };

  function speak(text, options = {}, onEnd) {
    if (typeof text !== "string" || !text.trim()) {
      if (typeof onEnd === "function") onEnd(false);
      return;
    }

    // नई session
    sessionId++;
    const mySession = sessionId;

    stop(); // पहले से बोल रहा हो तो रोकें

    const cfg = { ...DEFAULT_CONFIG, ...options };

    const u = new SpeechSynthesisUtterance(text);
    u.lang = cfg.lang;
    u.rate = cfg.rate;
    u.pitch = cfg.pitch;
    u.volume = cfg.volume;

    speaking = true;
    currentUtterance = u;

    u.onend = () => {
      if (mySession !== sessionId) return; // outdated
      speaking = false;
      currentUtterance = null;
      if (typeof onEnd === "function") onEnd(true);
    };

    u.onerror = () => {
      if (mySession !== sessionId) return;
      speaking = false;
      currentUtterance = null;
      if (typeof onEnd === "function") onEnd(false);
    };

    speechSynthesis.speak(u);
  }

  function stop() {
    if (!speaking) return;
    sessionId++;
    speaking = false;
    currentUtterance = null;
    speechSynthesis.cancel();
  }

  function isSpeaking() {
    return speaking;
  }

  /* ===============================
     PUBLIC API
     =============================== */
  global.AnjaliTTS = {
    speak,
    stop,
    isSpeaking
  };

})(window);
