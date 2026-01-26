/* ======================================================
   main.js — App Orchestrator (LEARNING-SAFE FINAL)
   FIXED ERRORS: 1 → 10
   #10: Learning contamination prevention
   ====================================================== */

(function () {
  "use strict";

  /* =======================
     APP STATE
     ======================= */
  const AppState = {
    mode: "idle",
    listening: false,
    speaking: false,

    responseToken: 0,
    ttsSession: 0,
    listenDeadline: 0,

    lastSpokenText: "",
    lastUserInput: "",
    lastAnswerText: "",

    clarifyCount: 0,
    interrupted: false
  };

  const MAX_LISTEN_MS = 2 * 60 * 1000;
  const MIN_INPUT_LENGTH = 3;
  const MAX_CLARIFY = 2;
  const MAX_INTENTS = 3;

  /* =======================
     UI
     ======================= */
  const UI = {
    get: id => document.getElementById(id) || null,
    set: (id, txt) => {
      const e = document.getElementById(id);
      if (e) e.innerText = txt;
    },
    click: (id, fn) => {
      const e = document.getElementById(id);
      if (e) e.onclick = fn;
    }
  };

  function setStatus(t) {
    UI.set("appStatus", t);
  }

  /* =======================
     MODE CONTROL
     ======================= */
  function resetClarification() {
    AppState.clarifyCount = 0;
  }

  function enterMode(m) {
    if (AppState.mode === m) return;

    stopSpeaking(true);
    stopListening();
    resetClarification();

    AppState.mode = m;
    AppState.interrupted = false;

    if (m === "conversation") {
      setStatus("🎤 सुन रही हूँ…");
      startListening();
    } else if (m === "quiz") {
      setStatus("🧠 Quiz चल रहा है…");
    } else {
      setStatus("अंजली तैयार है");
    }
  }

  /* =======================
     TTS
     ======================= */
  function speak(text, onDone) {
    if (!window.speechSynthesis || !text) {
      onDone && onDone(false);
      return;
    }

    const sid = ++AppState.ttsSession;
    AppState.lastSpokenText = text;
    AppState.speaking = true;

    const u = new SpeechSynthesisUtterance(text);
    u.lang = "hi-IN";
    u.rate = 0.75;
    u.pitch = 1.05;

    u.onend = () => {
      if (sid !== AppState.ttsSession) return;
      AppState.speaking = false;
      onDone && onDone(true);
    };

    speechSynthesis.speak(u);
  }

  function stopSpeaking(force = false) {
    if (!window.speechSynthesis) return;
    if (!AppState.speaking && !force) return;

    AppState.interrupted = true;
    AppState.ttsSession++;
    AppState.speaking = false;
    speechSynthesis.cancel();
  }

  /* =======================
     STT
     ======================= */
  function startListening() {
    if (!window.AnjaliSTT || AppState.listening) return;
    AppState.listening = true;
    AppState.listenDeadline = Date.now() + MAX_LISTEN_MS;
    AnjaliSTT.startListening();
  }

  function stopListening() {
    if (!window.AnjaliSTT || !AppState.listening) return;
    AppState.listening = false;
    AnjaliSTT.stopListening();
  }

  /* =======================
     COMMANDS
     ======================= */
  function handleImmediateCommand(cmd) {
    AppState.interrupted = true;

    if (cmd === "STOP" || cmd === "SILENCE") {
      enterMode("idle");
      return true;
    }
    if (cmd === "CHANGE") {
      resetClarification();
      setStatus("🔁 बदल रहा हूँ…");
      return true;
    }
    return false;
  }

  /* =======================
     MULTI-INTENT SPLITTER
     ======================= */
  function splitIntents(text) {
    return text
      .split(/(?:\sऔर\s|\sतथा\s|\sफिर\s|\sऔर फिर\s|\sसाथ ही\s)/i)
      .map(t => t.trim())
      .filter(Boolean)
      .slice(0, MAX_INTENTS);
  }

  /* =======================
     SAFE LEARNING GATE ❗
     ======================= */
  function commitLearning() {
    if (!window.ExperienceMemory?.recordConversation) return;
    if (AppState.interrupted) return;
    if (!AppState.lastUserInput || !AppState.lastAnswerText) return;

    ExperienceMemory.recordConversation(
      AppState.lastUserInput,
      AppState.lastAnswerText
    );
  }

  /* =======================
     INPUT PIPELINE
     ======================= */
  function handleTextInput(text) {
    if (typeof text !== "string") return;

    const clean = text.trim();
    if (clean.length < MIN_INPUT_LENGTH) return;
    if (clean === AppState.lastSpokenText) return;

    AppState.lastUserInput = clean;

    if (Date.now() > AppState.listenDeadline) {
      stopListening();
      return;
    }
    AppState.listenDeadline = Date.now() + MAX_LISTEN_MS;

    if (window.CommandBuffer) {
      const cmd = CommandBuffer.detect(clean);
      if (cmd && handleImmediateCommand(cmd)) return;
    }

    if (AppState.mode !== "conversation" || !window.ThinkingEngine) return;

    const intents = splitIntents(clean);
    processIntentSequentially(intents, 0);
  }

  function processIntentSequentially(list, index) {
    if (index >= list.length) return;

    let result;
    try {
      result = ThinkingEngine.think(list[index]);
    } catch (e) {
      console.error(e);
      return;
    }

    if (result?.clarify) {
      AppState.clarifyCount++;
      if (AppState.clarifyCount > MAX_CLARIFY) {
        resetClarification();
        speak("इसे अभी छोड़ते हैं।", () => {});
        return;
      }
      speak(
        "क्या आप इनमें से किसी के बारे में पूछ रहे हैं: " +
          result.options.join(" या "),
        () => {}
      );
      return;
    }

    resetClarification();

    if (result?.text) {
      AppState.lastAnswerText = result.text;
      AppState.interrupted = false;

      speak(result.text, completed => {
        if (completed) commitLearning();
        processIntentSequentially(list, index + 1);
      });
    }
  }

  /* =======================
     UI EVENTS
     ======================= */
  UI.click("startBtn", () => enterMode("conversation"));
  UI.click("quizBtn", () => enterMode("quiz"));

  /* =======================
     STT HOOK
     ======================= */
  if (window.AnjaliSTT) {
    AnjaliSTT.onText = handleTextInput;
    AnjaliSTT.onCommand = handleImmediateCommand;
  }

  /* =======================
     INIT
     ======================= */
  setStatus("अंजली तैयार है");

})();
