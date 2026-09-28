/* =========================================================
   DEV PAGE MENU — testing aid, NOT part of the game
   ---------------------------------------------------------
   Jump straight to any screen instead of playing through to it.

   TO REMOVE BEFORE DELIVERY: delete the /dev folder and the two tagged
   lines in index.html (search for "DEV ONLY"). Nothing else references
   this file, and no game file was modified to support it.

   It drives the game through hooks the game already exposes:
     window.fndShowScene(sceneId, sceneKey)   — app.js
     window.Chunk2..Chunk7 .init()            — chunk modules
   ========================================================= */

(function () {
  "use strict";

  var PAGES = [
    { id: "scene-entry",      key: "entry",      label: "Landing" },
    { id: "scene-byte-intro", key: "byte-intro", label: "Byte intro" },
    { id: "scene-dashboard",  key: "dashboard",  label: "Message / dashboard" },
    { id: "scene-chunk2",     key: "chunk2",     label: "Find the red flags", mod: "Chunk2" },
    { id: "scene-chunk3",     key: "chunk3",     label: "Checking rules",     mod: "Chunk3" },
    { id: "scene-chunk4",     key: "chunk4",     label: "Build Detector V1",  mod: "Chunk4" },
    { id: "scene-chunk5",     key: "chunk5",     label: "Test Detector V1",   mod: "Chunk5" },
    { id: "scene-chunk6",     key: "chunk6",     label: "Upgrade to V2",      mod: "Chunk6" },
    { id: "scene-chunk7",     key: "chunk7",     label: "Final mission",      mod: "Chunk7" },
    { id: "scene-complete",   key: "complete",   label: "Mission complete" }
  ];

  var root, toggle, panel, list;
  var open = false;

  function build() {
    root = document.createElement("div");
    root.className = "devmenu";
    root.setAttribute("data-dev-only", "true");

    toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "devmenu-toggle";
    toggle.setAttribute("aria-haspopup", "true");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "devmenuPanel");
    toggle.title = "Dev: jump to page";
    toggle.setAttribute("aria-label", "Dev menu: jump to page");
    toggle.innerHTML = '<span class="devmenu-bars" aria-hidden="true"><i></i><i></i><i></i></span>';

    panel = document.createElement("div");
    panel.className = "devmenu-panel";
    panel.id = "devmenuPanel";
    panel.setAttribute("role", "menu");
    panel.hidden = true;

    var head = document.createElement("div");
    head.className = "devmenu-head";
    head.textContent = "DEV · jump to page";
    panel.appendChild(head);

    list = document.createElement("div");
    list.className = "devmenu-list";
    PAGES.forEach(function (page, i) {
      var item = document.createElement("button");
      item.type = "button";
      item.className = "devmenu-item";
      item.setAttribute("role", "menuitem");
      item.dataset.sceneId = page.id;
      item.innerHTML =
        '<span class="devmenu-num">' + (i + 1) + '</span>' +
        '<span class="devmenu-label"></span>' +
        '<span class="devmenu-dot" aria-hidden="true"></span>';
      item.querySelector(".devmenu-label").textContent = page.label;
      item.addEventListener("click", function () { go(page); });
      list.appendChild(item);
    });
    panel.appendChild(list);

    var foot = document.createElement("div");
    foot.className = "devmenu-foot";
    foot.textContent = "Testing only — delete /dev before release";
    panel.appendChild(foot);

    root.appendChild(toggle);
    root.appendChild(panel);
    document.body.appendChild(root);

    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!open);
    });

    // Clicking anywhere outside closes it. Capture phase so it still fires
    // when a scene handler stops propagation on its own elements.
    document.addEventListener("pointerdown", function (e) {
      if (!open) return;
      if (root.contains(e.target)) return;
      setOpen(false);
    }, true);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) { setOpen(false); toggle.focus(); }
    });
  }

  function setOpen(next) {
    open = next;
    panel.hidden = !open;
    root.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) markActive();
  }

  /* The active page is read from the DOM rather than tracked separately, so
     it stays correct however the player got there — menu, gameplay or Back. */
  function markActive() {
    var active = document.querySelector(".scene.is-active");
    var id = active ? active.id : "";
    Array.prototype.forEach.call(list.children, function (item) {
      var on = item.dataset.sceneId === id;
      item.classList.toggle("is-active", on);
      if (on) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
  }

  function go(page) {
    setOpen(false);
    if (window.FNDVoice && window.FNDVoice.stop) window.FNDVoice.stop();
    // Each chunk module resets its own state in init(), so a direct jump
    // lands on a clean version of that screen.
    if (page.mod && window[page.mod] && typeof window[page.mod].init === "function") {
      try { window[page.mod].init(); } catch (err) { logError(page, err); }
    }
    if (typeof window.fndShowScene === "function") {
      try { window.fndShowScene(page.id, page.key); } catch (err) { logError(page, err); }
    }
    markActive();
  }

  function logError(page, err) {
    if (window.console) console.warn("[dev-menu] jump to " + page.id + " failed:", err);
  }

  function start() {
    if (!document.body) return;
    build();
    markActive();
    // Keep the highlight honest while the menu is closed too.
    var active = document.querySelector(".scene.is-active");
    if (active && active.parentNode) {
      new MutationObserver(markActive).observe(active.parentNode, {
        subtree: true, attributes: true, attributeFilter: ["class"]
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
