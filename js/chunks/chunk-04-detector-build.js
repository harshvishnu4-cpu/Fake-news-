/* CHUNK 4 — BUILD V1 USING ONLY THE THREE DISCOVERED CHECKS */
(function () {
  "use strict";

  var container = null;
  var bound = false;
  var slots = [null, null, null];
  var selectedId = "";
  var lastFilledSlot = -1;
  var INITIAL = ["source-check", "claim-check", "pressure-check"];

  function init() {
    container = document.getElementById("scene-chunk4");
    if (!container) return;
    if (!bound) {
      container.addEventListener("click", onClick);
      container.addEventListener("dragstart", onDragStart);
      container.addEventListener("dragover", onDragOver);
      container.addEventListener("drop", onDrop);
      container.addEventListener("dragleave", onDragLeave);
      bound = true;
    }
    slots = [null, null, null];
    selectedId = "";
    lastFilledSlot = -1;
    render();
    window.setTimeout(function () { playVoice("install_checks"); }, 120);
  }

  function reset() {
    slots = [null, null, null];
    selectedId = "";
    lastFilledSlot = -1;
    if (container) container.innerHTML = "";
  }

  window.Chunk4 = { init: init, reset: reset };

  function playVoice(key) {
    if (!container || !container.classList.contains("is-active")) return;
    if (window.FNDVoice && window.FNDVoice.playKey) window.FNDVoice.playKey(key);
  }

  function installedIds() {
    return slots.filter(Boolean);
  }

  function isInstalled(id) {
    return installedIds().indexOf(id) !== -1;
  }

  function finishInstallIfReady() {
    if (installedIds().length === INITIAL.length) {
      fndUpdateState({
        selectedChecks: INITIAL.slice(),
        detectorVersion: 1,
        detectorName: (gameState.playerName || "Agent") + "'s Detector",
        detectorBuildComplete: true,
        chunk4Completed: true
      });
      playVoice("v1_ready");
      return true;
    }
    return false;
  }

  function installIntoSlot(id, slotIndex) {
    if (slotIndex < 0 || slotIndex >= slots.length) return;
    if (slots[slotIndex]) return;
    if (isInstalled(id)) return;
    slots[slotIndex] = id;
    selectedId = "";
    lastFilledSlot = slotIndex;
    render();
    finishInstallIfReady();
  }

  function render() {
    container.innerHTML = '<div class="mission-workspace detector-build-workspace">' + renderBuild() + '</div>';
    var focus = container.querySelector("[data-autofocus]");
    if (focus) focus.focus();
    afterRender();
  }

  function afterRender() {
    var fx = window.FNDMotion;
    if (!fx) return;
    var done = installedIds().length === INITIAL.length;

    // Only "all slots filled" is a different screen — arming and installing a
    // single check should not restage the whole workbench.
    fx.enter(container, done ? "built" : "building");

    if (lastFilledSlot >= 0) {
      var slot = container.querySelector('.detector-load-slot[data-slot="' + lastFilledSlot + '"]');
      if (slot) {
        fx.pop(slot, 0.72);
        fx.burst(slot, { count: 10, spread: 90, colors: ["#3fd6ff", "#8b6bff"] });
      }
      lastFilledSlot = -1;
    }

    if (done) {
      var core = container.querySelector(".detector-core-panel img");
      if (core) fx.attention(core);
      fx.clearIdleHint();
    } else {
      fx.idleHint(container, selectedId ? ".detector-load-slot.is-empty-drop" : ".prototype-check-card:not([disabled])", 9000);
    }
  }

  function renderBuild() {
    var filledCount = installedIds().length;
    var slotsHtml = slots.map(function (id, i) {
      if (!id) return '<button type="button" class="detector-load-slot is-empty-drop' + (selectedId ? ' is-tap-target' : '') + '" data-slot="' + i + '" data-action="place-check" aria-label="Install selected check in slot ' + (i + 1) + '"><span>' + (i + 1) + '</span><small>' + (selectedId ? 'TAP TO INSTALL' : 'DROP HERE') + '</small></button>';
      var rule = fndRuleById(id);
      return '<div class="detector-load-slot is-filled" data-slot="' + i + '"><span>' + rule.icon + '</span><strong>' + rule.name.replace(" CHECK", "") + '</strong></div>';
    }).join("");

    var cards = INITIAL.map(function (id) {
      var rule = fndRuleById(id);
      var on = isInstalled(id);
      return '<button type="button" class="prototype-check-card' + (on ? ' is-selected' : ' draggable-check-card') + (selectedId === id ? ' is-armed' : '') + '" data-id="' + id + '" data-action="select-check" ' +
        (on ? 'disabled aria-disabled="true"' : 'draggable="true"') + ' aria-pressed="' + (selectedId === id ? 'true' : 'false') + '" aria-label="' +
        (on ? rule.name + ' installed' : 'Select or drag ' + rule.name + ' into an empty slot') + '">' +
        '<span>' + rule.icon + '</span><strong>' + rule.name.replace(" CHECK", "") + '</strong><small>' + (on ? 'INSTALLED' : selectedId === id ? 'SELECT A SLOT' : 'Tap or drag') + '</small>' +
      '</button>';
    }).join("");

    var done = filledCount === INITIAL.length;
    return fndMissionHeader("Build Detector V1", done ? "3 checks active" : (filledCount + " / 3")) +
      '<div class="detector-builder-layout prototype-builder-layout">' +
        '<div class="glass-panel detector-core-panel">' +
          // The detector is built on the same device the learner has been
          // reading messages on, so the slots sit on its screen rather than
          // floating beside an abstract box.
          '<div class="mission-phone detector-phone">' +
            '<div class="mission-phone-screen">' +
              '<div class="detector-app-bar">' +
                '<span class="detector-app-dot" aria-hidden="true"></span>' +
                'DETECTOR V1' +
                '<small>' + filledCount + '/3</small>' +
              '</div>' +
              '<img src="assets/illustrations/detector-v1.svg" alt="Detector prototype">' +
              '<div class="detector-load-slots">' + slotsHtml + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="glass-panel detector-rule-panel">' +
          '<h3 data-autofocus tabindex="-1">Tap or drag to install.</h3>' +
          '<div class="prototype-check-grid three-only-grid">' + cards + '</div>' +
          (done
            ? '<div class="inline-feedback is-correct"><strong>V1 READY!</strong><span>All 3 checks are active.</span></div><button class="header-next-proxy" data-action="finish" tabindex="-1" aria-hidden="true">Test V1</button>'
            : '<div class="inline-feedback is-neutral"><strong>Install all 3 checks.</strong><span>Tap a check, then a glowing slot — or drag it.</span></div>') +
        '</div>' +
      '</div>';
  }

  var ACTIONS = {
    "select-check": function (target) {
      var id = target.getAttribute("data-id");
      if (!id || isInstalled(id)) return;
      selectedId = selectedId === id ? "" : id;
      render();
    },
    "place-check": function (target) {
      if (!selectedId) return;
      installIntoSlot(selectedId, Number(target.getAttribute("data-slot")));
    },
    finish: function () {
      fndUpdateState({ currentChunk: 5 });
      window.Chunk5.init();
      window.fndShowScene("scene-chunk5", "chunk5");
    }
  };

  function onClick(e) {
    var t = e.target.closest("[data-action]");
    if (!t) return;
    var fn = ACTIONS[t.getAttribute("data-action")];
    if (fn) fn(t);
  }

  function onDragStart(e) {
    var t = e.target.closest('.draggable-check-card');
    if (!t || t.disabled) return;
    e.dataTransfer.setData('text/plain', t.getAttribute('data-id'));
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragLeave(e) {
    var slot = e.target.closest('.detector-load-slot.is-empty-drop');
    if (slot) slot.classList.remove('is-drop-hover');
  }

  function onDragOver(e) {
    var slot = e.target.closest('.detector-load-slot.is-empty-drop');
    if (!slot) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    slot.classList.add('is-drop-hover');
  }

  function onDrop(e) {
    var slot = e.target.closest('.detector-load-slot.is-empty-drop');
    if (!slot) return;
    e.preventDefault();
    slot.classList.remove('is-drop-hover');
    var id = e.dataTransfer.getData('text/plain');
    var slotIndex = Number(slot.getAttribute('data-slot'));
    installIntoSlot(id, slotIndex);
  }
})();
