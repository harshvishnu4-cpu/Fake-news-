/* CHUNK 5 — V1 TEST VARIATION: LEARN → PREDICT → DISCOVER THE LIMIT */
(function () {
  "use strict";

  var container = null;
  var bound = false;
  var step = "test";
  var caseIndex = 0;
  var phase = "choose";
  var prediction = "";
  var warningPrediction = [];
  var results = [];
  var scanIndex = -1;
  var scanToken = 0;
  var CASES = typeof fndBuildVersion1TestCaseIds === "function"
    ? fndBuildVersion1TestCaseIds()
    : ["base-suspicious", "exam-date-changed", "bonus-marks"];
  var ACTIVE = ["source-check", "claim-check", "pressure-check"];

  function initialPhase(index) {
    return index === 1 ? "predict-checks" : "choose";
  }

  function init() {
    container = document.getElementById("scene-chunk5");
    if (!container) return;
    if (!bound) {
      container.addEventListener("click", onClick);
      bound = true;
    }
    step = "test";
    caseIndex = 0;
    phase = initialPhase(caseIndex);
    prediction = "";
    warningPrediction = [];
    results = [];
    scanIndex = -1;
    scanToken += 1;
    render();
    window.setTimeout(function () { playVoice("choose_action"); }, 120);
  }

  function reset() {
    step = "test";
    caseIndex = 0;
    phase = initialPhase(caseIndex);
    prediction = "";
    warningPrediction = [];
    results = [];
    scanIndex = -1;
    scanToken += 1;
    if (container) container.innerHTML = "";
  }

  window.Chunk5 = { init: init, reset: reset };

  function playVoice(key, onDone) {
    if (!container || !container.classList.contains("is-active")) {
      if (onDone) onDone();
      return;
    }
    if (!key) {
      if (onDone) onDone();
      return;
    }
    if (!onDone) {
      if (window.FNDVoice && window.FNDVoice.playKey) window.FNDVoice.playKey(key);
      return;
    }
    var completed = false;
    var watchdog = window.setTimeout(finish, 6000);
    // A tap while the line is still playing should not feel ignored. It stops
    // the narration and releases the gate straight away, so the player never
    // waits on a screen that looks finished. The pointerdown that started this
    // line has already been dispatched, so this cannot self-trigger.
    function skipVoice() {
      if (window.FNDVoice && window.FNDVoice.stop) window.FNDVoice.stop();
      finish();
    }
    document.addEventListener("pointerdown", skipVoice, true);
    function finish() {
      if (completed) return;
      completed = true;
      window.clearTimeout(watchdog);
      document.removeEventListener("pointerdown", skipVoice, true);
      onDone();
    }
    if (window.FNDVoice && window.FNDVoice.playKey) window.FNDVoice.playKey(key, finish);
    else finish();
  }

  function voiceEnabled() {
    return !!(window.FNDVoice && window.FNDVoice.isEnabled && window.FNDVoice.isEnabled());
  }

  function render() {
    var body = step === "test" ? renderTest() : renderReport();
    container.innerHTML = '<div class="mission-workspace' + (step === "test" ? ' test-message-workspace' : '') + '">' + body + '</div>';
    var focus = container.querySelector("[data-autofocus]");
    if (focus) focus.focus();
    afterRender();
  }

  function afterRender() {
    var fx = window.FNDMotion;
    if (!fx) return;

    // A scan step is the same screen with one more row filled in, so the
    // signature deliberately ignores scanIndex.
    fx.enter(container, step + "|" + caseIndex + "|" + phase);

    var screen = container.querySelector(".mission-phone-screen");
    if (isRunning()) {
      fx.scanBeam(screen, 1.05);
      var row = container.querySelector(".scan-result-row.is-current-check");
      if (row) fx.pop(row, 0.94);
    } else {
      fx.stopScanBeam(container);
    }

    if (phase === "done") {
      var reward = container.querySelector(".v1-progress-reward");
      if (reward) {
        fx.pop(reward, 0.85);
        if (!reward.classList.contains("is-limit")) {
          fx.burst(reward, { count: 14, colors: ["#a6ff6b", "#3fd6ff"] });
        }
      }
      fx.clearIdleHint();
    } else if (phase === "choose") {
      fx.idleHint(container, ".prediction-btn", 10000);
    } else if (phase === "predict-checks") {
      fx.idleHint(container, ".warning-prediction-card", 10000);
    } else {
      fx.clearIdleHint();
    }
  }

  function isRunning() {
    return phase === "running" || phase === "quick-running";
  }

  function resultFor(data) {
    var warningCount = 0;
    ACTIVE.forEach(function (id) {
      if (data.checkResults[id] === "warning") warningCount += 1;
    });
    if (warningCount >= 2) return { label: "DO NOT SHARE", type: "stop", warningCount: warningCount };
    return { label: "NEEDS MORE CHECKING", type: "stuck", warningCount: warningCount };
  }

  function actualWarningChecks(data) {
    return ACTIVE.filter(function (id) { return data.checkResults[id] === "warning"; });
  }

  function sameSet(a, b) {
    return a.length === b.length && a.slice().sort().join("|") === b.slice().sort().join("|");
  }

  function checkDisplay(data, id, idx) {
    var complete = phase === "done" || (isRunning() && idx < scanIndex);
    var current = isRunning() && idx === scanIndex;
    if (current) return { label: "Scanning…", cls: "is-scanning-now", complete: false };
    if (!complete) return { label: "Waiting", cls: "is-waiting", complete: false };
    var rawStatus = data.checkResults[id];
    var label = fndCheckResultLabel(rawStatus);
    return {
      label: label,
      cls: rawStatus === "warning" ? "is-warning" : rawStatus === "clear" ? "is-clear" : "is-neutral",
      complete: true
    };
  }

  function choiceLabel(id) {
    return id === "share-now" ? "SHARE NOW" : id === "verify-first" ? "VERIFY FIRST" : "DO NOT SHARE";
  }

  function checkShortLabel(id) {
    var rule = fndRuleById(id);
    return rule ? rule.name.replace(" CHECK", "") : id;
  }

  function checkListLabel(ids) {
    if (!ids.length) return "NONE";
    return ids.map(checkShortLabel).join(" + ");
  }

  function currentByteLine(data) {
    if (caseIndex === 1) {
      if (phase === "predict-checks") return "Which V1 checks do you think will show a warning?";
      if (phase === "quick-running") return "Quick scan running. Watch the checks light up.";
      return "Compare your prediction with what V1 found.";
    }
    if (phase === "choose") {
      return prediction ? "Good. We will test that choice next." : "Choose the action you think is safest.";
    }
    if (phase === "ready") {
      return caseIndex === 0
        ? "Let’s learn how V1 checks this message."
        : "Now run V1 and find out where its three checks stop.";
    }
    if (phase === "running") {
      var checkId = ACTIVE[scanIndex] || "";
      var result = data.checkResults[checkId];
      if (checkId === "source-check") return result === "warning" ? "The sender is unknown." : "The sender is known.";
      if (checkId === "claim-check") return result === "warning" ? "This is a big claim." : "The claim looks ordinary.";
      if (checkId === "pressure-check") return result === "warning" ? "It is pushing you to act quickly." : "This message is not rushing you.";
    }
    var verdict = resultFor(data);
    if (verdict.type === "stuck") return "V1 cannot fully judge this message. It needs more checks.";
    return "V1 found enough warning signs. Do not share this message.";
  }

  function renderBytePanel(data) {
    return '<div class="byte-mini test-byte-panel">' +
      '<div class="byte-mini-figure"><img src="assets/byte/byte-character.png" alt="Byte"></div>' +
      '<div class="byte-line-panel"><p>' + currentByteLine(data) + '</p></div>' +
    '</div>';
  }

  function renderStepStrip() {
    if (caseIndex === 1) {
      return '<div class="test-step-strip">' +
        '<span class="is-on">1. PREDICT</span>' +
        '<span class="' + (phase !== "predict-checks" ? 'is-on' : '') + '">2. QUICK SCAN</span>' +
        '<span class="' + (phase === "done" ? 'is-on' : '') + '">3. COMPARE</span>' +
      '</div>';
    }
    var step2 = phase === "ready" || phase === "running" || phase === "done";
    return '<div class="test-step-strip">' +
      '<span class="is-on">1. CHOOSE</span>' +
      '<span class="' + (step2 ? 'is-on' : '') + '">2. ' + (caseIndex === 0 ? 'GUIDED SCAN' : 'RUN V1') + '</span>' +
      '<span class="' + (phase === "done" ? 'is-on' : '') + '">3. RESULT</span>' +
    '</div>';
  }

  function renderRows(data) {
    var activeCheck = isRunning() && scanIndex >= 0 ? ACTIVE[scanIndex] : "";
    return ACTIVE.map(function (id, idx) {
      var rule = fndRuleById(id);
      var display = checkDisplay(data, id, idx);
      var statusIcon = '';
      if (display.complete) {
        if (display.cls === 'is-warning') statusIcon = '<i class="scan-done-tick is-warning" aria-label="Warning sign found">!</i>';
        else if (display.cls === 'is-clear') statusIcon = '<i class="scan-done-tick is-clear" aria-label="No warning sign">✓</i>';
        else statusIcon = '<i class="scan-done-tick" aria-label="Check complete">•</i>';
      }
      var status = display.complete
        ? '<span class="scan-status-wrap">' + statusIcon + '<b>' + display.label + '</b></span>'
        : '<b>' + display.label + '</b>';
      return '<div class="scan-result-row ' + display.cls + (activeCheck === id ? ' is-current-check' : '') + '"><span>' + rule.icon + '<strong>' + rule.name.replace(" CHECK", "") + '</strong></span>' + status + '</div>';
    }).join("");
  }

  function renderChoiceOptions(predictionOptions) {
    return '<div class="prediction-grid">' + predictionOptions.map(function (o) {
      var selected = prediction === o.id;
      return '<button class="prediction-btn' + (selected ? ' is-selected' : '') + '" data-action="predict" data-id="' + o.id + '" aria-pressed="' + selected + '">' + o.label + '</button>';
    }).join("") + '</div>';
  }

  function renderWarningPredictionCards() {
    return '<div class="warning-prediction-grid">' + ACTIVE.map(function (id) {
      var rule = fndRuleById(id);
      var on = warningPrediction.indexOf(id) !== -1;
      return '<button class="warning-prediction-card' + (on ? ' is-selected' : '') + '" data-action="predict-warning" data-id="' + id + '" aria-pressed="' + on + '">' +
        '<span>' + rule.icon + '</span><strong>' + rule.name.replace(" CHECK", "") + '</strong><small>' + (on ? 'PREDICTED WARNING' : 'Tap if warning') + '</small>' +
      '</button>';
    }).join("") + '</div>';
  }

  function renderProgressReward(verdict) {
    if (verdict.type === "stuck") {
      return '<div class="v1-progress-reward is-limit"><span>!</span><strong>V1 LIMIT FOUND</strong><small>One message needs stronger checks.</small></div>';
    }
    var stopped = results.filter(function (item) { return !item.stuck; }).length;
    if (phase === "done" && results.length === caseIndex) stopped += 1;
    return '<div class="v1-progress-reward"><span>✓</span><strong>MESSAGE STOPPED</strong><small>' + stopped + ' of 3 test messages</small></div>';
  }

  function phoneOptionsFor(data) {
    if (data.id === "bonus-marks") {
      return {
        activeCheck: isRunning() && scanIndex >= 0 ? ACTIVE[scanIndex] : "",
        completedChecks: phase === "done" ? ACTIVE.slice() : isRunning() ? ACTIVE.slice(0, Math.max(0, scanIndex)) : [],
        metadata: ["Known group admin", "No circular or link", "No urgent push"],
        metaCheckMap: ["source-check", "proof-check", "pressure-check"]
      };
    }
    return {
      activeCheck: isRunning() && scanIndex >= 0 ? ACTIVE[scanIndex] : "",
      completedChecks: phase === "done" ? ACTIVE.slice() : isRunning() ? ACTIVE.slice(0, Math.max(0, scanIndex)) : []
    };
  }

  function renderStandardCase(data, verdict, predictionOptions) {
    if (phase === "choose") {
      return '<h3 data-autofocus tabindex="-1">Before running V1, choose the safest action.</h3>' +
        renderChoiceOptions(predictionOptions) +
        renderBytePanel(data) +
        '<button class="btn-primary compact-btn" data-action="to-run" ' + (!prediction ? 'disabled' : '') + '>NEXT</button>';
    }
    if (phase === "ready") {
      return '<h3 data-autofocus tabindex="-1">' + (caseIndex === 0 ? 'Learn how V1 checks.' : 'Now test V1’s limit.') + '</h3>' +
        '<div class="prediction-reveal"><small>YOUR CHOICE</small><strong>' + choiceLabel(prediction) + '</strong></div>' +
        renderBytePanel(data) +
        '<div class="scan-result-list">' + renderRows(data) + '</div>' +
        '<button class="btn-primary compact-btn" data-action="run">' + (caseIndex === 0 ? 'START GUIDED SCAN' : 'RUN V1') + '</button>';
    }
    if (phase === "running") {
      return '<h3 data-autofocus tabindex="-1">' + (caseIndex === 0 ? 'Byte is guiding the scan.' : 'V1 is checking the message.') + '</h3>' +
        '<div class="prediction-reveal"><small>YOUR CHOICE</small><strong>' + choiceLabel(prediction) + '</strong></div>' +
        renderBytePanel(data) +
        '<div class="scan-result-list">' + renderRows(data) + '</div>' +
        '<button class="btn-primary compact-btn" disabled>SCANNING…</button>';
    }

    var stuck = verdict.type === "stuck";
    return '<h3 data-autofocus tabindex="-1">' + (stuck ? 'V1 found its limit.' : 'V1 stopped the message.') + '</h3>' +
      '<div class="scan-result-list">' + renderRows(data) + '</div>' +
      '<div class="test-compare-grid">' +
        '<div class="prediction-reveal"><small>YOUR CHOICE</small><strong>' + choiceLabel(prediction) + '</strong></div>' +
        '<div class="prediction-reveal detector-outcome-row ' + (stuck ? 'is-verify' : 'is-stop') + '"><small>V1 RESULT</small><strong>' + verdict.label + '</strong></div>' +
      '</div>' +
      renderProgressReward(verdict) +
      '<button class="btn-primary compact-btn" data-action="next">' + (caseIndex < CASES.length - 1 ? 'NEXT MESSAGE' : 'SEE TEST REPORT') + '</button>';
  }

  function renderPredictionCase(data, verdict) {
    if (phase === "predict-checks") {
      return '<h3 data-autofocus tabindex="-1">Predict which checks will show a warning.</h3>' +
        '<p class="micro-instruction v1-challenge-helper">Select one or more checks, then run a quick scan.</p>' +
        renderWarningPredictionCards() +
        renderBytePanel(data) +
        '<button class="btn-primary compact-btn" data-action="run-quick" ' + (!warningPrediction.length ? 'disabled' : '') + '>RUN QUICK SCAN</button>';
    }
    if (phase === "quick-running") {
      return '<h3 data-autofocus tabindex="-1">Quick scan in progress.</h3>' +
        '<div class="prediction-reveal"><small>YOUR PREDICTION</small><strong>' + checkListLabel(warningPrediction) + '</strong></div>' +
        renderBytePanel(data) +
        '<div class="scan-result-list">' + renderRows(data) + '</div>' +
        '<button class="btn-primary compact-btn" disabled>QUICK SCAN…</button>';
    }

    var actual = actualWarningChecks(data);
    var matched = sameSet(warningPrediction, actual);
    return '<h3 data-autofocus tabindex="-1">Compare your prediction.</h3>' +
      '<div class="scan-result-list">' + renderRows(data) + '</div>' +
      '<div class="test-compare-grid challenge-compare-grid">' +
        '<div class="prediction-reveal"><small>YOU PREDICTED</small><strong>' + checkListLabel(warningPrediction) + '</strong></div>' +
        '<div class="prediction-reveal detector-outcome-row is-stop"><small>V1 FOUND</small><strong>' + checkListLabel(actual) + '</strong></div>' +
      '</div>' +
      '<div class="inline-feedback ' + (matched ? 'is-correct' : 'is-neutral') + '"><strong>' + (matched ? 'Sharp prediction!' : 'Good try—compare the checks.') + '</strong><span>' + (matched ? 'You predicted the warning pattern correctly.' : 'A known sender can still carry a risky claim.') + '</span></div>' +
      renderProgressReward(verdict) +
      '<button class="btn-primary compact-btn" data-action="next">NEXT MESSAGE</button>';
  }

  function renderTest() {
    var data = fndGetTestCase(CASES[caseIndex]);
    var verdict = phase === "done" ? resultFor(data) : null;
    var predictionOptions = [
      { id: "share-now", label: "SHARE NOW" },
      { id: "verify-first", label: "VERIFY FIRST" },
      { id: "do-not-share", label: "DO NOT SHARE" }
    ];

    var panelContent = caseIndex === 1
      ? renderPredictionCase(data, verdict)
      : renderStandardCase(data, verdict, predictionOptions);

    return fndMissionHeader("TEST MESSAGE " + (caseIndex + 1), (caseIndex + 1) + " / " + CASES.length) +
      '<div class="mission-two-col test-message-layout">' +
        fndPhoneMarkup(data, phoneOptionsFor(data)) +
        '<div class="glass-panel detector-test-panel test-case-' + (caseIndex + 1) + ' phase-' + phase + (isRunning() ? ' is-scanning' : '') + '">' +
          renderStepStrip() +
          panelContent +
        '</div>' +
      '</div>';
  }

  function renderReport() {
    var stopped = results.filter(function (item) { return !item.stuck; }).length;
    var needsMore = results.filter(function (item) { return item.stuck; }).length;
    return fndMissionHeader("V1 TEST REPORT", "Upgrade needed") +
      '<div class="glass-panel test-report-panel concise-report v1-three-report">' +
        '<div class="report-score"><strong>' + stopped + '</strong><span>messages stopped by V1</span></div>' +
        '<div class="report-failure-card">' +
          '<div class="claim-poster" aria-hidden="true"><span>100</span><b>BONUS MARKS?</b></div>' +
          '<div><span class="report-badge">' + needsMore + ' MESSAGE NEEDS MORE CHECKING</span><h3 data-autofocus tabindex="-1">V1 needs more checks.</h3><p>It stopped two obvious messages, but it cannot fully verify this claim.</p></div>' +
        '</div>' +
        '<button class="btn-primary compact-btn" data-action="upgrade">ADD MORE CHECKS</button>' +
      '</div>';
  }

  function scanVoiceKey(data, checkId) {
    var result = data.checkResults[checkId];
    if (checkId === "source-check") return result === "warning" ? "source_unknown" : "source_known";
    if (checkId === "claim-check") return "claim_big";
    if (checkId === "pressure-check") return result === "warning" ? "pressure_warning" : "pressure_clear";
    return "";
  }

  function recordCurrentResult(data, verdict) {
    results.push({
      id: data.id,
      prediction: prediction,
      warningPrediction: warningPrediction.slice(),
      verdict: verdict.label,
      stuck: verdict.type === "stuck"
    });
  }

  function finishScan(token, quick) {
    if (token !== scanToken || !isRunning()) return;
    var data = fndGetTestCase(CASES[caseIndex]);
    var verdict = resultFor(data);
    recordCurrentResult(data, verdict);
    phase = "done";
    scanIndex = ACTIVE.length;
    render();

    if (quick) {
      if (window.playSafeResultSound) window.playSafeResultSound();
      return;
    }
    playVoice(verdict.type === "stuck" ? "v1_needs_more" : "v1_stopped");
  }

  function playCurrentCheck(token) {
    if (token !== scanToken || phase !== "running") return;
    var data = fndGetTestCase(CASES[caseIndex]);
    var checkId = ACTIVE[scanIndex];
    if (window.playDetectorCheckSound) window.playDetectorCheckSound(checkId);
    var voiceKey = scanVoiceKey(data, checkId);
    playVoice(voiceKey, function () {
      var wait = voiceEnabled() ? 450 : 1150;
      window.setTimeout(function () {
        if (token !== scanToken || phase !== "running") return;
        if (scanIndex < ACTIVE.length - 1) {
          scanIndex += 1;
          render();
          playCurrentCheck(token);
        } else {
          finishScan(token, false);
        }
      }, wait);
    });
  }

  function advanceQuickScan(token) {
    if (token !== scanToken || phase !== "quick-running") return;
    var checkId = ACTIVE[scanIndex];
    if (window.playDetectorCheckSound) window.playDetectorCheckSound(checkId);
    window.setTimeout(function () {
      if (token !== scanToken || phase !== "quick-running") return;
      if (scanIndex < ACTIVE.length - 1) {
        scanIndex += 1;
        render();
        advanceQuickScan(token);
      } else {
        finishScan(token, true);
      }
    }, 620);
  }

  function moveToNextCase() {
    caseIndex += 1;
    phase = initialPhase(caseIndex);
    prediction = "";
    warningPrediction = [];
    scanIndex = -1;
    render();
    if (caseIndex === 1) playVoice("test_message_2");
    else if (phase === "choose") playVoice("choose_action");
    else if (window.playPanelOpenSound) window.playPanelOpenSound();
  }

  var ACTIONS = {
    predict: function (t) {
      if (phase !== "choose") return;
      prediction = t.getAttribute("data-id");
      render();
    },
    "predict-warning": function (t) {
      if (phase !== "predict-checks") return;
      var id = t.getAttribute("data-id");
      var pos = warningPrediction.indexOf(id);
      if (pos === -1) warningPrediction.push(id);
      else warningPrediction.splice(pos, 1);
      render();
    },
    "to-run": function () {
      if (!prediction || phase !== "choose") return;
      phase = "ready";
      render();
      playVoice("run_v1");
    },
    run: function () {
      if (!prediction || phase !== "ready") return;
      phase = "running";
      scanIndex = 0;
      scanToken += 1;
      var token = scanToken;
      render();
      playCurrentCheck(token);
    },
    "run-quick": function () {
      if (!warningPrediction.length || phase !== "predict-checks") return;
      phase = "quick-running";
      scanIndex = 0;
      scanToken += 1;
      var token = scanToken;
      render();
      advanceQuickScan(token);
    },
    next: function () {
      scanToken += 1;
      if (window.FNDVoice && window.FNDVoice.stop) window.FNDVoice.stop();
      if (caseIndex < CASES.length - 1) {
        moveToNextCase();
      } else {
        var stopped = results.filter(function (item) { return !item.stuck; }).length;
        fndUpdateState({
          version1TestCases: CASES.slice(),
          version1TestResults: results.slice(),
          casesHandledSafelyV1: stopped,
          chunk5Completed: true
        });
        step = "report";
        render();
        playVoice("v1_report");
      }
    },
    upgrade: function () {
      fndUpdateState({ currentChunk: 6 });
      window.Chunk6.init();
      window.fndShowScene("scene-chunk6", "chunk6");
    }
  };

  function onClick(e) {
    var t = e.target.closest("[data-action]");
    if (!t) return;
    var fn = ACTIONS[t.getAttribute("data-action")];
    if (fn) fn(t);
  }
})();
