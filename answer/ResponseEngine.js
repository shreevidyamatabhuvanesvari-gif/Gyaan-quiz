/* ======================================================
   ResponseEngine.js
   PURPOSE:
   - ThinkingEngine के निर्णय को बोलने योग्य उत्तर में बदलना
   - Interrupt / Clarify / Safe fallback संभालना
   - कोई सीख नहीं, कोई सत्य-निर्णय नहीं
   ====================================================== */

(function (global) {
  "use strict";

  /* ===============================
     INTERNAL STATE
     =============================== */
  let isSpeaking = false;
  let currentResponseId = 0;
  let lastSpokenText = "";

  /* ===============================
     INTERNAL HELPERS
     =============================== */

  function hasTTS() {
    return typeof window !== "undefined" &&
           typeof window.speechSynthesis !== "undefined" &&
           typeof window.SpeechSynthesisUtterance !== "undefined";
  }

  function stopTTS() {
    if (hasTTS()) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn("TTS cancel failed", e);
      }
    }
    isSpeaking = false;
    currentResponseId++;
  }

  function safeSpeak(text, onDone) {
    if (!text || typeof text !== "string") {
      onDone && onDone(false);
      return;
    }

    if (!hasTTS()) {
      console.warn("TTS not available");
      onDone && onDone(false);
      return;
    }

    stopTTS();

    const rid = ++currentResponseId;
    lastSpokenText = text;
    isSpeaking = true;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "hi-IN";
    utter.rate = 0.75;
    utter.pitch = 1.05;

    utter.onend = () => {
      if (rid !== currentResponseId) return;
      isSpeaking = false;
      onDone && onDone(true);
    };

    utter.onerror = () => {
      if (rid !== currentResponseId) return;
      isSpeaking = false;
      onDone && onDone(false);
    };

    try {
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.error("TTS speak failed", e);
      isSpeaking = false;
      onDone && onDone(false);
    }
  }

  function formatClarification(options) {
    if (!Array.isArray(options) || options.length === 0) {
      return "क्या आप अपना प्रश्न थोड़ा स्पष्ट कर सकते हैं?";
    }
    return (
      "क्या आप इनमें से किसी के बारे में पूछ रहे हैं: " +
      options.join(" या ")
    );
  }

  /* ===============================
     PUBLIC API
     =============================== */
  const ResponseEngine = {

    /**
     * ThinkingEngine के आउटपुट पर प्रतिक्रिया
     * @param {Object} result
     */
    respond(result) {
      if (!result || typeof result !== "object") {
        safeSpeak("मैं इस पर प्रतिक्रिया नहीं दे पा रही हूँ।");
        return;
      }

      // Interrupt protection (external commandBuffer)
      if (global.CommandBuffer && CommandBuffer.isInterrupted?.()) {
        return;
      }

      // Clarification case
      if (result.clarify === true) {
        const msg = formatClarification(result.options);
        safeSpeak(msg);
        return;
      }

      // Normal answer
      if (typeof result.text === "string" && result.text.trim()) {
        safeSpeak(result.text);
        return;
      }

      // Fallback
      safeSpeak("इस प्रश्न पर अभी मेरे पास स्पष्ट उत्तर नहीं है।");
    },

    /**
     * किसी भी समय बोलना बंद करें
     */
    interrupt() {
      stopTTS();
    },

    /**
     * क्या अभी बोल रहा है?
     */
    isBusy() {
      return isSpeaking;
    },

    /**
     * Debug / Safety (read-only)
     */
    _debug() {
      return {
        isSpeaking,
        lastSpokenText
      };
    }
  };

  /* ===============================
     EXPORT
     =============================== */
  global.ResponseEngine = ResponseEngine;

})(window);
