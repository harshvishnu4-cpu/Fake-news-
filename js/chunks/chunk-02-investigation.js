/* CHUNK 2 — DISCOVER THREE RED FLAGS BEFORE BUILDING V1 */
(function () {
  "use strict";

  var container = null;
  var bound = false;
  var step = "hunt";
  var found = {};
  var lastFound = "";
  var lastWrong = "";
  var wrongAttempts = 0;
  var readyReveal = false;
  var byteLines = ["Tap a part of the message to inspect it."];

  function motion() {
    return window.FNDMotion || null;
  }

  var CLUES = [
    {
      id: "source",
      checkId: "source-check",
      label: "SOURCE CHECK",
      clue: "Unknown number: +91 90123 45678",
      prompt: "Check who sent the message",
      icon: FND_ICONS.sender,
      byte: "We do not know who started this message.",
      voice: "source_clue"
    },
    {
      id: "claim",
      checkId: "claim-check",
      label: "CLAIM CHECK",
      clue: "School closed for 3 days",
      prompt: "Look for a big or unusual claim",
      icon: FND_ICONS.claim,
      byte: "That is a big claim about school.",
      voice: "claim_clue"
    },
    {
      id: "pressure",
      checkId: "pressure-check",
      label: "PRESSURE CHECK",
      clue: "Share immediately",
      prompt: "Notice language that rushes you",
      icon: FND_ICONS.pressure,
      byte: "It pushes you to act fast.",
      voice: "pressure_clue"
    }
  ];

  function init() {
    container = document.getElementById("scene-chunk2");
    if (!container) return;
    if (!bound) {
      container.addEventListener("click", onClick);
      bound = true;
    }
    step = "hunt";
    found = {};
    lastFound = "";
    lastWrong = "";
    wrongAttempts = 0;
    readyReveal = false;
    byteLines = ["Tap a part of the message to inspect it."];
    render();
    window.setTimeout(function () { playVoice("hunt_instruction"); }, 120);
  }

  function reset() {
    step = "hunt";
    found = {};
    lastFound = "";
    lastWrong = "";
    wrongAttempts = 0;
    readyReveal = false;
    byteLines = ["Tap a part of the message to inspect it."];
    if (container) container.innerHTML = "";
  }

  window.Chunk2 = { init: init, reset: reset, goBack: goBack, showWhyBuild: showWhyBuild };

  function showWhyBuild() {
    container = document.getElementById("scene-chunk2");
    if (!container) return false;
    if (!bound) {
      container.addEventListener("click", onClick);
      bound = true;
    }
    found = { source: true, claim: true, pressure: true };
    lastFound = "";
    readyReveal = true;
    step = "why-build";
    render();
    return true;
  }

  function goBack() {
    if (step === "why-build") {
      step = "hunt";
      readyReveal = true;
      lastFound = "";
    } else {
      return false;
    }
    if (window.FNDVoice && window.FNDVoice.stop) window.FNDVoice.stop();
    render();
    return true;
  }

  function render() {
    var html = step === "why-build" ? renderWhyBuild() : renderHunt();
    container.innerHTML = '<div class="mission-workspace">' + html + '</div>';
    var focus = container.querySelector("[data-autofocus]");
    if (focus) focus.focus();
    afterRender();
  }

  // Signature = "which screen am I on". A new one replays the entry animation;
  // the same one only pops the pieces that changed on this tap.
  function renderSignature() {
    var count = Object.keys(found).length;
    return step + "|" + (step === "hunt" ? (count === 3 && readyReveal ? "done" : "hunting") : "");
  }

  function afterRender() {
    var fx = motion();
    if (!fx) return;

    fx.enter(container, renderSignature());

    if (lastFound) {
      var slot = container.querySelector('.unlock-slot[data-clue="' + lastFound + '"]');
      if (slot) {
        fx.pop(slot, 0.8);
        fx.burst(slot, { count: 12, colors: ["#a6ff6b", "#3fd6ff"] });
      }
    }

    if (lastWrong) {
      var missed = container.querySelector('.hunt-clue[data-id="' + lastWrong + '"]');
      if (missed) {
        missed.classList.add("is-wrong");
        fx.shake(missed);
        window.setTimeout(function () { missed.classList.remove("is-wrong"); }, 900);
      }
      lastWrong = "";
    }

    // A learner who stops tapping gets the remaining clues nudged for them.
    if (step === "hunt" && Object.keys(found).length < 3) {
      fx.idleHint(container, ".hunt-clue:not(.is-found)", 8000);
    } else {
      fx.clearIdleHint();
    }
  }

  function renderPhone() {
    var sourceDone = !!found.source;
    var claimDone = !!found.claim;
    var pressureDone = !!found.pressure;

    return '<div class="mission-phone clue-hunt-phone">' +
      '<div class="mission-phone-notch"></div>' +
      '<div class="mission-phone-screen">' +
        '<div class="mission-phone-status"><span>11:29 AM</span><span>4G ▰</span></div>' +
        '<div class="mission-phone-header">' +
          '<span class="mission-phone-back">‹</span>' +
          '<span class="mission-phone-avatar">' + FND_ICONS.app + '</span>' +
          '<button class="hunt-clue hunt-source' + (sourceDone ? ' is-found' : '') + '" data-action="find-clue" data-id="source" ' + (sourceDone ? 'disabled' : '') + '>' +
            '<strong>Unknown Number</strong><small>+91 90123 45678</small><i aria-hidden="true"></i>' +
          '</button>' +
          '<span class="mission-phone-menu">•••</span>' +
        '</div>' +
        '<div class="mission-phone-body">' +
          '<span class="mission-phone-day">Today</span>' +
          '<div class="mission-forwarded">Forwarded</div>' +
          '<div class="mission-chat-bubble clue-chat-bubble">' +
            '<h3>URGENT SCHOOL NOTICE</h3>' +
            '<p class="clue-message-copy">' +
              '<button class="hunt-clue hunt-claim' + (claimDone ? ' is-found' : '') + '" data-action="find-clue" data-id="claim" ' + (claimDone ? 'disabled' : '') + '>School will remain closed for the next three days.<i aria-hidden="true"></i></button>' +
              '<button class="hunt-clue hunt-detail" data-action="wrong-clue" data-id="detail">The science test has also been postponed.<i aria-hidden="true"></i></button>' +
              '<button class="hunt-clue hunt-pressure' + (pressureDone ? ' is-found' : '') + '" data-action="find-clue" data-id="pressure" ' + (pressureDone ? 'disabled' : '') + '>Share this with all class groups immediately.<i aria-hidden="true"></i></button>' +
            '</p>' +
            '<span class="mission-chat-time">11:29 AM</span>' +
          '</div>' +
          '<div class="mission-phone-input"><span>Message</span><b></b></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderBytePanel() {
    return '<div class="byte-mini clue-byte-panel">' +
      '<div class="byte-mini-figure"><img src="assets/byte/byte-character.png" alt="Byte"></div>' +
      '<div class="byte-line-panel">' + byteLines.map(function (line) {
        return '<p>' + line + '</p>';
      }).join('') + '</div>' +
    '</div>';
  }

  // The board always shows all three slots. An empty "no clues yet" box hid
  // the goal; three locked slots say how many are left and what each one is.
  function renderUnlockedChecks(isComplete) {
    var items = isComplete ? CLUES.filter(function (item) { return !!found[item.id]; }) : CLUES;
    return items.map(function (item) {
      var open = !!found[item.id];
      return '<div class="unlock-slot ' + (open ? 'is-unlocked' : 'is-locked') + '" data-clue="' + item.id + '">' +
        '<span class="unlock-icon">' + (open ? item.icon : FND_ICONS.lock) + '</span>' +
        '<span><strong>' + (open ? item.label : 'CLUE NOT FOUND') + '</strong>' +
        '<small>' + (open ? item.clue : item.prompt) + '</small></span>' +
      '</div>';
    }).join("");
  }

  function renderHunt() {
    var count = Object.keys(found).length;
    var isComplete = count === 3 && readyReveal;
    var progressLabel = isComplete ? "All clues found!" : (count + " of 3 found");
    var remaining = Math.max(0, 3 - count);
    var goal = count === 3
      ? '<p class="clue-hunt-goal is-done"><b>✓</b><span>All 3 found <small>Byte is explaining the last clue</small></span></p>'
      : '<p class="clue-hunt-goal"><b>' + remaining + '</b><span>' +
          (remaining === 1 ? 'red flag left to find' : 'red flags left to find') +
          '<small>Tap the highlighted parts of the message</small></span></p>';
    return fndMissionHeader("Find the Red Flags", progressLabel) +
      '<div class="mission-two-col clue-hunt-layout' + (isComplete ? ' is-complete' : '') + '">' +
        renderPhone() +
        '<div class="glass-panel clue-hunt-panel' + (isComplete ? ' is-complete' : '') + '">' +
          // Title and the bar that measures it belong together. The bar used to
          // sit between the board and Byte, which read as a stray line in a gap.
          '<header class="clue-hunt-head">' +
            '<span class="clue-hunt-kicker">MESSAGE INVESTIGATION</span>' +
            '<h3 data-autofocus tabindex="-1">' + (isComplete ? 'These 3 checks are ready.' : 'Tap the parts that feel suspicious.') + '</h3>' +
            (isComplete ? '' : '<div class="clue-progress-row"><div class="scan-progress" aria-label="' + count + ' of 3 clues found"><span style="width:' + (count * 33.333) + '%"></span></div><strong>' + count + '/3</strong></div>') +
          '</header>' +
          (isComplete ? '' : goal) +
          '<div class="unlock-stack' + (isComplete ? ' is-complete' : '') + '">' + renderUnlockedChecks(isComplete) + '</div>' +
          (isComplete
            ? '<button class="header-next-proxy" data-action="finish" tabindex="-1" aria-hidden="true">Continue</button>'
            : renderBytePanel()) +
        '</div>' +
      '</div>';
  }

  function renderWhyBuild() {
    var checks = CLUES.map(function (item) {
      return '<div class="logic-check-module">' +
        '<span>' + item.icon + '</span>' +
        '<strong>' + item.label + '</strong>' +
      '</div>';
    }).join("");

    return fndMissionHeader("Can We Check Messages Faster?", "3 checks → 1 detector") +
      '<div class="glass-panel detector-logic-bridge">' +
        '<div class="logic-bridge-visual" aria-label="Source, Claim and Pressure checks connecting into Detector V1">' +
          '<div class="logic-check-stack">' + checks + '</div>' +
          '<div class="logic-connector" aria-hidden="true"><i></i><i></i><i></i><b>›</b></div>' +
          '<div class="logic-detector-blueprint">' +
            '<span class="logic-blueprint-label">DETECTOR V1</span>' +
            '<img src="assets/illustrations/detector-v1.svg" alt="Empty Detector V1 blueprint">' +
            '<small>READY FOR 3 CHECKS</small>' +
          '</div>' +
        '</div>' +
        '<div class="logic-bridge-copy">' +
          '<span class="logic-story-chip">ONE MESSAGE CHECKED</span>' +
          '<h3 data-autofocus tabindex="-1">What about the next one?</h3>' +
          '<p>We found the warning signs this time. But checking every message one by one will take time.</p>' +
          '<strong class="logic-bridge-question">What if we build a detector that uses these checks for us?</strong>' +
          '<button class="btn-primary compact-btn" data-action="start-build" data-header-next-ignore>BUILD THE DETECTOR</button>' +
        '</div>' +
      '</div>';
  }

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

  function playVoiceSequence(keys) {
    if (!container || !container.classList.contains("is-active")) return;
    if (window.FNDVoice && window.FNDVoice.playSequence) window.FNDVoice.playSequence(keys);
  }

  function setByte(lines) {
    byteLines = Array.isArray(lines) ? lines : [String(lines || '')];
  }

  function revealReadyAfterVoice() {
    window.setTimeout(function () {
      readyReveal = true;
      lastFound = '';
      render();
    }, 80);
  }

  var ACTIONS = {
    "find-clue": function (t) {
      var id = t.getAttribute("data-id");
      if (found[id]) return;
      found[id] = true;
      lastFound = id;
      lastWrong = "";
      var item = CLUES.filter(function (c) { return c.id === id; })[0];
      setByte([item.byte]);
      render();
      if (Object.keys(found).length === 3) {
        readyReveal = false;
        playVoice(item.voice, revealReadyAfterVoice);
      } else {
        playVoice(item.voice);
      }
    },
    "wrong-clue": function (t) {
      wrongAttempts += 1;
      if (window.fndRegisterWrongAttempt) window.fndRegisterWrongAttempt();
      lastFound = "";
      lastWrong = t.getAttribute("data-id") || "";
      if (wrongAttempts >= 2) {
        setByte([
          'This line adds detail, but it is not a warning sign by itself.',
          'Hint: check who sent the message.'
        ]);
      } else {
        setByte(['This line adds detail, but it is not a red flag by itself.']);
      }
      render();
      if (wrongAttempts >= 2) playVoiceSequence(["wrong_clue", "sender_hint"]);
      else playVoice("wrong_clue");
    },
    finish: function () {
      step = "why-build";
      render();
    },
    "start-build": function () {
      var unlocked = ["source-check", "claim-check", "pressure-check"];
      fndUpdateState({
        investigationToolsCompleted: unlocked.slice(),
        cluesFound: ["source-clue", "claim-clue", "pressure-clue"],
        rulesUnlocked: unlocked.slice(),
        investigationConclusion: "pause-and-check",
        chunk2Completed: true,
        chunk3Completed: true,
        currentChunk: 4
      });
      window.Chunk4.init();
      window.fndShowScene("scene-chunk4", "chunk4");
    }
  };

  function onClick(e) {
    var t = e.target.closest("[data-action]");
    if (!t) return;
    var fn = ACTIONS[t.getAttribute("data-action")];
    if (fn) fn(t);
  }
})();
