/* CHUNK 6 — DISCOVER PROOF + CONFIRM, UPGRADE, RETEST, THEN ORDER THE PROCESS */
(function () {
  "use strict";

  var container = null;
  var bound = false;
  var step = "choose";
  var selectedMissing = [];
  var added = [];
  var chooseAttempts = 0;
  var chooseResult = "";
  var dragPick = "";
  var scanDone = false;
  var scanRunning = false;
  var selectedVerdict = "";
  var verdictResult = "";
  var verdictAttempts = 0;
  var processOrder = [];
  var processResult = "";
  var processAttempts = 0;
  var retestGuidanceReady = false;
  var lastInstalled = "";
  var movedIndex = -1;

  var V1 = ["source-check", "claim-check", "pressure-check"];
  var MISSING = ["proof-check", "confirm-check"];
  var UPGRADE_OPTIONS = [
    { id: "proof-check", name: "PROOF CHECK", question: "What proves it?", icon: FND_ICONS.proof, correct: true },
    { id: "appearance-check", name: "APPEARANCE CHECK", question: "Does it look official?", icon: FND_ICONS.app, correct: false },
    { id: "confirm-check", name: "CONFIRM CHECK", question: "Can I confirm it?", icon: FND_ICONS.shield, correct: true },
    { id: "popularity-check", name: "POPULARITY CHECK", question: "Did many people share it?", icon: FND_ICONS.group, correct: false }
  ];
  var CORRECT_PROCESS = ["read", "run", "review", "decide"];
  var PROCESS_STEPS = {
    read: { label: "READ THE MESSAGE", detail: "Notice the sender and the claim." },
    run: { label: "RUN ALL 5 CHECKS", detail: "Use Source, Claim, Proof, Pressure and Confirm." },
    review: { label: "REVIEW THE RESULTS", detail: "See what is clear and what is a warning." },
    decide: { label: "DECIDE WHAT TO DO", detail: "Choose the safest action." }
  };

  var RETEST_REASONS = {
    "source-check": "Known group admin",
    "claim-check": "Big claim: 100 bonus marks",
    "proof-check": "No circular or link",
    "pressure-check": "No urgent push",
    "confirm-check": "No official match"
  };

  function init() {
    container = document.getElementById("scene-chunk6");
    if (!container) return;
    if (!bound) {
      container.addEventListener("click", onClick);
      container.addEventListener("dragstart", onDragStart);
      container.addEventListener("dragover", onDragOver);
      container.addEventListener("drop", onDrop);
      bound = true;
    }
    step = "choose";
    selectedMissing = [];
    added = [];
    chooseAttempts = 0;
    chooseResult = "";
    dragPick = "";
    scanDone = false;
    scanRunning = false;
    selectedVerdict = "";
    verdictResult = "";
    verdictAttempts = 0;
    processOrder = ["decide", "read", "review", "run"];
    processResult = "";
    processAttempts = 0;
    retestGuidanceReady = false;
    lastInstalled = "";
    movedIndex = -1;
    render();
  }

  function reset() {
    step = "choose";
    selectedMissing = [];
    added = [];
    chooseAttempts = 0;
    chooseResult = "";
    dragPick = "";
    scanDone = false;
    scanRunning = false;
    selectedVerdict = "";
    verdictResult = "";
    verdictAttempts = 0;
    processOrder = ["decide", "read", "review", "run"];
    processResult = "";
    processAttempts = 0;
    retestGuidanceReady = false;
    lastInstalled = "";
    movedIndex = -1;
    if (container) container.innerHTML = "";
  }

  window.Chunk6 = { init: init, reset: reset };

  function playVoice(key, onDone) {
    if (!container || !container.classList.contains("is-active")) {
      if (onDone) onDone();
      return;
    }
    if (!onDone) {
      if (window.FNDVoice && window.FNDVoice.playKey) window.FNDVoice.playKey(key);
      return;
    }
    var completed = false;
    var watchdog = window.setTimeout(finish, 5000);
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

  function render() {
    var body = "";
    if (step === "choose") body = renderChoose();
    if (step === "unlocked") body = renderUnlocked();
    if (step === "upgrade") body = renderUpgrade();
    if (step === "retest") body = renderRetest();
    if (step === "ready") body = renderReady();
    if (step === "order") body = renderProcessOrder();
    container.innerHTML = '<div class="mission-workspace">' + body + '</div>';
    var focus = container.querySelector("[data-autofocus]");
    if (focus) focus.focus();
    afterRender();
  }

  function afterRender() {
    var fx = window.FNDMotion;
    if (!fx) return;

    // Installing a check and running the scan are new screens within a step;
    // picking an option is not.
    var signature = step;
    if (step === "upgrade") signature += "|" + added.length;
    if (step === "retest") signature += "|" + (scanDone ? "scanned" : scanRunning ? "scanning" : "ready");
    fx.enter(container, signature);

    var screen = container.querySelector(".mission-phone-screen");
    if (step === "retest" && scanRunning) fx.scanBeam(screen, 0.9);
    else fx.stopScanBeam(container);

    var wrong = chooseResult === "retry" || verdictResult === "retry" || processResult === "retry";
    var right = chooseResult === "correct" || verdictResult === "correct" || processResult === "correct";
    var feedback = container.querySelector(".inline-feedback.is-retry, .inline-feedback.is-correct");

    if (wrong && feedback) fx.shake(feedback);
    if (right && feedback) {
      fx.pop(feedback, 0.9);
      fx.burst(feedback, { count: 16, colors: ["#a6ff6b", "#3fd6ff"] });
    }

    if (step === "upgrade" && lastInstalled) {
      var chip = container.querySelector('.builder-slot-chip.is-active[data-installed="' + lastInstalled + '"]');
      if (chip) {
        fx.pop(chip, 0.7);
        fx.burst(chip, { count: 10, spread: 90, colors: ["#3fd6ff", "#8b6bff"] });
      }
      lastInstalled = "";
    }

    if (step === "order" && movedIndex >= 0) {
      var rows = container.querySelectorAll(".process-order-row");
      if (rows[movedIndex]) fx.pop(rows[movedIndex], 0.9);
      movedIndex = -1;
    }
  }

  function renderChoose() {
    var solvedChoice = chooseResult === "correct" || chooseResult === "revealed";
    var cards = UPGRADE_OPTIONS.map(function (option) {
      var on = selectedMissing.indexOf(option.id) !== -1;
      var revealedCorrect = chooseResult === "revealed" && option.correct;
      return '<button class="missing-tool-card upgrade-missing-card upgrade-option-card' + (on ? ' is-selected' : '') + (revealedCorrect ? ' is-correct-answer' : '') + '" data-action="pick-missing" data-id="' + option.id + '" aria-pressed="' + on + '" ' + (solvedChoice ? 'disabled' : '') + '>' +
        '<span>' + option.icon + '</span><strong>' + option.name + '</strong><small>' + option.question + '</small>' +
      '</button>';
    }).join("");

    var feedback = '<div class="inline-feedback is-neutral upgrade-choice-feedback"><strong>Choose exactly 2 checks.</strong><span>Looks and popularity do not prove that a message is true.</span></div>';
    if (chooseResult === "retry") {
      feedback = '<div class="inline-feedback is-retry upgrade-choice-feedback"><strong>Try once more.</strong><span>Which checks examine evidence and confirm the claim on a trusted source?</span></div>';
    }
    if (chooseResult === "correct") {
      feedback = '<div class="inline-feedback is-correct upgrade-choice-feedback"><strong>Correct!</strong><span>Proof tests the evidence. Confirm checks a trusted source.</span></div>';
    }
    if (chooseResult === "revealed") {
      feedback = '<div class="inline-feedback is-neutral upgrade-choice-feedback answer-revealed-feedback"><strong>Correct checks shown.</strong><span>Proof Check and Confirm Check fill the two missing gaps.</span></div>';
    }

    var cta = solvedChoice
      ? '<button class="btn-primary compact-btn corrected-upgrade-cta" data-action="unlock-missing">UNLOCK CHECKS</button>'
      : '<button class="btn-primary compact-btn corrected-upgrade-cta" data-action="check-missing" ' + (selectedMissing.length !== 2 ? 'disabled' : '') + '>CHECK MY CHOICE</button>';

    return fndMissionHeader("UPGRADE V1", solvedChoice ? "Ready to unlock" : "Choose 2 checks") +
      '<div class="glass-panel missing-tools-panel cleaner-upgrade-panel corrected-upgrade-panel distractor-upgrade-panel">' +
        '<div class="v1-check-strip corrected-v1-strip"><small>V1 ALREADY HAS</small><div class="active-rule-chips">' + V1.map(function (id) {
          var r = fndRuleById(id);
          return '<span class="active-rule-chip">' + r.icon + r.name.replace(" CHECK", "") + '</span>';
        }).join("") + '</div></div>' +
        '<h3 data-autofocus tabindex="-1">Which 2 checks should V1 add?</h3>' +
        '<div class="byte-mini upgrade-byte-guidance">' +
          '<div class="byte-mini-figure"><img src="assets/byte/byte-character.png" alt="Byte"></div>' +
          '<div class="byte-line-panel"><p>V1 already checks Source, Claim and Pressure. Choose 2 checks that can test evidence and confirm the message.</p></div>' +
        '</div>' +
        '<div class="missing-tool-grid corrected-missing-grid distractor-option-grid">' + cards + '</div>' +
        feedback + cta +
      '</div>';
  }

  function renderUnlocked() {
    return fndMissionHeader("2 NEW CHECKS UNLOCKED", "V2 upgrade") +
      '<div class="glass-panel checks-unlocked-panel two-check-unlock">' +
        '<div class="five-check-orbit three-check-orbit">' + MISSING.map(function (id) {
          var rule = fndRuleById(id);
          return '<div class="orbit-check is-new"><span>' + rule.icon + '</span><strong>' + rule.name.replace(" CHECK", "") + '</strong><small>' + rule.shortQuestion + '</small></div>';
        }).join("") + '</div>' +
        '<h3 data-autofocus tabindex="-1">Now V1 can check proof and confirm the claim.</h3>' +
        '<button class="btn-primary compact-btn" data-action="go-upgrade">UPGRADE V1</button>' +
      '</div>';
  }

  function renderUpgrade() {
    var available = MISSING.filter(function (id) { return added.indexOf(id) === -1; });
    var cards = available.map(function (id) {
      var rule = fndRuleById(id);
      return '<button class="upgrade-check-card clean-install-card" data-action="add" data-id="' + id + '" data-draggable-check="' + id + '" draggable="true">' +
        '<span>' + rule.icon + '</span><strong>' + rule.name + '</strong><small>Drag or tap to install</small>' +
      '</button>';
    }).join("");

    var detectorSlots = FND_CHECK_ORDER.map(function (id) {
      var rule = fndRuleById(id);
      var active = V1.indexOf(id) !== -1 || added.indexOf(id) !== -1;
      var canDrop = !active && MISSING.indexOf(id) !== -1;
      return '<div class="builder-slot-chip' + (active ? ' is-active' : ' is-empty') + (canDrop ? ' is-drop-target' : '') + '" data-installed="' + id + '" ' + (canDrop ? 'data-slot-check="' + id + '"' : '') + '>' +
        (active
          ? '<span class="builder-slot-icon">' + rule.icon + '</span><strong>' + rule.name.replace(" CHECK", "") + '</strong><small>' + (V1.indexOf(id) !== -1 ? 'V1 check' : 'Installed') + '</small>'
          : '<span class="builder-empty-icon">+</span><strong>' + rule.name.replace(" CHECK", "") + '</strong><small>Drop here</small>') +
      '</div>';
    }).join("");

    var statusText = added.length === 2 ? 'Both installed' : (added.length + ' of 2 installed');
    var installArea = cards
      ? '<div class="upgrade-check-grid clean-upgrade-card-grid">' + cards + '</div>'
      : '<div class="inline-feedback is-correct upgrade-install-note compact-install-success"><strong>Both checks installed.</strong><span>Detector V2 now has all 5 checks.</span></div>';

    return fndMissionHeader("UPGRADE TO V2", (3 + added.length) + " / 5") +
      '<div class="detector-builder-layout detector-builder-layout-clean compact-v2-builder">' +
        '<div class="glass-panel detector-core-panel detector-core-panel-clean compact-detector-core">' +
          '<img src="assets/illustrations/detector-scanner.svg" alt="Detector upgrade">' +
          '<div class="detector-builder-slots clean-detector-slots compact-detector-slots">' + detectorSlots + '</div>' +
        '</div>' +
        '<div class="glass-panel detector-rule-panel detector-rule-panel-clean compact-install-panel">' +
          '<div class="install-panel-heading"><div><h3 data-autofocus tabindex="-1">Install the 2 new checks.</h3><p class="micro-instruction">Drag each card to its matching empty slot, or tap the card.</p></div><span class="install-count-pill">' + statusText + '</span></div>' +
          installArea +
          '<button class="btn-primary compact-btn activate-v2-cta" data-action="activate" ' + (added.length !== 2 ? 'disabled' : '') + '>ACTIVATE V2</button>' +
        '</div>' +
      '</div>';
  }

  function retestRow(data, id) {
    var rule = fndRuleById(id);
    var rawStatus = data.checkResults[id];
    var label = scanDone ? fndCheckResultLabel(rawStatus) : "Waiting";
    var cls = !scanDone ? "is-waiting" : rawStatus === "warning" ? "is-warning" : rawStatus === "clear" ? "is-clear" : "is-neutral";
    var detail = scanDone ? RETEST_REASONS[id] : "Run V2 to see what this check reads.";
    return '<div class="scan-result-row scan-result-row-detail ' + cls + '">' +
      '<span class="scan-result-main"><span class="scan-result-icon">' + rule.icon + '</span><span class="scan-result-copy"><strong>' + rule.name.replace(" CHECK", "") + '</strong><small>' + detail + '</small></span></span>' +
      '<b>' + label + '</b></div>';
  }

  function renderRetest() {
    var data = fndGetTestCase("bonus-marks");
    var solved = verdictResult === "correct" || verdictResult === "revealed";
    var rows = FND_CHECK_ORDER.map(function (id) { return retestRow(data, id); }).join("");

    var options = FND_STATUS_OPTIONS.map(function (o) {
      var correct = verdictResult === "revealed" && o.id === "unverified";
      return '<button class="verdict-choice' + (selectedVerdict === o.id ? ' is-selected' : '') + (correct ? ' is-correct-answer' : '') + '" data-action="pick-verdict" data-id="' + o.id + '" ' + (!scanDone || solved ? 'disabled' : '') + '><strong>' + o.label + '</strong></button>';
    }).join("");

    var feedback = "";
    if (verdictResult === "retry") feedback = '<div class="inline-feedback is-retry retest-feedback"><strong>Try once more.</strong><span>Look at Proof and Confirm.</span></div>';
    if (verdictResult === "correct") feedback = '<div class="inline-feedback is-correct retest-feedback"><strong>Correct: NEEDS MORE CHECKING</strong><span>No proof. No official match.</span></div>';
    if (verdictResult === "revealed") feedback = '<div class="inline-feedback is-neutral retest-feedback answer-revealed-feedback"><strong>Correct answer shown: NEEDS MORE CHECKING</strong><span>Proof and official confirmation are missing.</span></div>';

    var cta = "";
    if (!scanDone) {
      var disabled = scanRunning || !retestGuidanceReady;
      var label = !retestGuidanceReady ? "LISTEN TO BYTE…" : (scanRunning ? "SCANNING…" : "RUN ALL 5");
      cta = '<button class="btn-primary compact-btn" data-action="scan-all" ' + (disabled ? 'disabled' : '') + '>' + label + '</button>';
    } else if (!solved) {
      cta = '<button class="btn-primary compact-btn" data-action="check-verdict" ' + (!selectedVerdict ? 'disabled' : '') + '>CHECK ANSWER</button>';
    } else {
      cta = '<button class="btn-primary compact-btn" data-action="ready">CONTINUE TO V2</button>';
    }

    return fndMissionHeader("RETEST THE SAME MESSAGE", "V2: all 5 checks") +
      '<div class="mission-two-col test-message-layout retest-layout-fixed">' +
        fndPhoneMarkup(data, { metaCheckMap: ["source-check", "proof-check", "confirm-check"] }) +
        '<div class="glass-panel detector-test-panel retest-panel retest-panel-fixed">' +
          '<div class="retest-main-content">' +
            '<h3 data-autofocus tabindex="-1">' + (scanRunning ? 'Detector V2 is scanning.' : !scanDone ? 'Run V2 on the same message.' : 'Now decide.') + '</h3>' +
            (!scanDone
              ? '<div class="byte-mini retest-byte-guide compact-retest-byte"><div class="byte-mini-figure"><img src="assets/byte/byte-character.png" alt="Byte"></div><div class="byte-line-panel"><p>Run all 5 checks on the same message. Then decide again using the full result.</p></div></div>'
              : '<p class="micro-instruction retest-helper">Each line shows what the message tells that check.</p>') +
            '<div class="scan-result-list five-rows detail-rows compact-five-rows fixed-five-rows">' + rows + '</div>' +
            (scanDone ? '<div class="verdict-choice-grid compact retest-choice-grid fixed-verdict-grid">' + options + '</div>' : '') +
          '</div>' +
          '<div class="retest-bottom-zone' + (feedback ? ' has-feedback' : '') + '">' +
            feedback +
            '<div class="retest-cta-row fixed-retest-cta">' + cta + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderReady() {
    return fndMissionHeader("DETECTOR V2 READY", "5 checks active") +
      '<div class="glass-panel detector-ready-panel">' +
        '<div class="detector-ready-visual"><div class="scanner-ring one"></div><div class="scanner-ring two"></div><img src="assets/illustrations/detector-scanner.svg" alt="Upgraded detector"></div>' +
        '<div class="detector-ready-copy">' +
          '<div class="active-rule-chips five-active-chips">' + FND_CHECK_ORDER.map(function (id) {
            var r = fndRuleById(id);
            return '<span class="active-rule-chip">' + r.icon + r.name.replace(" CHECK", "") + '</span>';
          }).join("") + '</div>' +
          '<h3 data-autofocus tabindex="-1">Full investigation unlocked.</h3>' +
          '<p>Before the final mission, put the detector process in order.</p>' +
          '<button class="btn-primary compact-btn" data-action="practice-process">PRACTISE THE PROCESS</button>' +
        '</div>' +
      '</div>';
  }

  function processMatches() {
    return processOrder.join("|") === CORRECT_PROCESS.join("|");
  }

  function renderProcessOrder() {
    var solved = processResult === "correct" || processResult === "revealed";
    var rows = processOrder.map(function (id, index) {
      var item = PROCESS_STEPS[id];
      return '<div class="process-order-row' + (solved ? ' is-solved' : '') + '">' +
        '<span class="process-number">' + (index + 1) + '</span>' +
        '<span class="process-copy"><strong>' + item.label + '</strong><small>' + item.detail + '</small></span>' +
        '<span class="process-move-controls">' +
          '<button type="button" data-action="move-process" data-index="' + index + '" data-dir="up" aria-label="Move ' + item.label + ' up" ' + (index === 0 || solved ? 'disabled' : '') + '>↑</button>' +
          '<button type="button" data-action="move-process" data-index="' + index + '" data-dir="down" aria-label="Move ' + item.label + ' down" ' + (index === processOrder.length - 1 || solved ? 'disabled' : '') + '>↓</button>' +
        '</span>' +
      '</div>';
    }).join("");

    var feedback = '<div class="inline-feedback is-neutral process-feedback"><strong>Start with the message.</strong><span>Move each step into the order the detector should follow.</span></div>';
    if (processResult === "retry") {
      feedback = '<div class="inline-feedback is-retry process-feedback"><strong>Try once more.</strong><span>The detector must read the message before it can run the checks.</span></div>';
    }
    if (processResult === "correct") {
      feedback = '<div class="inline-feedback is-correct process-feedback"><strong>Correct process!</strong><span>Read → Run checks → Review → Decide.</span></div>';
    }
    if (processResult === "revealed") {
      feedback = '<div class="inline-feedback is-neutral process-feedback answer-revealed-feedback"><strong>Correct order shown.</strong><span>Review it: Read → Run checks → Review → Decide.</span></div>';
    }

    return fndMissionHeader("PUT THE STEPS IN ORDER", "Final practice") +
      '<div class="glass-panel process-order-panel">' +
        '<h3 data-autofocus tabindex="-1">How should Detector V2 investigate a message?</h3>' +
        '<div class="process-order-list">' + rows + '</div>' +
        feedback +
        (solved
          ? '<button class="btn-primary compact-btn" data-action="finish">START FINAL MISSION</button>'
          : '<button class="btn-primary compact-btn" data-action="check-process">CHECK ORDER</button>') +
      '</div>';
  }

  function isCorrectMissingChoice() {
    return selectedMissing.length === 2 && MISSING.every(function (id) { return selectedMissing.indexOf(id) !== -1; });
  }

  function installCheck(id) {
    if (MISSING.indexOf(id) === -1) return;
    if (added.indexOf(id) !== -1) return;
    added.push(id);
    lastInstalled = id;
    dragPick = "";
    render();
  }

  var ACTIONS = {
    "pick-missing": function (t) {
      if (chooseResult === "correct" || chooseResult === "revealed") return;
      var id = t.getAttribute("data-id");
      var pos = selectedMissing.indexOf(id);
      if (pos === -1) {
        if (selectedMissing.length < 2) selectedMissing.push(id);
      } else {
        selectedMissing.splice(pos, 1);
      }
      chooseResult = "";
      render();
    },
    "check-missing": function () {
      if (selectedMissing.length !== 2) return;
      var correct = MISSING.every(function (id) { return selectedMissing.indexOf(id) !== -1; });
      if (correct) chooseResult = "correct";
      else {
        chooseAttempts += 1;
        if (window.fndRegisterWrongAttempt) window.fndRegisterWrongAttempt();
        if (chooseAttempts >= 2) {
          selectedMissing = MISSING.slice();
          chooseResult = "revealed";
        } else chooseResult = "retry";
      }
      render();
    },
    "unlock-missing": function () {
      if (!(chooseResult === "correct" || chooseResult === "revealed")) return;
      fndUpdateState({ missingChecks: MISSING.slice() });
      step = "unlocked";
      render();
      playVoice("checks_unlocked");
    },
    "go-upgrade": function () {
      step = "upgrade";
      render();
    },
    add: function (t) {
      var id = t.getAttribute("data-id");
      installCheck(id);
    },
    activate: function () {
      fndUpdateState({
        selectedChecks: FND_CHECK_ORDER.slice(),
        missingChecks: [],
        upgradeChecksAdded: MISSING.slice(),
        detectorVersion: 2,
        detectorLogicFixed: true
      });
      step = "retest";
      scanDone = false;
      scanRunning = false;
      retestGuidanceReady = false;
      render();
      window.setTimeout(function () {
        playVoice("retest_same_message", function () {
          retestGuidanceReady = true;
          render();
        });
      }, 120);
    },
    "scan-all": function () {
      if (scanDone || scanRunning || !retestGuidanceReady) return;
      scanRunning = true;
      render();
      playVoice("run_v2", function () {
        window.setTimeout(function () {
          scanRunning = false;
          scanDone = true;
          render();
        }, 950);
      });
    },
    "pick-verdict": function (t) {
      if (verdictResult === "revealed") return;
      selectedVerdict = t.getAttribute("data-id");
      verdictResult = "";
      render();
    },
    "check-verdict": function () {
      if (selectedVerdict === "unverified") {
        verdictResult = "correct";
      } else {
        verdictAttempts += 1;
        if (window.fndRegisterWrongAttempt) window.fndRegisterWrongAttempt();
        if (verdictAttempts >= 2) {
          selectedVerdict = "unverified";
          verdictResult = "revealed";
        } else {
          verdictResult = "retry";
        }
      }
      render();
      if (verdictResult === "correct") playVoice("v2_result");
    },
    ready: function () {
      step = "ready";
      render();
      playVoice("v2_ready");
    },
    "practice-process": function () {
      step = "order";
      processOrder = ["decide", "read", "review", "run"];
      processResult = "";
      processAttempts = 0;
      render();
      playVoice("order_process");
    },
    "move-process": function (t) {
      if (processResult === "correct" || processResult === "revealed") return;
      var index = Number(t.getAttribute("data-index"));
      var dir = t.getAttribute("data-dir");
      var nextIndex = dir === "up" ? index - 1 : index + 1;
      if (index < 0 || nextIndex < 0 || index >= processOrder.length || nextIndex >= processOrder.length) return;
      var temp = processOrder[index];
      processOrder[index] = processOrder[nextIndex];
      processOrder[nextIndex] = temp;
      movedIndex = nextIndex;
      processResult = "";
      render();
    },
    "check-process": function () {
      if (processMatches()) {
        processResult = "correct";
        fndUpdateState({ ruleOrder: CORRECT_PROCESS.slice() });
      } else {
        processAttempts += 1;
        if (window.fndRegisterWrongAttempt) window.fndRegisterWrongAttempt();
        if (processAttempts >= 2) {
          processOrder = CORRECT_PROCESS.slice();
          processResult = "revealed";
          fndUpdateState({ ruleOrder: CORRECT_PROCESS.slice() });
        } else {
          processResult = "retry";
        }
      }
      render();
      if (processResult === "retry") playVoice("process_hint");
      if (processResult === "correct") playVoice("process_correct");
    },
    finish: function () {
      fndUpdateState({ chunk6Completed: true, currentChunk: 7, casesHandledSafelyV2: 2, ruleOrder: CORRECT_PROCESS.slice() });
      window.Chunk7.init();
      window.fndShowScene("scene-chunk7", "chunk7");
    }
  };

  function onDragStart(e) {
    var t = e.target.closest("[data-draggable-check]");
    if (!t) return;
    var id = t.getAttribute("data-draggable-check");
    if (!id || added.indexOf(id) !== -1) return;
    dragPick = id;
    if (e.dataTransfer) {
      e.dataTransfer.setData("text/plain", id);
      e.dataTransfer.effectAllowed = "move";
    }
  }

  function onDragOver(e) {
    var slot = e.target.closest("[data-slot-check]");
    if (!slot) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  }

  function onDrop(e) {
    var slot = e.target.closest("[data-slot-check]");
    if (!slot) return;
    e.preventDefault();
    var targetId = slot.getAttribute("data-slot-check");
    var draggedId = dragPick || (e.dataTransfer ? e.dataTransfer.getData("text/plain") : "");
    if (!draggedId || !targetId || draggedId !== targetId) return;
    installCheck(draggedId);
  }

  function onClick(e) {
    var t = e.target.closest("[data-action]");
    if (!t) return;
    var fn = ACTIONS[t.getAttribute("data-action")];
    if (fn) fn(t);
  }
})();
