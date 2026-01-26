/* ==========================================================
   voice/commandBuffer.js — MICRO COMMAND PRIORITY BUFFER
   FINAL SAFE VERSION (STOP / SILENCE ONLY)

   PURPOSE:
   - Ultra-fast emergency stop (non-NLP, reflex-only)
   - Mask browser STT latency at UX level
   - Stop TTS / pause timers immediately
   - Zero interference with thinking, learning, or knowledge
   ========================================================== */

(function () {
  "use strict";

  /* ===============================
     CONFIG (LOCKED)
     =============================== */

  // ONLY emergency STOP / SILENCE prefixes
  // Carefully chosen to avoid false positives
  const STOP_TRIGGERS = ["रु", "चु", "बस", "मत"];

  /* ===============================
     STATE
     =============================== */

  let active = false; // buffer works only when explicitly activated

  /* ===============================
     UTILS
     =============================== */

  function normalize(text) {
    if (typeof text !== "string") return "";
    return text.trim().toLowerCase();
  }

  function startsWithAny(text, prefixes) {
    return prefixes.some(p => text.startsWith(p));
  }

  function stopTTSImmediately() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  function pauseTimersSafely() {
    // Optional, safe hook — only if host app provides it
    if (window.AnjaliPresence?.pauseAllTimers) {
      window.AnjaliPresence.pauseAllTimers();
    }
  }

  /* ===============================
     CORE BUFFER LOGIC
     =============================== */

  function handleRawTranscript(rawText) {
    if (!active) return;

    const text = normalize(rawText);
    if (!text) return;

    // Emergency reflex only
    if (!startsWithAny(text, STOP_TRIGGERS)) return;

    // Immediate actions (UX-level reflex)
    stopTTSImmediately();
    pauseTimersSafely();

    // Optional notification (non-breaking)
    if (window.AnjaliPresence?.onMicroCommand) {
      window.AnjaliPresence.onMicroCommand("STOP", text);
    }
  }

  /* ===============================
     PUBLIC SAFE API
     =============================== */

  window.CommandBuffer = {
    /**
     * Activate buffer
     * Call when TTS or time-based narration starts
     */
    activate() {
      active = true;
    },

    /**
     * Deactivate buffer
     * Call when system becomes idle
     */
    deactivate() {
      active = false;
    },

    /**
     * Feed raw / partial transcript
     * (STT may call this, but is not required)
     */
    feed(rawText) {
      handleRawTranscript(rawText);
    },

    /**
     * Read-only status
     */
    isActive() {
      return active;
    }
  };

  /* ===============================
     DEFAULT SAFETY
     =============================== */

  // Buffer is OFF by default.
  // It only works when explicitly activated by the host app.
})();
