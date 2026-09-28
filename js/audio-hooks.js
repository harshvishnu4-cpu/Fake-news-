/*
  audio-hooks.js
  Placeholder sound functions for Chunks 2-4.

  No audio files are bundled yet. Each function currently plays a tiny
  generated tone via the Web Audio API so interactions have some audio
  feedback offline, with zero risk of a missing-file console error.

  To wire a real sound later, replace the body of any function with:
    var audio = new Audio("assets/sounds/<file>.mp3");
    audio.play().catch(function () {});
*/

(function () {
  "use strict";

  var ctx = null;
  var enabled = true;

  try {
    if (sessionStorage.getItem("fndSoundEnabled") === "false") enabled = false;
  } catch (err) {}

  function getCtx() {
    if (!ctx) {
      var AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) ctx = new AudioContextClass();
    }
    return ctx;
  }

  function tone(freqStart, freqEnd, duration, type) {
    if (!enabled) return;
    try {
      var audioCtx = getCtx();
      if (!audioCtx) return;
      if (audioCtx.state === "suspended") audioCtx.resume();

      var now = audioCtx.currentTime;
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();

      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freqStart, now);
      if (freqEnd && freqEnd !== freqStart) {
        osc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration * 0.7);
      }

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.15, now + Math.min(0.015, duration * 0.2));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch (err) {
      /* audio is decorative — never let it break the mission */
    }
  }

  window.playClueCollectedSound = function () {
    tone(660, 990, 0.22, "sine");
  };

  window.playEvidenceAcceptedSound = function () {
    tone(520, 720, 0.16, "sine");
  };

  window.playPanelOpenSound = function () {
    tone(420, 520, 0.1, "sine");
  };

  window.playTrustedSourceSound = function () {
    tone(600, 900, 0.2, "triangle");
  };

  window.playRuleUnlockedSound = function (ruleId) {
    fndDevLog("playRuleUnlockedSound:", ruleId);
    tone(700, 1050, 0.24, "sine");
  };

  window.playConnectionSound = function () {
    tone(500, 800, 0.14, "sine");
  };

  window.playDetectorBuildSound = function () {
    tone(300, 900, 0.5, "sawtooth");
  };

  window.playByteDialogueSound = function (dialogueId) {
    fndDevLog("playByteDialogueSound:", dialogueId);
    tone(480, 540, 0.08, "sine");
  };

  window.playChunkTransitionSound = function () {
    tone(440, 660, 0.3, "triangle");
  };

  window.playChunkCompleteSound = function () {
    tone(520, 1040, 0.4, "triangle");
  };

  /* ---- Chunks 5-7 ---- */

  window.playTestStartSound = function () {
    tone(500, 760, 0.22, "triangle");
  };

  window.playDetectorCheckSound = function (checkId) {
    fndDevLog("playDetectorCheckSound:", checkId);
    tone(560, 640, 0.1, "sine");
  };

  window.playWarningFoundSound = function () {
    tone(400, 300, 0.18, "sawtooth");
  };

  window.playSafeResultSound = function () {
    tone(600, 880, 0.22, "sine");
  };

  window.playMissedEvidenceSound = function () {
    tone(360, 280, 0.2, "sine");
  };

  window.playRepairSound = function (checkId) {
    fndDevLog("playRepairSound:", checkId);
    tone(500, 820, 0.2, "sine");
  };

  window.playUpgradeSound = function () {
    tone(320, 950, 0.55, "sawtooth");
  };

  window.playLogicFixedSound = function () {
    tone(560, 840, 0.24, "triangle");
  };

  window.playRetestSound = function () {
    tone(480, 700, 0.18, "triangle");
  };

  window.playFinalMissionSound = function () {
    tone(500, 760, 0.24, "triangle");
  };

  window.playFinalDecisionSound = function () {
    tone(600, 900, 0.2, "sine");
  };

  window.playReflectionCompleteSound = function () {
    tone(560, 860, 0.22, "sine");
  };

  window.playMissionCompleteSound = function () {
    tone(440, 1180, 0.7, "triangle");
  };

  window.FNDAudio = {
    isEnabled: function () { return enabled; },
    setEnabled: function (value) {
      enabled = !!value;
      try { sessionStorage.setItem("fndSoundEnabled", String(enabled)); } catch (err) {}
      if (!enabled && ctx && ctx.state === "running") ctx.suspend().catch(function () {});
      if (enabled && ctx && ctx.state === "suspended") ctx.resume().catch(function () {});
    }
  };

})();
