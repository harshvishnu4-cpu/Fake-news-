/*
  narration.js
  Recorded Byte voice only.
  Audio is used at essential guidance, reasoning and feedback moments—not to
  read every heading, button or visible sentence.
*/
(function () {
  "use strict";

  var AUDIO_MAP = {
    entry: "assets/audio/english/vo_01_entry.ogg",
    byte_intro: "assets/audio/english/vo_02_byte_intro.ogg",
    new_message: "assets/audio/english/vo_03_new_message.ogg",
    open_message: "assets/audio/english/vo_04_open_message.ogg",
    first_decision: "assets/audio/english/vo_05_first_decision.ogg",
    forward_feedback: "assets/audio/english/vo_06_forward_feedback.ogg",
    ignore_feedback: "assets/audio/english/vo_07_ignore_feedback.ogg",
    hunt_instruction: "assets/audio/english/vo_08_hunt_instruction.ogg",
    source_clue: "assets/audio/english/vo_09_source_clue.ogg",
    claim_clue: "assets/audio/english/vo_10_claim_clue.ogg",
    pressure_clue: "assets/audio/english/vo_11_pressure_clue.ogg",
    wrong_clue: "assets/audio/english/vo_12_wrong_clue.ogg",
    sender_hint: "assets/audio/english/vo_13_sender_hint.ogg",
    install_checks: "assets/audio/english/vo_15_install_checks.ogg",
    v1_ready: "assets/audio/english/vo_16_v1_ready.ogg",
    choose_action: "assets/audio/english/vo_17_choose_action.ogg",
    run_v1: "assets/audio/english/vo_18_run_v1.ogg",
    source_unknown: "assets/audio/english/vo_19_source_unknown.ogg",
    source_known: "assets/audio/english/vo_20_source_known.ogg",
    claim_big: "assets/audio/english/vo_21_claim_big.ogg",
    pressure_warning: "assets/audio/english/vo_22_pressure_warning.ogg",
    pressure_clear: "assets/audio/english/vo_23_pressure_clear.ogg",
    v1_stopped: "assets/audio/english/vo_24_v1_stopped.ogg",
    v1_needs_more: "assets/audio/english/vo_25_v1_needs_more.ogg",
    v1_report: "assets/audio/english/vo_26_v1_report.ogg",
    add_missing_checks: "assets/audio/english/vo_27_add_missing_checks.ogg",
    checks_unlocked: "assets/audio/english/vo_28_checks_unlocked.ogg",
    v2_ready: "assets/audio/english/vo_29_v2_ready.ogg",
    run_v2: "assets/audio/english/vo_30_run_v2.ogg",
    v2_result: "assets/audio/english/vo_31_v2_result.ogg",
    order_process: "assets/audio/english/vo_32_order_process.ogg",
    process_hint: "assets/audio/english/vo_33_process_hint.ogg",
    process_correct: "assets/audio/english/vo_34_process_correct.ogg",
    final_mission: "assets/audio/english/vo_35_final_mission.ogg",
    final_instruction: "assets/audio/english/vo_36_final_instruction.ogg",
    final_retry: "assets/audio/english/vo_37_final_retry.ogg",
    case_solved: "assets/audio/english/vo_38_case_solved.ogg",
    sharing_rule: "assets/audio/english/vo_39_sharing_rule.ogg",
    mission_complete: "assets/audio/english/vo_40_mission_complete.ogg",
    test_message_2: "assets/audio/english/vo_41_test_message_2.ogg.mp3",
    retest_same_message: "assets/audio/english/vo_42_retest_same_message.ogg.mp3"
  };

  var enabled = true;
  var userActivated = false;
  var currentAudio = null;
  var currentReplay = null;
  var sequenceToken = 0;
  var speaking = false;
  var btnVoice = null;
  var btnHeaderSound = null;
  var btnReplay = null;
  var landingTimer = null;

  try {
    if (sessionStorage.getItem("fndVoiceEnabled") === "false") enabled = false;
  } catch (err) {}

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    btnVoice = document.getElementById("btnVoice");
    btnHeaderSound = document.getElementById("btnHeaderSound");
    btnReplay = document.getElementById("btnReplayVoice");
    updateButtons();
    if (window.FNDAudio && window.FNDAudio.setEnabled) window.FNDAudio.setEnabled(enabled);

    if (btnVoice) {
      btnVoice.addEventListener("click", toggleEnabled);
    }

    if (btnHeaderSound) {
      btnHeaderSound.addEventListener("click", toggleEnabled);
    }

    if (btnReplay) {
      btnReplay.addEventListener("click", function () {
        userActivated = true;
        replayCurrent();
      });
    }

    document.addEventListener("pointerdown", function firstGesture() {
      userActivated = true;
      document.removeEventListener("pointerdown", firstGesture, true);
      var active = document.querySelector(".scene.is-active");
      if (enabled && active && active.id === "scene-entry") {
        landingTimer = window.setTimeout(function () {
          landingTimer = null;
          var current = document.querySelector(".scene.is-active");
          if (current && current.id === "scene-entry") playKey("entry");
        }, 80);
      }
    }, true);

    window.addEventListener("fnd:sceneChange", function (event) {
      if (event.detail && event.detail.sceneKey !== "entry" && landingTimer) {
        window.clearTimeout(landingTimer);
        landingTimer = null;
      }
    });

    window.addEventListener("fnd:playVoice", function (event) {
      var detail = event.detail || {};
      if (Array.isArray(detail.sequence)) playSequence(detail.sequence);
      else if (detail.key) playKey(detail.key);
    });
  }

  function toggleEnabled() {
    enabled = !enabled;
    userActivated = true;
    try { sessionStorage.setItem("fndVoiceEnabled", String(enabled)); } catch (err) {}
    if (window.FNDAudio && window.FNDAudio.setEnabled) window.FNDAudio.setEnabled(enabled);
    if (!enabled) stopAll();
    else replayCurrent();
    updateButtons();
  }

  function updateButtons() {
    if (btnVoice) {
      btnVoice.classList.toggle("is-muted", !enabled);
      btnVoice.classList.toggle("is-speaking", speaking);
      btnVoice.setAttribute("aria-pressed", enabled ? "true" : "false");
      btnVoice.setAttribute("aria-label", enabled ? "Turn voice off" : "Turn voice on");
      btnVoice.title = enabled ? "Turn voice off" : "Turn voice on";
      var voiceLabel = document.getElementById("voiceSettingLabel");
      if (voiceLabel) voiceLabel.textContent = enabled ? "Voice On" : "Voice Off";
    }
    if (btnHeaderSound) {
      btnHeaderSound.classList.toggle("is-muted", !enabled);
      btnHeaderSound.classList.toggle("is-speaking", speaking);
      btnHeaderSound.setAttribute("aria-pressed", enabled ? "true" : "false");
      btnHeaderSound.setAttribute("aria-label", enabled ? "Turn voice off" : "Turn voice on");
      btnHeaderSound.title = enabled ? "Sound on" : "Sound off";
      var headerSoundLabel = document.getElementById("headerSoundLabel");
      if (headerSoundLabel) headerSoundLabel.textContent = enabled ? "Sound On" : "Sound Off";
    }
    if (btnReplay) btnReplay.disabled = !enabled || !currentReplay;
  }

  function stopMediaOnly() {
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      } catch (err) {}
      currentAudio = null;
    }
    speaking = false;
    updateButtons();
  }

  function stopAll() {
    sequenceToken += 1;
    stopMediaOnly();
  }

  function setSpeaking(value) {
    speaking = value;
    updateButtons();
  }

  function playKey(key, onDone) {
    if (!AUDIO_MAP[key]) {
      if (onDone) onDone();
      return;
    }
    currentReplay = { type: "key", value: key };
    updateButtons();
    if (!enabled || !userActivated) {
      if (onDone) window.setTimeout(onDone, 0);
      return;
    }
    sequenceToken += 1;
    var token = sequenceToken;
    stopMediaOnly();
    playKeyInternal(key, token, onDone || null);
  }

  function playSequence(keys, onDone) {
    var safeKeys = (keys || []).filter(function (key) { return !!AUDIO_MAP[key]; });
    if (!safeKeys.length) {
      if (onDone) onDone();
      return;
    }
    currentReplay = { type: "sequence", value: safeKeys.slice() };
    updateButtons();
    if (!enabled || !userActivated) {
      if (onDone) window.setTimeout(onDone, 0);
      return;
    }

    sequenceToken += 1;
    var token = sequenceToken;
    stopMediaOnly();

    function next(index) {
      if (token !== sequenceToken) return;
      if (index >= safeKeys.length) {
        if (onDone) onDone();
        return;
      }
      playKeyInternal(safeKeys[index], token, function () {
        window.setTimeout(function () { next(index + 1); }, 250);
      });
    }
    next(0);
  }

  function playKeyInternal(key, token, onDone) {
    var src = AUDIO_MAP[key];
    if (!src || !enabled || token !== sequenceToken) {
      if (onDone) onDone();
      return;
    }

    try {
      var audio = new Audio(src);
      currentAudio = audio;
      audio.preload = "auto";
      audio.volume = 1;
      audio.onplay = function () { setSpeaking(true); };
      audio.onended = function () {
        if (currentAudio === audio) currentAudio = null;
        setSpeaking(false);
        if (onDone && token === sequenceToken) onDone();
      };
      audio.onerror = function () {
        if (currentAudio === audio) currentAudio = null;
        setSpeaking(false);
        if (onDone && token === sequenceToken) onDone();
      };
      audio.play().catch(function () {
        if (currentAudio === audio) currentAudio = null;
        setSpeaking(false);
        if (onDone && token === sequenceToken) onDone();
      });
    } catch (err) {
      setSpeaking(false);
      if (onDone) onDone();
    }
  }

  function replayCurrent() {
    if (!enabled || !userActivated || !currentReplay) return;
    if (currentReplay.type === "key") playKey(currentReplay.value);
    else if (currentReplay.type === "sequence") playSequence(currentReplay.value);
  }

  function clearReplay() {
    currentReplay = null;
    updateButtons();
  }

  window.FNDVoice = {
    playKey: playKey,
    playSequence: playSequence,
    replay: replayCurrent,
    stop: stopAll,
    clearReplay: clearReplay,
    toggle: toggleEnabled,
    hasKey: function (key) { return !!AUDIO_MAP[key]; },
    speak: function () {},
    isEnabled: function () { return enabled; }
  };
})();
