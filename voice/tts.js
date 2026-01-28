/* ======================================================
   voice/tts.js — Human-like TTS Controller (FINAL)
   RESPONSIBILITY:
   - Speak text answers
   - Stop immediately
   - Safe to call from ThinkingEngine / UI
   ====================================================== */

(function (global) {
  "use strict";

  if (!("speechSynthesis" in window)) {
    console.warn("TTS not supported");
    return;
  }

  let utterance = null;

  function speak(text, options = {}, onEnd) {
    if (typeof text !== "string" || !text.trim()) return;

    stop(); // always stop previous

    const cfg = {
      lang: "hi-IN",
      rate: 0.8,
      pitch: 1.0,
      volume: 1,
      ...options
    };

    utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = cfg.lang;
    utterance.rate = cfg.rate;
    utterance.pitch = cfg.pitch;
    utterance.volume = cfg.volume;

    utterance.onend = () => {
      utterance = null;
      onEnd && onEnd();
    };

    utterance.onerror = () => {
      utterance = null;
    };

    window.speechSynthesis.speak(utterance);
  }

  function stop() {
    if (utterance) {
      window.speechSynthesis.cancel();
      utterance = null;
    }
  }

  global.AnjaliTTS = {
    speak,
    stop
  };

})(window);
