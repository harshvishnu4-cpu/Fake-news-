/*
  state.js
  Clean shared state and content model for The Fake News Detector V4.
  Core checks: Source, Claim, Proof, Pressure and Confirm.
*/

var FND_DEV = false;
var STATE_KEY = "fakeNewsDetectorState";
var SCENE_KEY = "fakeNewsDetectorScene";

var defaultGameState = {
  buildVersion: 16,
  playerName: "Agent",
  storyCompleted: false,
  storyStep: 0,
  storyImpacts: [],
  firstDecision: "",
  currentChunk: 1,
  chunk1Completed: false,
  chunk2Completed: false,
  chunk3Completed: false,
  chunk4Completed: false,
  chunk5Completed: false,
  chunk6Completed: false,
  chunk7Completed: false,
  investigationToolsCompleted: [],
  cluesFound: [],
  clueAttempts: {},
  trustedSourceChecked: false,
  investigationConclusion: "",
  rulesUnlocked: [],
  ruleMatches: {},
  ruleOrder: [],
  selectedChecks: [],
  detectorVersion: 1,
  detectorName: "",
  detectorBuildComplete: false,
  missingChecks: [],
  version1TestCases: [],
  version1TestResults: [],
  casesHandledSafelyV1: 0,
  repairedCases: [],
  upgradeChecksAdded: [],
  detectorLogicFixed: false,
  detectorLogicMode: "basic",
  casesHandledSafelyV2: 0,
  finalChallengeResults: [],
  personalCommitment: "",
  missionCompleted: false
};

function fndDevLog() {
  if (FND_DEV && window.console) console.log.apply(console, arguments);
}

function fndCloneDefault(value) {
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object") return {};
  return value;
}

function fndShapeMatches(defaultVal, restoredVal) {
  if (Array.isArray(defaultVal)) return Array.isArray(restoredVal);
  if (defaultVal && typeof defaultVal === "object") {
    return restoredVal && typeof restoredVal === "object" && !Array.isArray(restoredVal);
  }
  return typeof restoredVal === typeof defaultVal;
}

function fndLoadState() {
  var restored = {};
  try {
    var raw = sessionStorage.getItem(STATE_KEY);
    if (raw) restored = JSON.parse(raw) || {};
  } catch (err) {}

  if (restored.buildVersion !== defaultGameState.buildVersion) return Object.assign({}, defaultGameState);

  var merged = {};
  Object.keys(defaultGameState).forEach(function (key) {
    merged[key] = restored.hasOwnProperty(key) && fndShapeMatches(defaultGameState[key], restored[key])
      ? restored[key]
      : fndCloneDefault(defaultGameState[key]);
  });
  return merged;
}

var gameState = fndLoadState();

function fndSaveState() {
  try { sessionStorage.setItem(STATE_KEY, JSON.stringify(gameState)); } catch (err) {}
}

function fndUpdateState(patch) {
  Object.keys(patch || {}).forEach(function (key) { gameState[key] = patch[key]; });
  fndSaveState();
}

function fndSaveScene(sceneName) {
  try { sessionStorage.setItem(SCENE_KEY, sceneName); } catch (err) {}
}

function fndGetSavedScene() {
  try { return sessionStorage.getItem(SCENE_KEY); } catch (err) { return null; }
}

function fndResetState() {
  try {
    sessionStorage.removeItem(STATE_KEY);
    sessionStorage.removeItem(SCENE_KEY);
  } catch (err) {}
  Object.keys(defaultGameState).forEach(function (key) {
    gameState[key] = fndCloneDefault(defaultGameState[key]);
  });
}

var FND_ICONS = {
  sender: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.5-7 8-7s8 3 8 7"/></svg>',
  document: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M9 13h6M9 17h6"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  forward: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h14"/><path d="M12 6l6 6-6 6"/></svg>',
  pressure: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  proof: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M9 3v18M15 3v18" opacity=".4"/></svg>',
  claim: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M12 8v4M12 15h.01"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>',
  app: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 18h6"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a13 13 0 0 1 0 18 13 13 0 0 1 0-18z"/></svg>',
  group: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M2 20c0-3 2.5-5 6-5s6 2 6 5"/><path d="M14 15.5c2.8.3 4.5 1.9 4.5 4.5"/></svg>',
  magnify: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="6"/><path d="M20 20l-5.5-5.5"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3 11.2c.5.3.8.9.8 1.5V16h4.4v-.3c0-.6.3-1.2.8-1.5A6 6 0 0 0 12 3z"/></svg>'
};

var FND_RULES = [
  { id: "source-check", name: "SOURCE CHECK", question: "Who sent it?", shortQuestion: "Who sent it?", meaning: "Find the original sender.", icon: FND_ICONS.sender },
  { id: "claim-check", name: "CLAIM CHECK", question: "What is it claiming?", shortQuestion: "What is the claim?", meaning: "Notice big, unusual or high-impact claims.", icon: FND_ICONS.claim },
  { id: "proof-check", name: "PROOF CHECK", question: "What proves it?", shortQuestion: "What proves it?", meaning: "Look for a notice, link, date or document.", icon: FND_ICONS.proof },
  { id: "pressure-check", name: "PRESSURE CHECK", question: "Is it rushing me?", shortQuestion: "Is it rushing me?", meaning: "Pause when a message pushes you to act fast.", icon: FND_ICONS.pressure },
  { id: "confirm-check", name: "CONFIRM CHECK", question: "Can I confirm it?", shortQuestion: "Can I confirm it?", meaning: "Check the same information on a trusted source.", icon: FND_ICONS.shield }
];

var FND_CHECK_ORDER = ["source-check", "claim-check", "proof-check", "pressure-check", "confirm-check"];

var FND_CLUES = [
  { id: "source-clue", title: "SENDER HIDDEN", explanation: "The original sender is not shown.", icon: FND_ICONS.sender },
  { id: "claim-clue", title: "BIG CLAIM", explanation: "The school is said to be closed for three days.", icon: FND_ICONS.claim },
  { id: "proof-clue", title: "NO PROOF", explanation: "No circular, link or date is attached.", icon: FND_ICONS.proof },
  { id: "pressure-clue", title: "SHARE NOW", explanation: "The message pushes people to forward quickly.", icon: FND_ICONS.pressure },
  { id: "confirm-clue", title: "NO MATCH", explanation: "The school app and website show no such update.", icon: FND_ICONS.shield }
];

function fndRuleById(id) {
  for (var i = 0; i < FND_RULES.length; i++) if (FND_RULES[i].id === id) return FND_RULES[i];
  return null;
}

var FND_MESSAGE_BANK = {
  "base-suspicious": {
    id: "base-suspicious", title: "FREE TABLET ALERT", sender: "Unknown account",
    message: "You won a free tablet. Open the link now and forward this to five friends.",
    metadata: ["Unknown sender", "No official proof", "Share now"],
    checkResults: { "source-check": "warning", "claim-check": "warning", "proof-check": "warning", "pressure-check": "warning", "confirm-check": "warning" },
    expectedStatus: "SUSPICIOUS", expectedAction: "Do not open or share it."
  },
  "base-official": {
    id: "base-official", title: "SPORTS DAY UPDATE", sender: "Official school app",
    message: "Sports Day has moved to Friday because of heavy rain.",
    metadata: ["Official sender", "Circular attached", "Website matches"],
    checkResults: { "source-check": "clear", "claim-check": "clear", "proof-check": "clear", "pressure-check": "clear", "confirm-check": "clear" },
    expectedStatus: "VERIFIED", expectedAction: "Follow the official notice."
  },
  "exam-date-changed": {
    id: "exam-date-changed", title: "EXAM DATE CHANGED", sender: "Class group admin",
    message: "Tomorrow's maths exam has been moved to Monday. Share this with the whole class immediately.",
    metadata: ["Known group admin", "No official proof", "Share immediately"],
    checkResults: { "source-check": "clear", "claim-check": "warning", "proof-check": "warning", "pressure-check": "warning", "confirm-check": "warning" },
    expectedStatus: "SUSPICIOUS", expectedAction: "Do not share it before checking an official school source."
  },
  "bonus-marks": {
    id: "bonus-marks", title: "100 BONUS MARKS", sender: "Known group admin",
    message: "Every student will get 100 bonus marks after filling one form.",
    metadata: ["Known group admin", "No circular or link", "No official match"],
    checkResults: { "source-check": "clear", "claim-check": "warning", "proof-check": "warning", "pressure-check": "clear", "confirm-check": "warning" },
    expectedStatus: "NEEDS MORE CHECKING", expectedAction: "Check the claim on an official school channel."
  },
  "urgent-official": {
    id: "urgent-official", title: "WEATHER UPDATE", sender: "Official school app",
    message: "URGENT: School will close at 1:00 p.m. today because of heavy rain.",
    metadata: ["Official app", "Dated circular", "Website matches"],
    checkResults: { "source-check": "clear", "claim-check": "clear", "proof-check": "clear", "pressure-check": "warning", "confirm-check": "clear" },
    expectedStatus: "VERIFIED", expectedAction: "Follow the official notice."
  }
};

function fndGetTestCase(key) { return FND_MESSAGE_BANK[key] || null; }
function fndBuildVersion1TestCaseIds() { return ["base-suspicious", "exam-date-changed", "bonus-marks"]; }

var FND_FINAL_MESSAGES = [
  {
    id: "final-reliable", title: "LIBRARY TIMING", sender: "Official school app",
    message: "The library will close at 3:00 p.m. on Friday for maintenance.",
    metadata: ["Official app", "Dated circular", "Website matches"],
    checkResults: { "source-check": "clear", "claim-check": "clear", "proof-check": "clear", "pressure-check": "clear", "confirm-check": "clear" },
    correctStatus: "reliable", correctAction: "follow", feedback: "Official source and matching proof support it.",
    statusOrder: ["unverified", "reliable", "suspicious"],
    actionOrder: ["verify", "follow", "doNotShare"]
  },
  {
    id: "final-unverified", title: "TEST CANCELLED", sender: "Friend's class group",
    message: "Tomorrow's science test is cancelled. Tell everyone.",
    metadata: ["Shared by a friend", "No circular", "No school-app update"],
    checkResults: { "source-check": "neutral", "claim-check": "warning", "proof-check": "warning", "pressure-check": "neutral", "confirm-check": "warning" },
    correctStatus: "unverified", correctAction: "verify", feedback: "The claim matters, but it is not confirmed.",
    statusOrder: ["reliable", "suspicious", "unverified"],
    actionOrder: ["doNotShare", "verify", "follow"]
  },
  {
    id: "final-suspicious", title: "FREE GAME COINS", sender: "Unknown account",
    message: "Pay ₹200 now to unlock 10,000 coins. Forward this offer quickly.",
    metadata: ["Unknown sender", "Payment request", "Share quickly"],
    checkResults: { "source-check": "warning", "claim-check": "warning", "proof-check": "warning", "pressure-check": "warning", "confirm-check": "warning" },
    correctStatus: "suspicious", correctAction: "doNotShare", feedback: "Unknown source, strange claim and pressure are strong warnings.",
    statusOrder: ["suspicious", "unverified", "reliable"],
    actionOrder: ["doNotShare", "follow", "verify"]
  }
];

var FND_STATUS_OPTIONS = [
  { id: "reliable", label: "VERIFIED" },
  { id: "unverified", label: "NEEDS MORE CHECKING" },
  { id: "suspicious", label: "SUSPICIOUS" }
];

var FND_ACTION_OPTIONS = [
  { id: "follow", label: "FOLLOW" },
  { id: "verify", label: "VERIFY FIRST" },
  { id: "doNotShare", label: "DO NOT SHARE" }
];

function fndCheckResultLabel(status) {
  if (status === "warning") return "Warning Sign Found";
  if (status === "neutral") return "Needs More Checking";
  return "No Warning Sign";
}

function fndEscapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fndDisplayTitle(title) {
  var raw = String(title == null ? "" : title);
  if (!/[A-Z]/.test(raw) || /[a-z]/.test(raw)) return raw;
  var minor = { "a": true, "an": true, "and": true, "as": true, "at": true, "for": true, "in": true, "of": true, "on": true, "the": true, "to": true };
  return raw.toLowerCase().split(/\s+/).map(function (word, index) {
    if (/^v\d+$/.test(word)) return word.toUpperCase();
    if (index > 0 && minor[word]) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(" ");
}

function fndMissionHeader(title, progress) {
  return '<div class="mission-head">' +
    '<h2 tabindex="-1" data-autofocus>' + fndEscapeHtml(fndDisplayTitle(title)) + '</h2>' +
    (progress ? '<span class="mission-progress">' + fndEscapeHtml(progress) + '</span>' : '') +
  '</div>';
}

function fndPhoneMarkup(data, options) {
  options = options || {};
  var meta = Array.isArray(options.metadata) ? options.metadata : (Array.isArray(data.metadata) ? data.metadata : []);
  var activeCheck = options.activeCheck || "";
  var completedChecks = Array.isArray(options.completedChecks) ? options.completedChecks : [];
  var metaCheckMap = options.metaCheckMap || ["source-check", "proof-check", "pressure-check"];

  function scanClass(checkId) {
    var cls = "";
    if (activeCheck === checkId) cls += " is-scan-active scan-focus-" + checkId.replace("-check", "");
    if (completedChecks.indexOf(checkId) !== -1) cls += " is-scan-complete";
    return cls;
  }

  var metaHtml = meta.map(function (item, index) {
    var checkId = metaCheckMap[index] || "";
    return '<span class="phone-meta-chip' + scanClass(checkId) + '">' + fndEscapeHtml(item) + '</span>';
  }).join("");
  var imageHtml = options.image
    ? '<img class="phone-attachment" src="' + fndEscapeHtml(options.image) + '" alt="' + fndEscapeHtml(options.imageAlt || "Message attachment") + '">'
    : '';
  return '<div class="mission-phone">' +
    '<div class="mission-phone-notch"></div>' +
    '<div class="mission-phone-screen">' +
      '<div class="mission-phone-status"><span>11:29 AM</span><span>4G ▰</span></div>' +
      '<div class="mission-phone-header' + scanClass("source-check") + '"><span class="mission-phone-back">‹</span><span class="mission-phone-avatar">' + FND_ICONS.app + '</span>' +
        '<span class="mission-phone-contact"><strong>' + fndEscapeHtml(data.sender || "Messages") + '</strong><small>online</small></span>' +
        '<span class="mission-phone-menu">•••</span></div>' +
      '<div class="mission-phone-body">' +
        '<span class="mission-phone-day">Today</span><div class="mission-forwarded">Forwarded</div>' +
        '<div class="mission-chat-bubble' + scanClass("claim-check") + '"><h3>' + fndEscapeHtml(data.title || "") + '</h3><p>' + fndEscapeHtml(data.message || "") + '</p>' +
          imageHtml + '<div class="phone-meta-wrap">' + metaHtml + '</div><span class="mission-chat-time">11:29 AM</span></div>' +
        '<div class="mission-phone-input"><span>Message</span><b></b></div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

/* Persist a clean current-build state immediately when an older build is detected. */
if (gameState.buildVersion !== 16) {
  fndResetState();
  fndSaveState();
}
