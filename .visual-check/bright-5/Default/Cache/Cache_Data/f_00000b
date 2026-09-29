/*
  app.js
  THE FAKE NEWS DETECTOR — Chunk 1
  Scene flow: Mission Entry -> Incoming Message -> Full Message Reveal
              -> First Decision -> Byte's Entry -> Chunk 1 Complete
*/

(function () {
  "use strict";

  var els = {};
  var audioCtx = null;
  var returnToPauseAfterInfo = false;
  var returnToPauseAfterReplay = false;
  var headerSceneKey = "";
  var headerSceneId = "";
  var headerSceneHistory = [];
  var headerNavigatingBack = false;
  var headerActionObserver = null;
  var sceneGeneration = 0;
  var timerInterval = null;
  var timerRemaining = 30 * 60;
  var TIMER_STORAGE_KEY = "fndGameTimerRemaining";

  // Optional motion layer. Every call site checks first, so the mission plays
  // identically if GSAP is missing or reduced motion is on.
  function fx() {
    return window.FNDMotion || null;
  }

  function playRecordedVoice(key) {
    if (window.FNDVoice && window.FNDVoice.playKey) window.FNDVoice.playKey(key);
  }

  function playRecordedSequence(keys) {
    if (window.FNDVoice && window.FNDVoice.playSequence) window.FNDVoice.playSequence(keys);
  }

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    initializeGameTimer();
    bindEvents();
    observeHeaderActions();
    bindTapSound();
    restoreProgress();
  }

  /* =========================================================
     Tap sound (generated in-browser — no audio file needed)
     ========================================================= */

  function getAudioCtx() {
    if (!audioCtx) {
      var AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    return audioCtx;
  }

  function playTapSound() {
    if (window.FNDAudio && !window.FNDAudio.isEnabled()) return;
    var ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  function bindTapSound() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("button") : null;
      if (btn) playTapSound();
    });
  }

  function cacheElements() {
    els.app = document.getElementById("app");
    els.stage = document.getElementById("stage");
    els.sceneEntry = document.getElementById("scene-entry");
    els.sceneByteIntro = document.getElementById("scene-byte-intro");
    els.sceneDashboard = document.getElementById("scene-dashboard");
    els.sceneComplete = document.getElementById("scene-complete");

    els.btnStartMission = document.getElementById("btnStartMission");
    els.byteIntroName = document.getElementById("byteIntroName");
    els.btnLetsBegin = document.getElementById("btnLetsBegin");

    els.welcomeName = document.getElementById("welcomeName");
    els.phonePanel = document.getElementById("phonePanel");
    els.statusLine = document.getElementById("statusLine");
    els.statusText = document.getElementById("statusText");
    els.notificationCard = document.getElementById("notificationCard");
    els.messageTime = document.getElementById("messageTime");
    els.messagePreview = document.getElementById("messagePreview");
    els.btnSeeFullMessage = document.getElementById("btnSeeFullMessage");
    els.fullMessage = document.getElementById("fullMessage");
    els.decisionPrompt = document.getElementById("decisionPrompt");
    els.decisionRow = document.getElementById("decisionRow");
    els.decisionButtons = Array.prototype.slice.call(document.querySelectorAll(".decision-btn"));
    els.forwardAlert = document.getElementById("forwardAlert");

    els.byteOverlay = document.getElementById("byteOverlay");
    els.byteLine1 = document.getElementById("byteLine1");
    els.byteLine2 = document.getElementById("byteLine2");
    els.btnInspect = document.getElementById("btnInspect");

    els.btnPause = document.getElementById("btnPause");
    els.gameHeader = document.getElementById("gameHeader");
    els.gameHeaderProgress = document.getElementById("gameHeaderProgress");
    els.btnHeaderBack = document.getElementById("btnHeaderBack");
    els.btnHeaderNext = document.getElementById("btnHeaderNext");
    els.gameHeaderTimer = document.getElementById("gameHeaderTimer");
    els.gameTimerText = document.getElementById("gameTimerText");
    els.hudProgressCount = document.getElementById("hudProgressCount");
    els.hudCtaLabel = document.getElementById("hudCtaLabel");
    els.btnHudInfo = document.getElementById("btnHudInfo");
    els.btnHudHint = document.getElementById("btnHudHint");
    els.gameBottomNav = document.querySelector(".game-bottom-nav");
    els.pauseModal = document.getElementById("pauseModal");
    els.btnResume = document.getElementById("btnResume");
    els.topControls = {
      info: document.getElementById("btnInfo"),
      fullscreen: document.getElementById("btnFullscreen"),
      restart: document.getElementById("btnRestart")
    };
    els.infoModal = document.getElementById("infoModal");
    els.btnCloseInfo = document.getElementById("btnCloseInfo");

    els.replayModal = document.getElementById("replayModal");
    els.btnReplayCancel = document.getElementById("btnReplayCancel");
    els.btnReplayConfirm = document.getElementById("btnReplayConfirm");

    els.hudSoundWrap = document.querySelector(".hud-sound-wrap");
    els.btnHudSound = document.getElementById("btnHudSound");
    els.hudSoundMenu = document.getElementById("hudSoundMenu");
    els.btnSoundReplay = document.getElementById("btnSoundReplay");
    els.btnSoundMute = document.getElementById("btnSoundMute");
    els.hudSoundMuteLabel = document.getElementById("hudSoundMuteLabel");
  }

  function bindEvents() {
    els.btnStartMission.addEventListener("click", function () {
      startMission(gameState.playerName || "Agent");
    });

    els.btnSeeFullMessage.addEventListener("click", revealFullMessage);
    els.btnLetsBegin.addEventListener("click", startIncomingFlow);

    els.decisionButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        handleDecision(btn.getAttribute("data-decision"), btn);
      });
    });

    els.btnInspect.addEventListener("click", inspectMessage);

    els.btnPause.addEventListener("click", openPauseModal);

    // HUD info hex opens mission info directly — unlike the copy inside the
    // pause modal, it has no pause screen to return to.
    if (els.btnHudInfo) {
      els.btnHudInfo.addEventListener("click", function () {
        returnToPauseAfterInfo = false;
        openInfoModal();
      });
    }

    // HUD hint bulb replays Byte's guidance for the current screen.
    if (els.btnHudHint) {
      els.btnHudHint.addEventListener("click", function () {
        if (window.FNDVoice && window.FNDVoice.replay) window.FNDVoice.replay();
        if (fx()) fx().pop(els.btnHudHint, 0.88);
      });
    }

    if (els.btnHeaderBack) els.btnHeaderBack.addEventListener("click", function () {
      closePauseModal(false);
      goToPreviousHeaderScene();
    });
    if (els.btnHeaderNext) els.btnHeaderNext.addEventListener("click", activateHeaderNextAction);
    els.btnResume.addEventListener("click", closePauseModal);
    els.topControls.info.addEventListener("click", function () {
      returnToPauseAfterInfo = true;
      closePauseModal(false);
      openInfoModal();
    });
    els.btnCloseInfo.addEventListener("click", closeInfoModal);
    els.topControls.fullscreen.addEventListener("click", function () {
      closePauseModal(false);
      toggleFullscreen();
    });
    els.topControls.restart.addEventListener("click", function () {
      returnToPauseAfterReplay = true;
      closePauseModal(false);
      openReplayModal();
    });

    els.btnReplayCancel.addEventListener("click", closeReplayModal);
    els.btnReplayConfirm.addEventListener("click", function () {
      returnToPauseAfterReplay = false;
      closeReplayModal(false);
      restartMission();
    });

    // The design's orange close tab on each plate (Figma node 201:209). It
    // routes to the same close function the existing controls already use, so
    // return-focus and the "back to pause" hand-offs keep working.
    document.addEventListener("click", function (e) {
      var tab = e.target.closest && e.target.closest("[data-close-modal]");
      if (!tab) return;
      var which = tab.getAttribute("data-close-modal");
      if (which === "replayModal") closeReplayModal();
      else if (which === "infoModal") closeInfoModal();
      else closePauseModal();
    });

    bindSoundMenu();

    document.addEventListener("keydown", function (e) {
      var openModal = els.replayModal.classList.contains("is-open") ? els.replayModal :
        els.infoModal.classList.contains("is-open") ? els.infoModal :
        els.pauseModal.classList.contains("is-open") ? els.pauseModal : null;
      if (!openModal) {
        if (e.key === "Escape" && isSoundMenuOpen()) closeSoundMenu(true);
        return;
      }

      if (e.key === "Escape") {
        if (openModal === els.replayModal) closeReplayModal();
        else if (openModal === els.infoModal) closeInfoModal();
        else closePauseModal();
      } else if (e.key === "Tab") {
        trapModalTab(e, openModal);
      }
    });
  }

  /* =========================================================
     HUD sound menu (Figma nodes 557:2699 closed / 557:2877 open)

     Both actions already exist on FNDVoice, which the pause-menu controls use
     too, so this only owns opening and closing the panel and keeping the mute
     label in step with the shared state.
     ========================================================= */

  function isSoundMenuOpen() {
    return !!(els.hudSoundMenu && !els.hudSoundMenu.hidden);
  }

  function openSoundMenu() {
    if (!els.hudSoundMenu) return;
    els.hudSoundMenu.hidden = false;
    if (els.btnHudSound) els.btnHudSound.setAttribute("aria-expanded", "true");
    syncSoundMenuLabel();
    if (window.FNDMotion && window.FNDMotion.pop) window.FNDMotion.pop(els.hudSoundMenu);
  }

  function closeSoundMenu(returnFocus) {
    if (!els.hudSoundMenu) return;
    els.hudSoundMenu.hidden = true;
    if (els.btnHudSound) {
      els.btnHudSound.setAttribute("aria-expanded", "false");
      if (returnFocus) els.btnHudSound.focus();
    }
  }

  function syncSoundMenuLabel() {
    var on = !(window.FNDVoice && window.FNDVoice.isEnabled && !window.FNDVoice.isEnabled());
    if (els.hudSoundMuteLabel) {
      els.hudSoundMuteLabel.innerHTML = on ? "Mute All<br>Sounds" : "Unmute All<br>Sounds";
    }
    if (els.btnSoundMute) els.btnSoundMute.setAttribute("aria-pressed", on ? "false" : "true");
    if (els.btnHudSound) els.btnHudSound.classList.toggle("is-muted", !on);
    if (els.btnSoundReplay) {
      els.btnSoundReplay.disabled = !on;
    }
  }

  function bindSoundMenu() {
    if (!els.btnHudSound) return;

    els.btnHudSound.addEventListener("click", function (e) {
      e.stopPropagation();
      if (isSoundMenuOpen()) closeSoundMenu(false);
      else openSoundMenu();
    });

    if (els.btnSoundReplay) {
      els.btnSoundReplay.addEventListener("click", function () {
        if (window.FNDVoice && window.FNDVoice.replay) window.FNDVoice.replay();
        closeSoundMenu(true);
      });
    }

    if (els.btnSoundMute) {
      els.btnSoundMute.addEventListener("click", function () {
        if (window.FNDVoice && window.FNDVoice.toggle) window.FNDVoice.toggle();
        syncSoundMenuLabel();
      });
    }

    // Click anywhere else dismisses it, the way a menu should behave.
    document.addEventListener("click", function (e) {
      if (!isSoundMenuOpen()) return;
      if (els.hudSoundWrap && els.hudSoundWrap.contains(e.target)) return;
      closeSoundMenu(false);
    });

    syncSoundMenuLabel();
  }

  // Keeps Tab/Shift+Tab cycling within an open modal instead of escaping to
  // scene content hidden behind the overlay.
  function fndFocusableEls(container) {
    return Array.prototype.slice
      .call(container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(function (el) { return !el.disabled && el.offsetParent !== null; });
  }

  function trapModalTab(e, modalEl) {
    var focusables = fndFocusableEls(modalEl);
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* =========================================================
     Scene control
     ========================================================= */

  function showScene(sceneEl, sceneKey) {
    var preGame = sceneKey === "entry";
    sceneGeneration += 1;

    if (headerSceneKey && headerSceneKey !== sceneKey && window.FNDVoice) {
      window.FNDVoice.stop();
    }

    if (preGame) {
      headerSceneHistory = [];
      headerSceneKey = sceneKey;
      headerSceneId = sceneEl ? sceneEl.id : "";
      headerNavigatingBack = false;
    } else if (sceneKey !== "complete") {
      // Keep every real screen in the navigation trail. Previously the landing
      // and Byte intro screens were excluded, which left Back disabled on the
      // first gameplay screens even though there was somewhere valid to return.
      if (!headerNavigatingBack && headerSceneKey && headerSceneId && headerSceneKey !== sceneKey) {
        var lastHeaderScene = headerSceneHistory[headerSceneHistory.length - 1];
        if (!lastHeaderScene || lastHeaderScene.id !== headerSceneId) {
          headerSceneHistory.push({ id: headerSceneId, key: headerSceneKey });
        }
      }
      headerSceneKey = sceneKey;
      headerSceneId = sceneEl ? sceneEl.id : "";
      headerNavigatingBack = false;
    }

    document.querySelectorAll(".scene").forEach(function (s) {
      var isTarget = s === sceneEl;
      s.classList.toggle("is-active", isTarget);
      s.setAttribute("aria-hidden", isTarget ? "false" : "true");
    });

    // Only the landing screen stays header-free. The full gameplay header is
    // visible from Byte's briefing onward.
    if (els.app) {
      els.app.classList.toggle("is-pre-game", preGame);
    }
    if (!preGame) startGameTimer();
    updateGameHeader(sceneKey);
    if (els.pauseModal) els.pauseModal.classList.remove("is-open");

    // Every screen starts the learner off with a clean slate, so the bulb has
    // to be re-earned rather than carried over from the last activity.
    if (window.fndResetHints) window.fndResetHints();

    fndSaveScene(sceneKey);
    window.dispatchEvent(new CustomEvent("fnd:sceneChange", { detail: { sceneKey: sceneKey } }));
  }

  // Exposed so Chunk 2-4 modules (loaded as separate scripts) can switch scenes.
  function fndShowScene(sceneId, sceneKey) {
    var el = document.getElementById(sceneId);
    if (el) showScene(el, sceneKey);
  }
  window.fndShowScene = fndShowScene;

  /* =========================================================
     Persistent gameplay header
     ========================================================= */

  function initializeGameTimer() {
    try {
      var saved = parseInt(sessionStorage.getItem(TIMER_STORAGE_KEY), 10);
      if (!isNaN(saved) && saved >= 0 && saved <= 30 * 60) timerRemaining = saved;
    } catch (err) {}
    renderGameTimer();
  }

  function startGameTimer() {
    if (timerInterval) return;
    timerInterval = window.setInterval(function () {
      if (!els.app || els.app.classList.contains("is-pre-game")) return;
      if (els.pauseModal && els.pauseModal.classList.contains("is-open")) return;
      if (timerRemaining <= 0) {
        renderGameTimer();
        return;
      }
      timerRemaining -= 1;
      try { sessionStorage.setItem(TIMER_STORAGE_KEY, String(timerRemaining)); } catch (err) {}
      renderGameTimer();
    }, 1000);
  }

  function resetGameTimer() {
    timerRemaining = 30 * 60;
    try { sessionStorage.removeItem(TIMER_STORAGE_KEY); } catch (err) {}
    renderGameTimer();
  }

  function renderGameTimer() {
    if (!els.gameTimerText) return;
    var minutes = Math.floor(timerRemaining / 60);
    var seconds = timerRemaining % 60;
    var formatted = String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
    els.gameTimerText.textContent = formatted;
    if (els.gameHeaderTimer) {
      els.gameHeaderTimer.classList.toggle("is-warning", timerRemaining > 0 && timerRemaining <= 5 * 60);
      els.gameHeaderTimer.classList.toggle("is-expired", timerRemaining <= 0);
      els.gameHeaderTimer.setAttribute("aria-label", minutes + " minutes and " + seconds + " seconds remaining");
    }
  }

  function headerProgressIndex(sceneKey) {
    var key = sceneKey === "complete" ? headerSceneKey : sceneKey;
    var map = { story: 0, "byte-intro": 0, dashboard: 0, chunk2: 1, chunk3: 2, chunk4: 3, chunk5: 4, chunk6: 5, chunk7: 6 };
    return map.hasOwnProperty(key) ? map[key] : 0;
  }

  function seedHeaderSceneHistory(sceneKey) {
    if (headerSceneHistory.length || headerSceneKey) return;

    var route = [
      { id: "scene-entry", key: "entry" },
      { id: "scene-byte-intro", key: "byte-intro" },
      { id: "scene-dashboard", key: "dashboard" },
      { id: "scene-chunk2", key: "chunk2" },
      { id: "scene-chunk3", key: "chunk3" },
      { id: "scene-chunk4", key: "chunk4" },
      { id: "scene-chunk5", key: "chunk5" },
      { id: "scene-chunk6", key: "chunk6" },
      { id: "scene-chunk7", key: "chunk7" }
    ];
    var targetIndex = route.findIndex(function (item) { return item.key === sceneKey; });
    if (targetIndex > 0) headerSceneHistory = route.slice(0, targetIndex);
  }

  function updateGameHeader(sceneKey) {
    if (!els.gameHeader) return;
    var index = headerProgressIndex(sceneKey);
    renderProgressLadder(index);
    var storyCanGoBack = sceneKey === "story" && window.FNDStory && window.FNDStory.canGoBack();
    var controlledLinearStep = sceneKey === "chunk5" || sceneKey === "chunk6" || sceneKey === "chunk7";
    if (els.btnHeaderBack) els.btnHeaderBack.disabled = controlledLinearStep || (!storyCanGoBack && headerSceneHistory.length === 0);
    window.requestAnimationFrame(updateHeaderNextState);
  }

  /*
    Progress ladder (Figma node 23:796). The plate carries ten stripe slots,
    the mission has seven steps, so the stripes fill proportionally while the
    count above them stays exact — the same split a progress bar and its label
    normally use.
  */
  var TOTAL_MISSION_STEPS = 7;

  function renderProgressLadder(index) {
    if (!els.gameHeaderProgress) return;
    var step = Math.min(index + 1, TOTAL_MISSION_STEPS);
    var stripes = els.gameHeaderProgress.querySelectorAll("[data-stripe]");
    var filled = stripes.length
      ? Math.max(1, Math.round((step / TOTAL_MISSION_STEPS) * stripes.length))
      : 0;

    Array.prototype.forEach.call(stripes, function (stripe, i) {
      stripe.classList.toggle("is-done", i < filled);
    });

    if (els.hudProgressCount) {
      els.hudProgressCount.textContent = step + "/" + TOTAL_MISSION_STEPS;
    }
    els.gameHeaderProgress.setAttribute(
      "aria-label",
      "Mission progress: step " + step + " of " + TOTAL_MISSION_STEPS
    );
  }

  /* =========================================================
     Hint bulb — earned, not permanent

     The bulb is help, so it shows up when the learner is actually stuck:
     after two wrong attempts on the current screen. Chunks report a wrong
     attempt through fndRegisterWrongAttempt(); the count clears whenever the
     scene changes, so each activity starts fresh.
     ========================================================= */

  var HINT_AFTER_WRONG = 2;
  var wrongAttemptCount = 0;

  function hintIsAvailable() {
    return wrongAttemptCount >= HINT_AFTER_WRONG;
  }

  function updateHintVisibility() {
    if (!els.btnHudHint) return;
    var show = hintIsAvailable();
    var wasHidden = els.btnHudHint.classList.contains("is-idle");
    els.btnHudHint.classList.toggle("is-idle", !show);
    els.btnHudHint.disabled = !show;
    // Arriving unannounced is the whole point — draw the eye once.
    if (show && wasHidden && fx()) fx().attention(els.btnHudHint);
    updateBottomRails();
  }

  /*
     The rails are the bracket the bottom controls sit in, so they appear with
     those controls rather than floating across an empty screen on their own.
  */
  function updateBottomRails() {
    if (!els.gameBottomNav) return;
    var hasAction = !!(els.btnHeaderNext && !els.btnHeaderNext.classList.contains("is-idle"));
    els.gameBottomNav.classList.toggle("has-action", hasAction);
    els.gameBottomNav.classList.toggle("has-hint", hintIsAvailable());
  }

  window.fndRegisterWrongAttempt = function () {
    wrongAttemptCount += 1;
    updateHintVisibility();
  };

  window.fndResetHints = function () {
    wrongAttemptCount = 0;
    updateHintVisibility();
  };

  window.fndRefreshHeader = function () { updateGameHeader(headerSceneKey); };

  function goToPreviousHeaderScene() {
    if (headerSceneKey === "chunk5" || headerSceneKey === "chunk6" || headerSceneKey === "chunk7") return;
    if (headerSceneKey === "chunk4" && window.Chunk2 && window.Chunk2.showWhyBuild && window.Chunk2.showWhyBuild()) {
      var bridgeHistoryIndex = -1;
      for (var i = headerSceneHistory.length - 1; i >= 0; i -= 1) {
        if (headerSceneHistory[i].key === "chunk2") {
          bridgeHistoryIndex = i;
          break;
        }
      }
      if (bridgeHistoryIndex >= 0) headerSceneHistory = headerSceneHistory.slice(0, bridgeHistoryIndex);
      headerNavigatingBack = true;
      fndShowScene("scene-chunk2", "chunk2");
      return;
    }
    if (headerSceneKey === "chunk2" && window.Chunk2 && window.Chunk2.goBack && window.Chunk2.goBack()) {
      updateGameHeader("chunk2");
      return;
    }
    if (headerSceneKey === "story" && window.FNDStory && window.FNDStory.goBack()) {
      updateGameHeader("story");
      return;
    }
    if (!headerSceneHistory.length) return;
    var previous = headerSceneHistory.pop();
    var scene = document.getElementById(previous.id);
    if (!scene) return;
    headerNavigatingBack = true;
    showScene(scene, previous.key);
  }

  function findHeaderNextAction() {
    var activeScene = document.querySelector(".scene.is-active");
    if (!activeScene) return null;
    var candidates = Array.prototype.slice.call(activeScene.querySelectorAll(".header-next-proxy"));
    for (var i = 0; i < candidates.length; i += 1) {
      var button = candidates[i];
      if (button.hasAttribute("data-header-next-ignore")) continue;
      if (button.disabled || button.hidden) continue;
      var style = window.getComputedStyle(button);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue;
      if (button.getClientRects().length === 0) continue;
      return button;
    }
    return null;
  }

  function updateHeaderNextState() {
    if (!els.btnHeaderNext) return;
    var nextAction = findHeaderNextAction();
    els.btnHeaderNext.disabled = !nextAction;
    els.btnHeaderNext.classList.toggle("is-idle", !nextAction);
    updateBottomRails();
    if (nextAction) {
      var nextLabel = (nextAction.textContent || "Next").trim().replace(/\s+/g, " ");
      els.btnHeaderNext.title = nextLabel;
      els.btnHeaderNext.setAttribute("aria-label", nextLabel);
      // The design puts the action itself on the plate, not a generic "NEXT".
      if (els.hudCtaLabel) {
        els.hudCtaLabel.textContent = nextLabel.toUpperCase();
        els.hudCtaLabel.classList.toggle("is-long", nextLabel.length > 18);
      }
    } else {
      els.btnHeaderNext.title = "Complete the current step first";
      els.btnHeaderNext.setAttribute("aria-label", "Continue — available once this step is complete");
      if (els.hudCtaLabel) {
        els.hudCtaLabel.textContent = "CONTINUE";
        els.hudCtaLabel.classList.remove("is-long");
      }
    }
  }

  function activateHeaderNextAction() {
    var nextAction = findHeaderNextAction();
    if (nextAction) nextAction.click();
  }

  function observeHeaderActions() {
    if (!els.stage || typeof MutationObserver === "undefined") return;
    headerActionObserver = new MutationObserver(function () {
      window.requestAnimationFrame(updateHeaderNextState);
    });
    headerActionObserver.observe(els.stage, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "hidden", "disabled", "aria-hidden"]
    });
  }

  // Short shared transition screen reused between every chunk boundary.
  // With a callback, it auto-advances after ~900ms; without one, it just stays
  // (used for the Chunk 4 -> Chunk 5 hand-off, since Chunk 5 does not exist yet).
  function fndShowTransition(title, subtitle, callback) {
    var titleEl = document.getElementById("transitionTitle");
    var subEl = document.getElementById("transitionSubtitle");
    if (titleEl) titleEl.textContent = title;
    if (subEl) subEl.textContent = subtitle;
    fndShowScene("scene-complete", "complete");
    var transitionGeneration = sceneGeneration;
    if (window.playChunkTransitionSound) window.playChunkTransitionSound();
    if (callback) window.setTimeout(function () {
      if (transitionGeneration !== sceneGeneration) return;
      var active = document.querySelector(".scene.is-active");
      if (active && active.id === "scene-complete") callback();
    }, 900);
  }
  window.fndShowTransition = fndShowTransition;

  /* =========================================================
     Scene 1 -> Scene 2
     ========================================================= */

  function startMission(finalName) {
    fndUpdateState({ playerName: finalName });
    els.welcomeName.textContent = finalName;
    if (els.byteIntroName) els.byteIntroName.textContent = finalName;

    showScene(els.sceneByteIntro, "byte-intro");
    playRecordedVoice("byte_intro");
  }

  function startIncomingFlow() {
    showScene(els.sceneDashboard, "dashboard");
    beginIncomingMessage();
  }


  /* =========================================================
     Scene 2: Incoming Message
     ========================================================= */

  var notificationAudio = null;

  function playNotificationSound() {
    if (window.FNDAudio && !window.FNDAudio.isEnabled()) return;
    try {
      if (!notificationAudio) {
        notificationAudio = new Audio("assets/sounds/message-notification.ogg");
        notificationAudio.preload = "auto";
        notificationAudio.volume = 0.6;
      }
      notificationAudio.currentTime = 0;
      notificationAudio.play().catch(function () {});
    } catch (err) {}
  }

  function stampMessageTime() {
    try {
      els.messageTime.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch (err) {
      /* keep the static fallback already in the markup */
    }
  }

  function beginIncomingMessage() {
    els.notificationCard.classList.remove("is-in");
    els.fullMessage.classList.remove("is-open");
    els.messagePreview.hidden = false;
    els.btnSeeFullMessage.hidden = false;
    els.decisionPrompt.hidden = true;
    els.decisionRow.hidden = true;
    els.forwardAlert.hidden = true;
    els.statusLine.hidden = false;
    els.statusText.textContent = "New forwarded message received";
    els.phonePanel.classList.remove("is-frozen", "is-dimmed");
    els.decisionButtons.forEach(function (btn) {
      btn.disabled = false;
      btn.classList.remove("is-chosen");
    });
    els.byteOverlay.classList.remove("is-in", "is-alert", "is-thoughtful", "is-concerned");
    els.byteLine2.hidden = false;
    playNotificationSound();
    stampMessageTime();
    window.setTimeout(function () {
      if (!els.sceneDashboard.classList.contains("is-active")) return;
      els.notificationCard.classList.add("is-in");
      if (fx()) fx().attention(els.btnSeeFullMessage);
    }, 150);
    window.setTimeout(function () {
      if (!els.sceneDashboard.classList.contains("is-active")) return;
      playRecordedVoice("new_message");
    }, 1150);
  }

  /* =========================================================
     Scene 3: Full Message Reveal
     ========================================================= */

  function revealFullMessage() {
    if (els.fullMessage.classList.contains("is-open")) return;

    els.fullMessage.classList.add("is-open");
    els.messagePreview.hidden = true;
    els.btnSeeFullMessage.hidden = true;
    els.statusText.textContent = "Full message opened.";

    playRecordedSequence(["open_message", "first_decision"]);

    window.setTimeout(function () {
      if (!els.sceneDashboard.classList.contains("is-active")) return;
      els.decisionPrompt.hidden = false;
      els.decisionRow.hidden = false;
      if (fx()) {
        fx().pop(els.decisionPrompt, 0.92);
        els.decisionButtons.forEach(function (btn, i) {
          window.setTimeout(function () { fx().pop(btn, 0.85); }, i * 90);
        });
      }
    }, 500);
  }

  /* =========================================================
     Scene 4: First Decision
     ========================================================= */

  function handleDecision(decision, chosenBtn) {
    fndUpdateState({ firstDecision: decision });

    els.decisionButtons.forEach(function (btn) {
      btn.disabled = true;
      btn.classList.toggle("is-chosen", btn === chosenBtn);
    });
    if (fx() && chosenBtn) fx().pop(chosenBtn, 0.86);

    // Keep consequence feedback with Byte, not inside the phone message.
    // The second recorded line invites the learner to investigate, while the
    // on-screen Byte bubble stays concise and shows only the consequence.
    els.statusLine.hidden = true;
    els.forwardAlert.hidden = true;

    if (decision === "forward") {
      els.phonePanel.classList.add("is-frozen");
      playRecordedVoice("forward_feedback");
    } else if (decision === "ignore") {
      els.phonePanel.classList.add("is-dimmed", "is-frozen");
      playRecordedVoice("ignore_feedback");
    }

    window.setTimeout(function () {
      if (!els.sceneDashboard.classList.contains("is-active")) return;
      showByte(decision);
    }, 550);
  }

  /* =========================================================
     Scene 5: Byte's Entry
     ========================================================= */

  var byteDialogue = {
    forward: ["Forwarding now would spread an unverified message."],
    ignore: ["Ignoring it will not verify the message."],
    verify: ["Nice pause, {name}!"]
  };

  function showByte(decision) {
    var lines = byteDialogue[decision] || byteDialogue.verify;
    var name = gameState.playerName || "Agent";

    els.byteLine1.textContent = lines[0].replace("{name}", name);
    els.byteLine2.textContent = lines[1] || "";
    els.byteLine2.hidden = !lines[1];

    els.byteOverlay.classList.remove("is-alert", "is-thoughtful", "is-concerned");
    if (decision === "forward") els.byteOverlay.classList.add("is-concerned");
    if (decision === "ignore") els.byteOverlay.classList.add("is-thoughtful");
    els.byteOverlay.classList.add("is-in");
    els.btnInspect.focus();

    if (fx()) {
      fx().animateByte(els.byteOverlay);
      window.setTimeout(function () { fx().attention(els.btnInspect); }, 700);
    }
  }

  /* =========================================================
     Chunk 1 completion
     ========================================================= */

  function inspectMessage() {
    fndUpdateState({ chunk1Completed: true, currentChunk: 2 });
    fndDevLog("gameState (Chunk 1 complete):", JSON.parse(JSON.stringify(gameState)));
    loadNextChunk();
  }

  // Chunk 1 -> Chunk 2 hand-off: move directly into the clue hunt.
  // The previous transition-only and investigation-intro screens were removed
  // so the learner starts inspecting the message immediately.
  function loadNextChunk() {
    window.Chunk2.init();
    fndShowScene("scene-chunk2", "chunk2");
  }

  // Detector Version 1 -> Test Lab. Transitions directly, with no
  // placeholder/continuation screen — Chunk 5 renders immediately.
  window.loadChunk5 = function () {
    if (!window.Chunk5) return;
    window.Chunk5.init();
    fndShowScene("scene-chunk5", "chunk5");
  };

  // Test Lab -> Repair Lab.
  window.loadChunk6 = function () {
    if (!window.Chunk6) return;
    window.Chunk6.init();
    fndShowScene("scene-chunk6", "chunk6");
  };

  // Repair Lab -> Final Mission.
  window.loadChunk7 = function () {
    if (!window.Chunk7) return;
    window.Chunk7.init();
    fndShowScene("scene-chunk7", "chunk7");
  };

  // Learner-triggered mission completion (the "FINISH MISSION" button).
  window.finishMission = function () {
    fndUpdateState({ missionCompleted: true });
    if (window.playMissionCompleteSound) window.playMissionCompleteSound();
    completeMission();
  };

  // Course-completion hook. No LMS/host integration exists in this project,
  // so this simply records completion and announces it for any page that
  // might be listening — safe to call even if nothing is listening.
  function completeMission() {
    fndDevLog("completeMission() called — mission finished.", gameState.playerName);
    try {
      window.dispatchEvent(new CustomEvent("fnd:missionComplete", {
        detail: { playerName: gameState.playerName, detectorName: gameState.detectorName }
      }));
    } catch (err) {}
  }
  window.completeMission = completeMission;

  /* =========================================================
     Pause, settings and confirmation modals
     ========================================================= */

  function openPauseModal() {
    if (!els.pauseModal || (els.app && els.app.classList.contains("is-pre-game"))) return;
    els.pauseModal.classList.add("is-open");
    if (window.FNDVoice && window.FNDVoice.stop) window.FNDVoice.stop();
    els.btnResume.focus();
  }

  function closePauseModal(restoreFocus) {
    if (!els.pauseModal) return;
    els.pauseModal.classList.remove("is-open");
    if (restoreFocus !== false && els.btnPause) els.btnPause.focus();
  }

  function openReplayModal() {
    els.replayModal.classList.add("is-open");
    els.btnReplayCancel.focus();
  }
  window.fndOpenReplayModal = openReplayModal;

  function closeReplayModal(restoreParent) {
    els.replayModal.classList.remove("is-open");
    if (restoreParent !== false && returnToPauseAfterReplay) {
      returnToPauseAfterReplay = false;
      openPauseModal();
    }
  }

  function openInfoModal() {
    els.infoModal.classList.add("is-open");
    els.btnCloseInfo.focus();
  }

  function closeInfoModal() {
    els.infoModal.classList.remove("is-open");
    if (returnToPauseAfterInfo) {
      returnToPauseAfterInfo = false;
      openPauseModal();
    } else if (els.btnPause) {
      els.btnPause.focus();
    }
  }

  function toggleFullscreen() {
    var docEl = document.documentElement;
    if (!document.fullscreenElement) {
      if (docEl.requestFullscreen) docEl.requestFullscreen().catch(function () {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(function () {});
    }
  }

  function restartMission() {
    returnToPauseAfterInfo = false;
    returnToPauseAfterReplay = false;
    if (els.pauseModal) els.pauseModal.classList.remove("is-open");
    if (els.infoModal) els.infoModal.classList.remove("is-open");
    if (els.replayModal) els.replayModal.classList.remove("is-open");
    fndResetState();
    resetGameTimer();

    els.welcomeName.textContent = "Agent";
    if (els.byteIntroName) els.byteIntroName.textContent = "Agent";

    els.notificationCard.classList.remove("is-in");
    els.fullMessage.classList.remove("is-open");
    els.messagePreview.hidden = false;
    els.btnSeeFullMessage.hidden = false;
    els.decisionPrompt.hidden = true;
    els.decisionRow.hidden = true;
    els.forwardAlert.hidden = true;
    els.phonePanel.classList.remove("is-frozen", "is-dimmed");
    els.statusLine.hidden = false;
    els.statusText.textContent = "New forwarded message received";

    els.decisionButtons.forEach(function (btn) {
      btn.disabled = false;
      btn.classList.remove("is-chosen");
    });

    els.byteOverlay.classList.remove("is-in", "is-alert", "is-thoughtful", "is-concerned");
    els.byteLine2.hidden = false;

    if (window.Chunk2) window.Chunk2.reset();
    if (window.Chunk3) window.Chunk3.reset();
    if (window.Chunk4) window.Chunk4.reset();
    if (window.Chunk5) window.Chunk5.reset();
    if (window.Chunk6) window.Chunk6.reset();
    if (window.Chunk7) window.Chunk7.reset();

    showScene(els.sceneEntry, "entry");
    els.btnStartMission.focus();
  }

  /* =========================================================
     Restore progress on refresh
     ========================================================= */

  function restoreProgress() {
    els.welcomeName.textContent = gameState.playerName || "Agent";

    var savedScene = fndGetSavedScene();
    var restoredSceneKey = gameState.currentChunk >= 2
      ? "chunk" + Math.min(gameState.currentChunk, 7)
      : savedScene;
    seedHeaderSceneHistory(restoredSceneKey);

    if (gameState.currentChunk === 2) {
      window.Chunk2.init();
      fndShowScene("scene-chunk2", "chunk2");
      return;
    }
    if (gameState.currentChunk === 3) {
      window.Chunk3.init();
      fndShowScene("scene-chunk3", "chunk3");
      return;
    }
    if (gameState.currentChunk === 4) {
      window.Chunk4.init();
      fndShowScene("scene-chunk4", "chunk4");
      return;
    }
    if (gameState.currentChunk === 5) {
      window.Chunk5.init();
      fndShowScene("scene-chunk5", "chunk5");
      return;
    }
    if (gameState.currentChunk === 6) {
      window.Chunk6.init();
      fndShowScene("scene-chunk6", "chunk6");
      return;
    }
    if (gameState.currentChunk >= 7) {
      window.Chunk7.init();
      fndShowScene("scene-chunk7", "chunk7");
      return;
    }

    if (savedScene === "complete" && gameState.chunk1Completed) {
      showScene(els.sceneComplete, "complete");
      return;
    }

    if (savedScene === "byte-intro") {
      if (els.byteIntroName) els.byteIntroName.textContent = gameState.playerName || "Agent";
      showScene(els.sceneByteIntro, "byte-intro");
      return;
    }

    if (savedScene === "dashboard") {
      showScene(els.sceneDashboard, "dashboard");
      els.notificationCard.classList.add("is-in");
      stampMessageTime();

      if (gameState.firstDecision) {
        els.messagePreview.hidden = true;
        els.btnSeeFullMessage.hidden = true;
        els.fullMessage.classList.add("is-open");
        els.decisionPrompt.hidden = false;
        els.decisionRow.hidden = false;

        els.decisionButtons.forEach(function (btn) {
          btn.disabled = true;
          btn.classList.toggle("is-chosen", btn.getAttribute("data-decision") === gameState.firstDecision);
        });

        els.statusLine.hidden = true;
        els.forwardAlert.hidden = true;
        if (gameState.firstDecision === "forward") {
          els.phonePanel.classList.add("is-frozen");
        } else if (gameState.firstDecision === "ignore") {
          els.phonePanel.classList.add("is-dimmed", "is-frozen");
        }

        showByte(gameState.firstDecision);
      }
      return;
    }

    showScene(els.sceneEntry, "entry");
  }

})();
