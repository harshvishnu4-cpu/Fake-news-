/* CHUNK 7 — FINAL MISSION: RUN ALL FIVE, DECIDE, THEN COMMIT */
(function () {
  "use strict";

  var container = null;
  var bound = false;
  var step = "intro";
  var index = 0;
  var scanned = false;
  var scanning = false;
  var scanStep = 0;
  var scanToken = 0;
  var selectedVerdict = "";
  var selectedAction = "";
  var result = "";
  var attempts = 0;
  var solved = [];

  function init() {
    container = document.getElementById("scene-chunk7");
    if (!container) return;
    if (!bound) {
      container.addEventListener("click", onClick);
      bound = true;
    }
    step = "intro";
    index = 0;
    scanned = false;
    scanning = false;
    scanStep = 0;
    scanToken += 1;
    selectedVerdict = "";
    selectedAction = "";
    result = "";
    attempts = 0;
    solved = [];
    render();
    window.setTimeout(function () { playVoice("final_mission"); }, 120);
  }

  function reset() {
    step = "intro";
    index = 0;
    scanned = false;
    scanning = false;
    scanStep = 0;
    scanToken += 1;
    selectedVerdict = "";
    selectedAction = "";
    result = "";
    attempts = 0;
    solved = [];
    if (container) container.innerHTML = "";
  }

  window.Chunk7 = { init: init, reset: reset };

  function playVoice(key) {
    if (!container || !container.classList.contains("is-active")) return;
    if (window.FNDVoice && window.FNDVoice.playKey) window.FNDVoice.playKey(key);
  }

  function render() {
    var body = "";
    if (step === "intro") body = renderIntro();
    if (step === "case") body = renderCase();
    if (step === "commitment") body = renderCommitment();
    if (step === "complete") body = renderComplete();
    container.innerHTML = '<div class="mission-workspace">' + body + '</div>';
    var focus = container.querySelector("[data-autofocus]");
    if (focus) focus.focus();
    afterRender();
  }

  function afterRender() {
    var fx = window.FNDMotion;
    if (!fx) return;

    fx.enter(container, step + "|" + index + "|" + (scanned ? "scanned" : "fresh"));

    if (scanning) {
      fx.scanBeam(container.querySelector(".mission-phone-screen"), 0.85);
      var live = container.querySelector(".mini-check-result.is-scanning-now");
      if (live) fx.pop(live, 0.9);
    } else {
      fx.stopScanBeam(container);
    }

    if (step === "case" && scanned && !result) {
      // The five results land one after another so the learner reads them.
      fx.idleHint(container, ".compact-answer-btn:not([disabled])", 12000);
    } else {
      fx.clearIdleHint();
    }

    var feedback = container.querySelector(".inline-feedback.is-retry, .inline-feedback.is-correct");
    if (result === "retry" && feedback) fx.shake(feedback);
    if (result === "correct" && feedback) {
      fx.pop(feedback, 0.9);
      fx.burst(feedback, { count: 18, colors: ["#a6ff6b", "#3fd6ff", "#ff8a5b"] });
    }

    if (step === "complete") {
      Array.prototype.forEach.call(container.querySelectorAll("[data-count]"), function (el) {
        fx.countUp(el, Number(el.getAttribute("data-count")), el.getAttribute("data-suffix") || "");
      });
      var badge = container.querySelector(".completion-badge");
      if (badge) fx.pop(badge, 0.6);
      fx.celebrate();
    }
  }

  function renderIntro() {
    return fndMissionHeader("FINAL MISSION", "3 messages") +
      '<div class="glass-panel compact-intro-card">' +
        '<div class="final-shield-visual">' + FND_ICONS.shield + '</div>' +
        '<div class="compact-intro-copy">' +
          '<h3 data-autofocus tabindex="-1">Scan. Decide. Act.</h3>' +
          '<p>Use the process you just built.</p>' +
          '<button class="btn-primary compact-btn" data-action="begin">START</button>' +
        '</div>' +
      '</div>';
  }

  function renderCase() {
    var msg = FND_FINAL_MESSAGES[index];
    var solvedNow = result === "correct" || result === "revealed";
    var statusOrder = (msg.statusOrder || FND_STATUS_OPTIONS.map(function (o) { return o.id; })).map(function (id) {
      return FND_STATUS_OPTIONS.filter(function (o) { return o.id === id; })[0];
    });
    var actionOrder = (msg.actionOrder || FND_ACTION_OPTIONS.map(function (o) { return o.id; })).map(function (id) {
      return FND_ACTION_OPTIONS.filter(function (o) { return o.id === id; })[0];
    });

    var rows = FND_CHECK_ORDER.map(function (id, idx) {
      var rule = fndRuleById(id);
      var rawStatus = msg.checkResults[id];
      var revealed = scanned || idx < scanStep;
      var current = scanning && idx === scanStep;
      var label = revealed ? fndCheckResultLabel(rawStatus) : current ? "Scanning…" : "Waiting";
      var cls = current ? "is-scanning-now"
        : !revealed ? "is-waiting"
        : rawStatus === "warning" ? "is-warning"
        : rawStatus === "clear" ? "is-clear" : "is-neutral";
      return '<div class="mini-check-result ' + cls + '" data-check-index="' + idx + '"><span>' + rule.icon + '</span><strong>' + rule.name.replace(" CHECK", "") + '</strong><b>' + label + '</b></div>';
    }).join("");

    var verdicts = statusOrder.map(function (o) {
      var correct = result === "revealed" && o.id === msg.correctStatus;
      return '<button class="compact-answer-btn' + (selectedVerdict === o.id ? ' is-selected' : '') + (correct ? ' is-correct-answer' : '') + '" data-action="pick-verdict" data-id="' + o.id + '" ' + (!scanned || solvedNow ? 'disabled' : '') + '>' + o.label + '</button>';
    }).join("");

    var actions = actionOrder.map(function (o) {
      var correct = result === "revealed" && o.id === msg.correctAction;
      return '<button class="compact-answer-btn' + (selectedAction === o.id ? ' is-selected' : '') + (correct ? ' is-correct-answer' : '') + '" data-action="pick-action" data-id="' + o.id + '" ' + (!scanned || solvedNow ? 'disabled' : '') + '>' + o.label + '</button>';
    }).join("");

    var feedback = "";
    if (result === "retry") {
      feedback = '<div class="inline-feedback is-retry"><strong>Try once more.</strong><span>Use all five results.</span></div>';
    }
    if (result === "correct") {
      feedback = '<div class="inline-feedback is-correct"><strong>Case solved!</strong><span>' + fndEscapeHtml(msg.feedback) + '</span></div>';
    }
    if (result === "revealed") {
      feedback = '<div class="inline-feedback is-neutral answer-revealed-feedback"><strong>Correct answer shown.</strong><span>Review why it fits: ' + fndEscapeHtml(msg.feedback) + '</span></div>';
    }

    return fndMissionHeader("MESSAGE " + (index + 1), (index + 1) + " / 3") +
      '<div class="final-case-layout">' +
        fndPhoneMarkup(msg) +
        '<div class="glass-panel final-decision-panel">' +
          '<h3 data-autofocus tabindex="-1">' + (scanning ? 'Detector V2 is scanning.' : !scanned ? 'Run all five checks.' : 'Choose both answers.') + '</h3>' +
          '<div class="mini-check-grid">' + rows + '</div>' +
          (!scanned ? '<button class="btn-primary compact-btn" data-action="scan"' + (scanning ? ' disabled' : '') + '>' + (scanning ? 'SCANNING…' : 'RUN ALL 5') + '</button>' : '') +
          (scanned ? '<div class="dual-answer-grid">' +
            '<div><small>VERDICT</small><div class="compact-answer-row">' + verdicts + '</div></div>' +
            '<div><small>ACTION</small><div class="compact-answer-row">' + actions + '</div></div>' +
          '</div>' : '') +
          feedback +
          (scanned && !solvedNow ? '<button class="btn-primary compact-btn" data-action="submit" ' + (!selectedVerdict || !selectedAction ? 'disabled' : '') + '>SUBMIT</button>' : '') +
          (solvedNow ? '<button class="btn-primary compact-btn" data-action="next">' + (index < 2 ? 'NEXT MESSAGE' : 'CONTINUE') + '</button>' : '') +
        '</div>' +
      '</div>';
  }

  function commitmentStep(title, detail, icon) {
    return '<div class="commitment-step"><span>' + icon + '</span><strong>' + title + '</strong><small>' + detail + '</small></div>';
  }

  function renderCommitment() {
    return fndMissionHeader("YOUR SHARING RULE", "One final promise") +
      '<div class="glass-panel sharing-commitment-panel">' +
        '<div class="commitment-byte"><img src="assets/byte/byte-character.png" alt="Byte"></div>' +
        '<div class="commitment-copy">' +
          '<span class="commitment-kicker">BEFORE I SHARE, I WILL</span>' +
          '<h3 data-autofocus tabindex="-1">Pause. Check. Confirm. Decide.</h3>' +
          '<div class="commitment-steps">' +
            commitmentStep("PAUSE", "Do not rush.", FND_ICONS.pressure) +
            commitmentStep("CHECK", "Use all 5 checks.", FND_ICONS.magnify) +
            commitmentStep("CONFIRM", "Use a trusted source.", FND_ICONS.shield) +
            commitmentStep("DECIDE", "Choose the safest action.", FND_ICONS.check) +
          '</div>' +
          '<button class="btn-primary compact-btn" data-action="commit">I\'LL CHECK BEFORE I SHARE</button>' +
        '</div>' +
      '</div>';
  }

  function renderComplete() {
    var totalCases = solved.length || 3;
    var firstTry = solved.filter(function (item) { return !item.assisted; }).length;
    var smartScore = solved.reduce(function (sum, item) { return sum + (item.assisted ? 1 : 2); }, 0);
    return fndMissionHeader("MISSION COMPLETE", totalCases + " messages solved") +
      '<div class="glass-panel completion-panel concise-completion premium-success score-completion-panel">' +
        '<div class="completion-badge">' + FND_ICONS.shield + '<span>CERTIFIED</span></div>' +
        '<h3 data-autofocus tabindex="-1">You checked before sharing.</h3>' +
        '<p class="completion-message">You are ready to pause, check, confirm, and decide.</p>' +
        '<div class="completion-score-grid">' +
          '<div class="completion-score-card"><strong data-count="' + smartScore + '" data-suffix="/6">0/6</strong><small>Smart Score</small></div>' +
          '<div class="completion-score-card"><strong data-count="' + firstTry + '" data-suffix="/3">0/3</strong><small>First-try solves</small></div>' +
          '<div class="completion-score-card"><strong data-count="' + totalCases + '" data-suffix="/3">0/3</strong><small>Messages solved</small></div>' +
        '</div>' +
        '<div class="inline-feedback is-correct completion-recap"><strong>Mission recap</strong><span>You used all 5 checks and made safer sharing decisions.</span></div>' +
        '<button class="btn-primary compact-btn" data-action="finish">FINISH MISSION</button>' +
      '</div>';
  }

  var ACTIONS = {
    begin: function () {
      step = "case";
      render();
      playVoice("final_instruction");
    },
    // Reveal the five results one at a time. Seeing each check land is the
    // whole point of the process the learner just put in order.
    scan: function () {
      if (scanning || scanned) return;
      scanning = true;
      scanStep = 0;
      scanToken += 1;
      var token = scanToken;
      render();

      (function stepScan() {
        window.setTimeout(function () {
          if (token !== scanToken || !scanning) return;
          if (window.playDetectorCheckSound) window.playDetectorCheckSound(FND_CHECK_ORDER[scanStep]);
          scanStep += 1;
          if (scanStep >= FND_CHECK_ORDER.length) {
            scanning = false;
            scanned = true;
            render();
            return;
          }
          render();
          stepScan();
        }, 340);
      })();
    },
    "pick-verdict": function (t) {
      if (result === "correct" || result === "revealed") return;
      selectedVerdict = t.getAttribute("data-id");
      result = "";
      render();
    },
    "pick-action": function (t) {
      if (result === "correct" || result === "revealed") return;
      selectedAction = t.getAttribute("data-id");
      result = "";
      render();
    },
    submit: function () {
      var msg = FND_FINAL_MESSAGES[index];
      if (selectedVerdict === msg.correctStatus && selectedAction === msg.correctAction) {
        result = "correct";
        solved.push({ id: msg.id, status: selectedVerdict, action: selectedAction, assisted: false });
      } else {
        attempts += 1;
        if (window.fndRegisterWrongAttempt) window.fndRegisterWrongAttempt();
        if (attempts >= 2) {
          selectedVerdict = msg.correctStatus;
          selectedAction = msg.correctAction;
          result = "revealed";
          solved.push({ id: msg.id, status: selectedVerdict, action: selectedAction, assisted: true });
        } else {
          result = "retry";
        }
      }
      render();
      if (result === "retry") playVoice("final_retry");
      if (result === "correct") playVoice("case_solved");
    },
    next: function () {
      if (index < 2) {
        index += 1;
        scanned = false;
        selectedVerdict = "";
        selectedAction = "";
        result = "";
        attempts = 0;
        render();
      } else {
        fndUpdateState({ finalChallengeResults: solved.slice() });
        step = "commitment";
        render();
        playVoice("sharing_rule");
      }
    },
    commit: function () {
      fndUpdateState({
        personalCommitment: "Pause. Check. Confirm. Decide.",
        finalChallengeResults: solved.slice(),
        chunk7Completed: true,
        missionCompleted: true
      });
      step = "complete";
      render();
      playVoice("mission_complete");
    },
    finish: function () {
      if (window.finishMission) window.finishMission();
    }
  };

  function onClick(e) {
    var t = e.target.closest("[data-action]");
    if (!t) return;
    var fn = ACTIONS[t.getAttribute("data-action")];
    if (fn) fn(t);
  }
})();
