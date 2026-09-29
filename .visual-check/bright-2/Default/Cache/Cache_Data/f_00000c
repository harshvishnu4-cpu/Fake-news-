/*
  fnd-motion.js
  GSAP motion layer for The Fake News Detector.

  Everything here is decorative. If GSAP fails to load, or the learner asks for
  reduced motion, every entry point degrades to a no-op and the mission still
  plays exactly the same — the chunks never depend on a callback from here.

  Three jobs:
    1. Screen transitions  — each scene and each re-render enters as a timeline.
    2. Touch feedback      — delegated hover / press / ripple for every button,
                             so it survives the chunks replacing innerHTML.
    3. Gameplay moments    — clue unlocked, scan sweep, right answer, wrong
                             answer, score count-up, idle nudge.
*/

(function () {
  "use strict";

  var gsap = window.gsap;
  var hasGsap = !!(gsap && gsap.to);
  var reduced = false;
  try {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (err) {}

  var active = hasGsap && !reduced;
  var fxLayer = null;
  var signatures = {};
  var idleTimer = null;
  var idleTargets = "";
  var idleRoot = null;
  var idleDelay = 8000;

  /* =========================================================
     Small helpers
     ========================================================= */

  function all(root, selector) {
    if (!root) return [];
    return Array.prototype.slice.call(root.querySelectorAll(selector));
  }

  // Keeps a timeline from targeting things the learner cannot see anyway.
  function visible(list) {
    return list.filter(function (el) {
      return el && !el.hidden && el.getClientRects().length > 0;
    });
  }

  function getFxLayer() {
    if (fxLayer && fxLayer.isConnected) return fxLayer;
    fxLayer = document.createElement("div");
    fxLayer.className = "fnd-fx-layer";
    fxLayer.setAttribute("aria-hidden", "true");
    document.body.appendChild(fxLayer);
    return fxLayer;
  }

  function centreOf(el) {
    var box = el.getBoundingClientRect();
    return { x: box.left + box.width / 2, y: box.top + box.height / 2, box: box };
  }

  /* =========================================================
     1. Scene and re-render entry animations
     ========================================================= */

  // Panels first, then the interactive pieces inside them. Listing the item
  // selectors explicitly (rather than "every child") keeps long lists from
  // cascading into a slow, distracting ripple.
  var PANEL_SELECTOR = [
    ".mission-phone",
    ".glass-panel",
    ".detector-core-panel",
    ".entry-card",
    ".byte-intro-card",
    ".dashboard-frame",
    ".byte-slot"
  ].join(",");

  var ITEM_SELECTOR = [
    ".unlock-slot",
    ".scan-result-row",
    ".mini-check-result",
    ".prototype-check-card",
    ".missing-tool-card",
    ".upgrade-check-card",
    ".warning-prediction-card",
    ".prediction-btn",
    ".verdict-choice",
    ".compact-answer-btn",
    ".process-order-row",
    ".orbit-check",
    ".detector-load-slot",
    ".builder-slot-chip",
    ".completion-score-card",
    ".commitment-step",
    ".logic-check-module",
    ".test-step-strip span",
    ".active-rule-chip"
  ].join(",");

  // Re-rendered-in-place pieces: these get a short pop even when the screen
  // itself has not changed, because they are the answer to what was tapped.
  var UPDATE_SELECTOR = [
    ".inline-feedback",
    ".unlock-flash",
    ".v1-progress-reward",
    ".prediction-reveal",
    ".install-count-pill"
  ].join(",");

  function sceneRootsFor(scene) {
    var roots = all(scene, ".mission-workspace, .dashboard-row, .entry-card, .byte-intro-card");
    if (roots.length) return roots;
    // Never animate the .scene element itself. Its opacity belongs to the
    // .is-active CSS transition, and an inline value left behind would keep a
    // finished screen painted on top of the next one.
    return Array.prototype.slice.call(scene.children);
  }

  function playEnter(scene, full) {
    if (!active || !scene) return;

    var roots = sceneRootsFor(scene);
    // The entry and Byte-intro cards are both a scene root and a panel. Animating
    // one element from two tweens in the same timeline makes overwrite kill the
    // first mid-flight, so a root never also counts as a panel.
    var panels = visible(all(scene, PANEL_SELECTOR)).filter(function (el) {
      return roots.indexOf(el) === -1;
    });
    var items = visible(all(scene, ITEM_SELECTOR));
    var head = scene.querySelector(".mission-head");
    // clearProps everywhere: these screens are rebuilt by innerHTML, and a
    // leftover inline opacity/transform is how a finished screen ends up stuck
    // on top of the next one.
    var tl = gsap.timeline({
      defaults: { ease: "power3.out", overwrite: "auto", clearProps: "opacity,transform" }
    });

    if (full) {
      tl.from(roots, { opacity: 0, y: 16, duration: 0.34 }, 0);
      if (head) tl.from(head, { opacity: 0, y: -14, duration: 0.34 }, 0.04);
      if (panels.length) {
        tl.from(panels, { opacity: 0, y: 22, scale: 0.985, duration: 0.42, stagger: 0.07 }, 0.06);
      }
      if (items.length) {
        tl.from(items, {
          opacity: 0,
          y: 12,
          duration: 0.3,
          stagger: { each: 0.035, amount: Math.min(0.42, items.length * 0.035) }
        }, 0.18);
      }
    } else {
      var updated = visible(all(scene, UPDATE_SELECTOR));
      if (updated.length) {
        tl.from(updated, { opacity: 0, y: 8, scale: 0.98, duration: 0.26, stagger: 0.05 }, 0);
      }
      var chosen = visible(all(scene, ".is-selected, .is-armed, .is-correct-answer"));
      if (chosen.length) {
        tl.fromTo(chosen, { scale: 0.94 }, { scale: 1, duration: 0.28, ease: "back.out(2.4)" }, 0);
      }
    }

    return tl;
  }

  /*
    Called by every chunk at the end of render(). The signature is whatever
    identifies "a different screen" for that chunk (step, phase, case index).
    A new signature replays the full entry; the same signature only pops the
    pieces that actually changed, so tapping a card never re-animates the
    whole panel underneath the learner's finger.
  */
  function enter(container, signature) {
    if (!active || !container) return;
    var scene = container.closest ? container.closest(".scene") : null;
    if (!scene || !scene.classList.contains("is-active")) return; // scene-change will run it

    var key = scene.id || "scene";
    var full = signatures[key] !== signature;
    signatures[key] = signature;
    playEnter(scene, full);
  }

  function onSceneChange() {
    var scene = document.querySelector(".scene.is-active");
    if (!scene) return;
    signatures[scene.id || "scene"] = "__entered__";
    playEnter(scene, true);
    bumpProgressDot();
  }

  /* =========================================================
     2. Delegated button feedback
     ========================================================= */

  // Bigger, card-shaped targets can afford a bigger lift than a text button.
  var HOVER_RULES = [
    { sel: ".prototype-check-card,.missing-tool-card,.upgrade-check-card,.warning-prediction-card,.detector-load-slot,.choice-card,.settings-action", y: -4, scale: 1.04 },
    // HUD plates are angled or round art, so they lift and swell rather than
    // taking a rectangular ripple that would escape their silhouette.
    { sel: ".hud-cta", y: -4, scale: 1.035 },
    { sel: ".hud-quit,.hud-info,.hud-hint,.hud-sound", y: -2, scale: 1.07 },
    { sel: ".btn-primary,.compact-btn,.byte-cta,.btn-ghost,.bottom-nav-control", y: -3, scale: 1.03 },
    { sel: ".prediction-btn,.verdict-choice,.compact-answer-btn,.decision-btn", y: -3, scale: 1.025 },
    { sel: ".hunt-clue", y: -1, scale: 1.02 },
    { sel: ".header-control,.icon-btn", y: -2, scale: 1.06 },
    { sel: "button", y: -2, scale: 1.02 }
  ];

  var RIPPLE_SELECTOR = ".btn-primary,.compact-btn,.byte-cta,.decision-btn,.prediction-btn,.verdict-choice,.compact-answer-btn,.prototype-check-card,.missing-tool-card,.upgrade-check-card,.warning-prediction-card,.settings-action,.bottom-nav-control,.header-control,.choice-card,.hunt-clue,.detector-load-slot";

  function hoverSpecFor(btn) {
    if (btn.__fndHover) return btn.__fndHover;
    for (var i = 0; i < HOVER_RULES.length; i += 1) {
      if (btn.matches(HOVER_RULES[i].sel)) {
        btn.__fndHover = HOVER_RULES[i];
        return btn.__fndHover;
      }
    }
    btn.__fndHover = HOVER_RULES[HOVER_RULES.length - 1];
    return btn.__fndHover;
  }

  function interactiveTarget(node) {
    if (!node || !node.closest) return null;
    var btn = node.closest("button");
    if (!btn || btn.disabled) return null;
    // The header Next proxy is an off-screen relay, never something to animate.
    if (btn.classList.contains("header-next-proxy")) return null;
    if (btn.getAttribute("aria-hidden") === "true") return null;
    return btn;
  }

  function hoverIn(btn) {
    var spec = hoverSpecFor(btn);
    gsap.to(btn, { y: spec.y, scale: spec.scale, duration: 0.22, ease: "power2.out", overwrite: "auto" });
  }

  function hoverOut(btn) {
    gsap.to(btn, {
      y: 0,
      scale: 1,
      duration: 0.28,
      ease: "power2.out",
      overwrite: "auto",
      clearProps: "transform"
    });
  }

  function press(btn) {
    var spec = hoverSpecFor(btn);
    gsap.to(btn, { scale: spec.scale * 0.94, y: 0, duration: 0.09, ease: "power2.out", overwrite: "auto" });
  }

  function release(btn, stillHovering) {
    if (stillHovering) {
      var spec = hoverSpecFor(btn);
      gsap.to(btn, { scale: spec.scale, y: spec.y, duration: 0.3, ease: "back.out(3)", overwrite: "auto" });
    } else {
      hoverOut(btn);
    }
  }

  function ripple(btn, x, y) {
    if (!btn.matches(RIPPLE_SELECTOR)) return;
    var box = btn.getBoundingClientRect();
    var size = Math.max(box.width, box.height) * 2.2;
    var dot = document.createElement("span");
    dot.className = "fnd-ripple";
    dot.style.width = dot.style.height = size + "px";
    dot.style.left = (x - box.left - size / 2) + "px";
    dot.style.top = (y - box.top - size / 2) + "px";
    btn.classList.add("fnd-ripple-host");
    btn.appendChild(dot);
    gsap.fromTo(dot,
      { scale: 0, opacity: 0.5 },
      {
        scale: 1, opacity: 0, duration: 0.55, ease: "power2.out",
        onComplete: function () {
          if (dot.parentNode) dot.parentNode.removeChild(dot);
        }
      });
  }

  function bindButtonFeedback() {
    if (!active) return;

    document.addEventListener("pointerover", function (e) {
      var btn = interactiveTarget(e.target);
      if (!btn) return;
      if (e.relatedTarget && btn.contains(e.relatedTarget)) return;
      hoverIn(btn);
    });

    document.addEventListener("pointerout", function (e) {
      var btn = interactiveTarget(e.target);
      if (!btn) return;
      if (e.relatedTarget && btn.contains(e.relatedTarget)) return;
      hoverOut(btn);
    });

    document.addEventListener("pointerdown", function (e) {
      var btn = interactiveTarget(e.target);
      if (!btn) return;
      press(btn);
      ripple(btn, e.clientX, e.clientY);
    });

    function endPress(e) {
      var btn = interactiveTarget(e.target);
      if (!btn) return;
      release(btn, e.pointerType === "mouse" && btn.matches(":hover"));
    }
    document.addEventListener("pointerup", endPress);
    document.addEventListener("pointercancel", endPress);

    // Keyboard activation gets the same confirmation as a tap.
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var btn = interactiveTarget(document.activeElement);
      if (btn) pop(btn, 0.95);
    });
  }

  /* =========================================================
     3. Gameplay moments
     ========================================================= */

  function pop(el, from) {
    if (!active || !el) return;
    gsap.fromTo(el,
      { scale: from || 0.92 },
      { scale: 1, duration: 0.42, ease: "elastic.out(1, 0.55)", overwrite: "auto", clearProps: "transform" });
  }

  function shake(el) {
    if (!active || !el) return;
    gsap.fromTo(el,
      { x: -9 },
      { x: 0, duration: 0.55, ease: "elastic.out(1, 0.32)", overwrite: "auto", clearProps: "transform" });
  }

  function attention(el) {
    if (!active || !el) return;
    gsap.fromTo(el,
      { scale: 1 },
      { scale: 1.05, duration: 0.4, ease: "sine.inOut", yoyo: true, repeat: 3, overwrite: "auto", clearProps: "transform" });
  }

  // Particle burst from an element's centre — used for a found clue, an
  // installed check and a solved case.
  function burst(el, options) {
    if (!active || !el) return;
    options = options || {};
    var count = options.count || 14;
    var colors = options.colors || ["#3fd6ff", "#a6ff6b", "#8b6bff"];
    var spread = options.spread || 130;
    var origin = centreOf(el);
    var layer = getFxLayer();

    for (var i = 0; i < count; i += 1) {
      var bit = document.createElement("span");
      bit.className = "fnd-spark";
      bit.style.background = colors[i % colors.length];
      bit.style.left = origin.x + "px";
      bit.style.top = origin.y + "px";
      layer.appendChild(bit);

      var angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      var distance = spread * (0.55 + Math.random() * 0.65);
      gsap.to(bit, {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        opacity: 0,
        scale: 0.2,
        duration: 0.6 + Math.random() * 0.35,
        ease: "power2.out",
        onComplete: (function (node) {
          return function () { if (node.parentNode) node.parentNode.removeChild(node); };
        })(bit)
      });
    }
  }

  // Confetti for the two genuine celebration beats (case solved, mission done).
  function celebrate() {
    if (!active) return;
    var layer = getFxLayer();
    var colors = ["#3fd6ff", "#a6ff6b", "#ff8a5b", "#8b6bff", "#f6f9ff"];
    for (var i = 0; i < 46; i += 1) {
      var bit = document.createElement("span");
      bit.className = "fnd-confetti";
      bit.style.background = colors[i % colors.length];
      bit.style.left = (window.innerWidth * (0.15 + Math.random() * 0.7)) + "px";
      bit.style.top = "-20px";
      layer.appendChild(bit);
      gsap.to(bit, {
        y: window.innerHeight + 60,
        x: (Math.random() - 0.5) * 220,
        rotation: Math.random() * 720 - 360,
        opacity: 0,
        duration: 1.5 + Math.random() * 1.1,
        delay: Math.random() * 0.35,
        ease: "power1.in",
        onComplete: (function (node) {
          return function () { if (node.parentNode) node.parentNode.removeChild(node); };
        })(bit)
      });
    }
  }

  // A light sweeping down the phone screen while the detector runs its checks.
  function scanBeam(phoneScreen, duration) {
    if (!active || !phoneScreen) return null;
    var beam = phoneScreen.querySelector(".fnd-scan-beam");
    if (!beam) {
      beam = document.createElement("span");
      beam.className = "fnd-scan-beam";
      phoneScreen.appendChild(beam);
    }
    gsap.killTweensOf(beam);
    gsap.set(beam, { opacity: 1, yPercent: -120 });
    return gsap.to(beam, {
      yPercent: 620,
      duration: duration || 1.1,
      ease: "none",
      repeat: -1
    });
  }

  function stopScanBeam(root) {
    all(root || document, ".fnd-scan-beam").forEach(function (beam) {
      if (active) gsap.killTweensOf(beam);
      if (beam.parentNode) beam.parentNode.removeChild(beam);
    });
  }

  // Numbers on the completion screen tick up instead of just appearing.
  function countUp(el, to, suffix) {
    if (!el) return;
    if (!active) {
      el.textContent = to + (suffix || "");
      return;
    }
    var box = { value: 0 };
    gsap.to(box, {
      value: to,
      duration: 0.9,
      ease: "power2.out",
      onUpdate: function () {
        el.textContent = Math.round(box.value) + (suffix || "");
      }
    });
  }

  /* =========================================================
     Idle nudge — a grade-6 learner who stops tapping gets a hint
     ========================================================= */

  function clearIdleHint() {
    if (idleTimer) window.clearTimeout(idleTimer);
    idleTimer = null;
    idleRoot = null;
    idleTargets = "";
  }

  function idleHint(root, selector, delay) {
    clearIdleHint();
    if (!active || !root) return;
    idleRoot = root;
    idleTargets = selector;
    idleDelay = delay || 8000;
    idleTimer = window.setTimeout(function () {
      if (!idleRoot || !idleRoot.isConnected) return;
      var targets = visible(all(idleRoot, idleTargets));
      if (!targets.length) return;
      gsap.fromTo(targets,
        { scale: 1 },
        {
          scale: 1.035,
          duration: 0.45,
          ease: "sine.inOut",
          yoyo: true,
          repeat: 3,
          stagger: 0.12,
          overwrite: "auto",
          clearProps: "transform"
        });
      idleHint(idleRoot, idleTargets, idleDelay); // keep nudging until they act
    }, idleDelay);
  }

  document.addEventListener("pointerdown", function () {
    if (idleTimer && idleRoot) idleHint(idleRoot, idleTargets, idleDelay);
  });

  /* =========================================================
     Header, timer and modal reactions
     ========================================================= */

  function bumpProgressDot() {
    var dot = document.querySelector(".game-header-progress span.is-active");
    if (dot) pop(dot, 0.55);
  }

  function watchHeaderNext() {
    var next = document.getElementById("btnHeaderNext");
    if (!next || typeof MutationObserver === "undefined") return;
    var wasDisabled = next.disabled;
    new MutationObserver(function () {
      if (wasDisabled && !next.disabled) attention(next);
      wasDisabled = next.disabled;
    }).observe(next, { attributes: true, attributeFilter: ["disabled"] });
  }

  function watchTimer() {
    var timer = document.getElementById("gameHeaderTimer");
    if (!timer || typeof MutationObserver === "undefined") return;
    var warning = false;
    new MutationObserver(function () {
      var now = timer.classList.contains("is-warning") || timer.classList.contains("is-expired");
      if (now && !warning) attention(timer);
      warning = now;
    }).observe(timer, { attributes: true, attributeFilter: ["class"] });
  }

  function watchModals() {
    if (typeof MutationObserver === "undefined") return;
    all(document, ".modal-overlay").forEach(function (overlay) {
      var box = overlay.querySelector(".modal-box");
      if (!box) return;
      var open = overlay.classList.contains("is-open");
      new MutationObserver(function () {
        var now = overlay.classList.contains("is-open");
        if (now && !open) {
          gsap.fromTo(box,
            { opacity: 0, y: 26, scale: 0.94 },
            { opacity: 1, y: 0, scale: 1, duration: 0.38, ease: "back.out(1.5)", clearProps: "transform,opacity" });
          var actions = visible(all(box, ".settings-action, .modal-actions button"));
          if (actions.length) {
            gsap.from(actions, { opacity: 0, y: 12, duration: 0.3, stagger: 0.04, delay: 0.1 });
          }
        }
        open = now;
      }).observe(overlay, { attributes: true, attributeFilter: ["class"] });
    });
  }

  // Byte breathes while he waits, so the guide never looks frozen.
  function animateByte(root) {
    if (!active) return;
    visible(all(root || document, ".byte-mini-figure img, .byte-figure img, .commitment-byte img")).forEach(function (img) {
      if (img.__fndFloating) return;
      img.__fndFloating = true;
      gsap.to(img, {
        y: -6,
        duration: 2.1,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });
    });
  }

  /* =========================================================
     Boot
     ========================================================= */

  function init() {
    document.body.classList.add(active ? "fnd-motion" : "fnd-motion-off");
    if (!active) return;

    gsap.defaults({ ease: "power2.out" });
    bindButtonFeedback();
    watchHeaderNext();
    watchTimer();
    watchModals();

    window.addEventListener("fnd:sceneChange", function () {
      window.requestAnimationFrame(function () {
        onSceneChange();
        animateByte();
      });
    });

    // Byte can appear inside a re-render, so re-check whenever the stage changes.
    var stage = document.getElementById("stage");
    if (stage && typeof MutationObserver !== "undefined") {
      new MutationObserver(function () { animateByte(); })
        .observe(stage, { childList: true, subtree: true });
    }

    playEnter(document.querySelector(".scene.is-active"), true);
    animateByte();
  }

  window.FNDMotion = {
    enabled: active,
    enter: enter,
    pop: pop,
    shake: shake,
    attention: attention,
    burst: burst,
    celebrate: celebrate,
    scanBeam: scanBeam,
    stopScanBeam: stopScanBeam,
    countUp: countUp,
    idleHint: idleHint,
    clearIdleHint: clearIdleHint,
    animateByte: animateByte
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
