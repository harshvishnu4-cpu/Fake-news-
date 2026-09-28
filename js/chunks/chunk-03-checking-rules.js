/* CHUNK 3 — FALLBACK SUMMARY FOR THE THREE DISCOVERED CHECKS */
(function () {
  "use strict";

  var container = null;
  var bound = false;
  var INITIAL = ["source-check", "claim-check", "pressure-check"];

  function init() {
    container = document.getElementById("scene-chunk3");
    if (!container) return;
    if (!bound) {
      container.addEventListener("click", onClick);
      bound = true;
    }
    render();
  }

  function reset() {
    if (container) container.innerHTML = "";
  }

  window.Chunk3 = { init: init, reset: reset };

  function render() {
    container.innerHTML = '<div class="mission-workspace">' +
      fndMissionHeader("3 CHECKS UNLOCKED", "Ready for V1") +
      '<div class="glass-panel checks-unlocked-panel three-check-summary">' +
        '<div class="five-check-orbit three-check-orbit">' + INITIAL.map(function (id) {
          var rule = fndRuleById(id);
          return '<div class="orbit-check"><span>' + rule.icon + '</span><strong>' + rule.name.replace(" CHECK", "") + '</strong></div>';
        }).join("") + '</div>' +
        '<h3 data-autofocus tabindex="-1">Build with what you discovered.</h3>' +
        '<button class="btn-primary compact-btn" data-action="finish">BUILD V1</button>' +
      '</div></div>';
    if (window.FNDMotion) window.FNDMotion.enter(container, 'summary');
  }

  function onClick(e) {
    var t = e.target.closest("[data-action]");
    if (!t || t.getAttribute("data-action") !== "finish") return;
    fndUpdateState({ rulesUnlocked: INITIAL.slice(), chunk3Completed: true, currentChunk: 4 });
    window.Chunk4.init();
    window.fndShowScene("scene-chunk4", "chunk4");
  }
})();
