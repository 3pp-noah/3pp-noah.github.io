/*
 * usage.js — the owner's usage recorder for the 3PP-NOAH sites.
 *
 * Every page of 3pp-noah.github.io and nth-member.github.io loads this file. For a visitor it does
 * nothing: unless this browser has been enrolled by the sites' owner, it returns at once and reads,
 * stores and sends nothing.
 *
 * Enrolled (by an enrolment link, opened once per browser on each of the two domains), it records how
 * the pages are used, so that their revamp can follow actual use: the pages opened and how, the
 * controls used, the values of choices, numbers and searches (other typed text only as a length, and
 * nothing typed or shown on the gematria page), time on the page, scrolling, copying, errors and failed
 * requests, and notes written with the pencil button or Alt+Shift+N. Records wait in this browser's
 * IndexedDB and go in batches to the owner's private Google Form; sent records are kept here for 30
 * days. Open any page with #usage for the status, a download of the records, or to turn it off.
 */
(() => {
"use strict";
const CFG = "usage.cfg", TAIL = "usage.tail.";
const LOCAL = /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } };
const isCommand = (h) => /^#usage(=|$)/.test(h);
if (window !== window.top || window.usageRecorder) return; // shown inside another page, or loaded twice
let cfg = read(CFG);
if (cfg && !(cfg.e && cfg.dev && (cfg.f || (cfg.u && LOCAL)))) cfg = null;
if (!cfg && !isCommand(location.hash)) { // a visitor: nothing is stored, sent or changed
  addEventListener("hashchange", () => { if (isCommand(location.hash)) location.reload(); }); // an enrolment link opened on this page
  return;
}
const command = isCommand(location.hash) ? location.hash : "";

const RV = 1;                                          // record format
const STRICT = /^\/gematria(\/|$)/.test(location.pathname); // nothing typed or shown there is kept
const KEEP_DAYS = 30, BATCH = 45000, WAIT = 5 * 60e3;
const nativeFetch = window.fetch;
const send = (url, init) => nativeFetch.call(window, url, init);

// ---- small helpers
const squash = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const clip = (s, n) => { s = squash(s); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
const cut = (s, n) => { s = String(s ?? ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
const rnd = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => (b % 36).toString(36)).join("");
const pv = rnd(6); // this page view
let seq = 0;
const newId = () => Date.now().toString(36) + (seq++).toString(36).padStart(3, "0") + pv;
const decode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };
const own = (el) => !!el?.closest?.("usage-recorder");

function where(full) {
  const w = { p: location.pathname };
  if (full && !STRICT) {
    if (location.search) w.q = clip(decode(location.search), 300);
    if (location.hash && !location.hash.startsWith("#usage")) w.h = clip(decode(location.hash), 500);
  }
  return w;
}
function addr(u) {
  try {
    const x = new URL(u, location.href), same = x.origin === location.origin;
    if (STRICT) return same ? x.pathname : x.origin + x.pathname;
    return clip(decode(same ? x.pathname + x.search + x.hash : x.href), 300);
  } catch { return ""; }
}
function ownText(root) { // the visible words of an element, not of fields inside it
  let s = "";
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => n.parentElement?.closest("select,textarea,option,script,style,usage-recorder") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  while (s.length < 120 && w.nextNode()) s += " " + w.currentNode.data;
  return squash(s);
}
const FIELD = "input,select,textarea";
function fieldLabel(el) {
  const forLabel = el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
  return el.getAttribute("aria-label") || (forLabel && ownText(forLabel)) || (el.closest("label") && ownText(el.closest("label")))
    || el.getAttribute("placeholder") || el.getAttribute("title") || "";
}
function describe(el) { // which element: never what was typed into it
  if (!(el instanceof Element)) return { tag: "?" };
  const d = { tag: el.localName }, a = (n) => el.getAttribute(n);
  if (el.id) d.eid = clip(el.id, 60);
  for (const n of ["role", "name", "type"]) if (a(n)) d[n] = clip(a(n), 40);
  const cls = typeof el.className === "string" ? squash(el.className).split(" ").slice(0, 2).join(" ") : "";
  if (cls) d.cls = clip(cls, 60);
  const ctx = el.parentElement?.closest("[id]");
  if (ctx) d.in = clip(ctx.id, 40);
  if (!STRICT) {
    const text = el.matches(FIELD) ? fieldLabel(el) : a("aria-label") || ownText(el) || a("title") || a("alt");
    if (text) d.text = clip(text, 60);
  }
  if (el.localName === "a" && a("href")) d.href = addr(el.href);
  return d;
}
const CONTROL = 'a[href],button,input,select,textarea,label,summary,option,[role="button"],[role="tab"],[role="link"],'
  + '[role="menuitem"],[role="option"],[role="radio"],[role="checkbox"],[role="switch"],[onclick],[tabindex]:not([tabindex="-1"])';
function controlOf(t) { // the control a click was meant for; script-driven ones show a pointer cursor
  const c = t.closest(CONTROL);
  if (c) return [c, true];
  let top = null;
  for (let n = t, i = 0; n && n !== document.body && n !== document.documentElement && i < 8; n = n.parentElement, i++) {
    if (getComputedStyle(n).cursor === "pointer") top = n; else if (top) break;
  }
  return top ? [top, true] : [t, false];
}
const VALUED = new Set(["number", "range", "date", "time", "datetime-local", "month", "week", "color"]);
const searchy = (el) => el.type === "search"
  || /search|filter|find|query|⌕/i.test([el.id, el.name, el.placeholder, el.getAttribute("aria-label")].join(" "));
function fieldValue(el) { // what may be kept of a field's value
  if (STRICT) return {};
  const type = (el.type || "").toLowerCase(), v = String(el.value ?? "");
  if (type === "password") return {};
  if (type === "file") return { files: el.files?.length ?? 0, ext: [...(el.files ?? [])].slice(0, 5).map((f) => (/\.[\w-]{1,8}$/.exec(f.name)?.[0] ?? "").toLowerCase()) };
  if (type === "checkbox" || type === "radio") return { v: clip(v, 80), on: el.checked };
  if (el.localName === "select") {
    const o = [...el.selectedOptions];
    return { v: clip(o.map((x) => x.value).join("|"), 120), vt: clip(o.map((x) => x.text).join("|"), 120) };
  }
  if (VALUED.has(type)) return { v: clip(v, 80) };
  if (searchy(el)) return { v: clip(v, 120) };
  if (v.length <= 40 && /^[-+\d\s.,:/%]*$/.test(v)) return { v };  // numbers, ratios, times
  return { n: v.length };                                          // other text: its length only
}
function browser() {
  const ua = navigator.userAgent;
  const names = [["Edg", "Edge"], ["OPR", "Opera"], ["SamsungBrowser", "Samsung"], ["Firefox", "Firefox"], ["FxiOS", "Firefox"],
    ["CriOS", "Chrome"], ["Chrome", "Chrome"], ["Version", "Safari"]];
  let b = "other";
  for (const [k, n] of names) { const m = new RegExp(k + "/(\\d+)").exec(ua); if (m) { b = `${n} ${m[1]}`; break; } }
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows"
    : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return `${b} ${os}`.trim();
}

// ---- storage: IndexedDB queue "q", sent records "sent" (kept KEEP_DAYS), both keyed by record id
let dbp = null;
const req = (r) => new Promise((ok, no) => { r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
const done = (t) => new Promise((ok, no) => { t.oncomplete = ok; t.onerror = t.onabort = () => no(t.error); });
function db() {
  return dbp ??= new Promise((ok, no) => {
    const r = indexedDB.open("usage-recorder", 1);
    r.onupgradeneeded = () => { r.result.createObjectStore("q", { keyPath: "id" }); r.result.createObjectStore("sent", { keyPath: "id" }); };
    r.onsuccess = () => { const d = r.result; d.onversionchange = () => { d.close(); dbp = null; }; ok(d); };
    r.onerror = () => { dbp = null; no(r.error); };
  });
}
const pending = new Map(); // logged, not yet known to be in IndexedDB
function store(recs, fresh = true) {
  db().then((d) => {
    const t = d.transaction(["q", "sent"], "readwrite"), q = t.objectStore("q"), s = t.objectStore("sent");
    for (const r of recs) {
      if (fresh) q.put(r);
      else { const g = s.getKey(r.id); g.onsuccess = () => { if (g.result === undefined) q.put(r); }; } // a tail: skip what was sent
    }
    t.oncomplete = () => recs.forEach((r) => pending.delete(r.id));
  }).catch(() => {});
}
function log(k, f = {}) {
  if (!cfg) return null;
  const r = { id: newId(), t: new Date().toISOString(), k, pv, p: location.pathname };
  for (const [key, v] of Object.entries(f)) if (!(key in r)) r[key] = v; // never over the record's own fields
  pending.set(r.id, r);
  store([r]);
  soon();
  return r.id;
}
function writeTail() { // what IndexedDB may not have committed when the page goes away
  try { if (pending.size) localStorage.setItem(TAIL + pv, JSON.stringify([...pending.values()])); } catch { /* full or blocked */ }
}
function takeTails() {
  try {
    for (const k of Object.keys(localStorage)) {
      if (!k.startsWith(TAIL) || k === TAIL + pv) continue;
      const recs = read(k);
      localStorage.removeItem(k);
      if (Array.isArray(recs) && recs.length) store(recs, false);
    }
  } catch { /* blocked */ }
}
function prune() {
  try {
    if (Date.now() - (+localStorage.getItem("usage.pruned") || 0) < 864e5) return;
    localStorage.setItem("usage.pruned", String(Date.now()));
  } catch { return; }
  const cutoff = new Date(Date.now() - KEEP_DAYS * 864e5).toISOString();
  db().then((d) => {
    d.transaction("sent", "readwrite").objectStore("sent").openCursor().onsuccess = (e) => {
      const c = e.target.result;
      if (c && c.value.t < cutoff) { c.delete(); c.continue(); }
    };
  }).catch(() => {});
}

// ---- sending: batches of whole records to the Google Form; a record is deleted from the queue only after its post
let flushing = false, timer = 0;
function soon(ms = WAIT) { if (!timer) timer = setTimeout(() => { timer = 0; flush(); }, ms); }
const sink = () => cfg.u ?? `https://docs.google.com/forms/d/e/${cfg.f}/formResponse`;
async function flush() {
  if (flushing || !cfg) return;
  if (!read(CFG)) return stop(); // turned off in another tab
  flushing = true;
  const run = async () => {
    const d = await db();
    for (let round = 0; round < 25 && cfg; round++) {
      const recs = await req(d.transaction("q").objectStore("q").getAll(null, 500));
      if (!recs.length) return;
      const batch = [];
      let size = 0;
      for (const r of recs) {
        const n = encodeURIComponent(JSON.stringify(r)).length + 3;
        if (batch.length && size + n > BATCH) break;
        batch.push(r); size += n;
      }
      const body = new URLSearchParams({ [`entry.${cfg.e}`]: JSON.stringify({ v: RV, dev: cfg.dev, o: location.host, r: batch }) });
      await send(sink(), { method: "POST", mode: "no-cors", credentials: "omit", keepalive: true, body });
      const t = d.transaction(["q", "sent"], "readwrite"), q = t.objectStore("q"), s = t.objectStore("sent"), at = new Date().toISOString();
      for (const r of batch) { q.delete(r.id); s.put({ ...r, sent: at }); }
      await done(t);
      try { localStorage.setItem("usage.sent", String(Date.now())); } catch { /* blocked */ }
      if (batch.length === recs.length && recs.length < 500) return;
    }
  };
  try {
    if (navigator.locks) await navigator.locks.request("usage-recorder-flush", { ifAvailable: true }, (lock) => lock && run());
    else await run();
  } catch { /* offline or refused: the records stay queued */ } finally { flushing = false; }
}

// ---- recording
const recent = []; // the last controls used, for notes
let clicks = 0, burst = [], labelAt = -1e9, lastHref = location.href, errors = 0, fetches = 0, selfErrors = 0;
let visFrom = document.hidden ? 0 : performance.now(), visMs = 0, engMs = 0, lastTouch = performance.now();
const keys = {}, depth = new Map(), scrolled = new Set(), lastVal = new WeakMap(), typing = new WeakMap();
let scrollTimer = 0, started = false, wrapped = null;

function safe(fn) {
  return function (...a) {
    try { return fn.apply(this, a); } catch (err) {
      if (cfg && selfErrors++ < 5) try { log("self", { msg: clip(err?.message ?? err, 200), at: clip(err?.stack?.split("\n")[1] ?? "", 200) }); } catch { /* give up */ }
    }
  };
}
function touch() { const t = performance.now(), gap = t - lastTouch; if (gap < 60e3) engMs += gap; lastTouch = t; }
function checkNav(by) {
  if (!cfg || location.href === lastHref) return;
  lastHref = location.href;
  if (!location.hash.startsWith("#usage")) log("nav", { ...where(true), by });
}
function watch(id) { // a click after which nothing on the page changed for a second
  const href = location.href;
  let changed = false;
  const ours = (m) => own(m.target) || (m.type === "childList" && [...m.addedNodes, ...m.removedNodes].every((n) => n.localName === "usage-recorder"));
  const mo = new MutationObserver((ms) => {
    if (ms.some((m) => !ours(m) && (m.type !== "attributes" || m.oldValue !== m.target.getAttribute(m.attributeName)))) { changed = true; mo.disconnect(); }
  });
  mo.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeOldValue: true });
  setTimeout(safe(() => {
    mo.disconnect();
    if (!changed && location.href === href && !document.hidden && !String(getSelection() ?? "")) log("dead", { ref: id });
  }), 1000);
}
const onClick = safe((e) => {
  if (!cfg || !(e.target instanceof Element) || own(e.target)) return;
  const [el, ctl] = controlOf(e.target);
  if (el.matches(FIELD) && e.timeStamp - labelAt < 100) return; // the click its label passed on: already counted
  if (el.localName === "label") labelAt = e.timeStamp;
  clicks++; touch();
  const d = describe(el);
  const id = log("act", { ...d, ctl: ctl ? 1 : 0, n: e.detail > 1 ? e.detail : undefined, pt: e.detail === 0 ? "key" : e.pointerType || undefined,
    x: Math.round(e.clientX), y: Math.round(e.clientY) });
  recent.push(d.text || d.id || d.tag); if (recent.length > 5) recent.shift();
  burst = burst.filter((b) => e.timeStamp - b.t < 1000 && Math.hypot(b.x - e.clientX, b.y - e.clientY) < 40);
  burst.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
  if (burst.length === 3 && !String(getSelection() ?? "")) log("rage", { ref: id });
  if (e.button === 0 && !el.matches(FIELD + ",label,option")) watch(id);
  setTimeout(safe(() => checkNav("click")), 400);
});
const onChange = safe((e, live) => {
  const el = e.target;
  if (!cfg || !(el instanceof Element) || own(el) || !el.matches(FIELD)) return;
  const v = fieldValue(el), key = JSON.stringify(v);
  if ("v" in v && lastVal.get(el) === key) return;
  lastVal.set(el, key);
  log("input", { ...describe(el), ...v, live: live ? 1 : undefined });
  setTimeout(safe(() => checkNav("input")), 300);
});
const onInput = safe((e) => { // searches are also caught as typed, once typing pauses
  const el = e.target;
  if (!cfg || STRICT || !(el instanceof Element) || own(el) || !el.matches("input,textarea") || !searchy(el)) return;
  clearTimeout(typing.get(el));
  typing.set(el, setTimeout(() => onChange({ target: el }, true), 1500));
});
const onKey = safe((e) => {
  if (!cfg || own(e.target)) return;
  touch();
  const k = e.key ?? "";
  const c = e.ctrlKey || e.metaKey || e.altKey ? "mod" : k === "Enter" ? "enter" : k === "Escape" ? "esc"
    : k.startsWith("Arrow") ? "arrow" : k === "Tab" ? "tab" : k.length === 1 ? "char" : "other";
  keys[c] = (keys[c] ?? 0) + 1;
  if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === "KeyN") { e.preventDefault(); openNote(); }
});
const onCopy = safe((e) => {
  if (!cfg || own(e.target)) return;
  const el = e.target instanceof Element ? e.target : document.activeElement;
  let text = "", n = 0;
  if (el?.matches?.("input,textarea")) {
    const s = String(el.value ?? "").slice(el.selectionStart ?? 0, el.selectionEnd ?? 0);
    n = s.length; if ("v" in fieldValue(el)) text = s;
  } else { text = String(getSelection() ?? ""); n = text.length; }
  log("copy", { n, text: STRICT ? undefined : clip(text, 300) || undefined, at: describe(el ?? document.body) });
});
function measureScroll() {
  scrollTimer = 0;
  for (const t of scrolled) {
    const el = t === document || t === window ? document.scrollingElement : t;
    if (!(el instanceof Element) || el.scrollHeight <= el.clientHeight + 8) continue;
    const pct = Math.min(100, Math.round(100 * (el.scrollTop + el.clientHeight) / el.scrollHeight));
    const key = el === document.scrollingElement ? "page"
      : el.id ? "#" + el.id : el.localName + (typeof el.className === "string" && el.className.trim() ? "." + squash(el.className).split(" ")[0] : "");
    if (pct > (depth.get(key) ?? 0)) depth.set(key, pct);
  }
  scrolled.clear();
}
const onScroll = safe((e) => { if (!cfg) return; touch(); scrolled.add(e.target); if (!scrollTimer) scrollTimer = setTimeout(safe(measureScroll), 500); });
function summary(why) {
  const t = performance.now();
  if (visFrom) { visMs += t - visFrom; visFrom = 0; }
  measureScroll();
  log("hide", { why, vis: Math.round(visMs), eng: Math.round(engMs), clicks, keys: { ...keys }, scroll: Object.fromEntries(depth) });
  visMs = engMs = clicks = 0;
  for (const k in keys) delete keys[k];
}
const onVisibility = safe(() => {
  if (!cfg) return;
  if (document.hidden) { if (visFrom) summary("hidden"); writeTail(); flush(); return; }
  visFrom = lastTouch = performance.now();
  log("show");
  try { localStorage.removeItem(TAIL + pv); } catch { /* blocked */ }
});
const onError = safe((e) => {
  if (!cfg || errors >= 20) return;
  if (e instanceof ErrorEvent) {
    errors++;
    log("error", { msg: STRICT ? undefined : clip(e.message, 300), src: addr(e.filename || ""), line: e.lineno, col: e.colno });
  } else if (e.target instanceof Element && !own(e.target)) {
    errors++;
    const el = e.target;
    log("error", { res: el.localName, u: addr(el.currentSrc || el.src || el.href || "") });
  }
});
const onRejection = safe((e) => {
  if (!cfg || errors >= 20) return;
  errors++;
  log("error", { rej: 1, msg: STRICT ? undefined : clip(e.reason?.message ?? String(e.reason), 300) });
});
function watchFetch() { // failed requests the page makes; the page's own calls are passed through untouched
  if (typeof nativeFetch !== "function") return;
  const urlOf = (i) => typeof i === "string" ? i : i instanceof URL ? i.href : i?.url ?? "";
  const method = (i, o) => String(o?.method ?? i?.method ?? "GET").toUpperCase();
  wrapped = function (input, init) {
    const p = nativeFetch.apply(this ?? window, arguments);
    if (cfg && fetches < 20) {
      p.then(safe((r) => { if (!r.ok && r.type !== "opaque" && fetches++ < 20) log("fetch", { u: addr(r.url || urlOf(input)), status: r.status, m: method(input, init) }); }),
        safe((err) => { if (err?.name !== "AbortError" && fetches++ < 20) log("fetch", { u: addr(urlOf(input)), status: 0, err: clip(err?.message ?? err, 120), m: method(input, init) }); }));
    }
    return p;
  };
  window.fetch = wrapped;
}
function tabId() {
  try { let t = sessionStorage.getItem("usage.tab"); if (!t) sessionStorage.setItem("usage.tab", t = rnd(6)); return t; } catch { return ""; }
}
function lastModified() { const d = new Date(document.lastModified); return isNaN(d) ? "" : d.toISOString(); }

function start() {
  if (started) return;
  started = true;
  window.usageRecorder = { log: (name, data) => log("ev", { name: clip(name, 40), data: cut(JSON.stringify(data ?? null), 2000) }) };
  const nav = performance.getEntriesByType?.("navigation")?.[0];
  log("visit", { ...where(true), ref: document.referrer ? addr(document.referrer) : "", nt: nav?.type ?? "", vis: document.visibilityState,
    title: STRICT ? undefined : clip(document.title, 80), vw: innerWidth, vh: innerHeight, dpr: devicePixelRatio,
    touch: matchMedia("(pointer: coarse)").matches, br: browser(), lm: lastModified(), rv: RV, tab: tabId() });
  const loaded = safe(() => setTimeout(safe(() => {
    const n = performance.getEntriesByType?.("navigation")?.[0];
    log("load", { dom: Math.round(n?.domContentLoadedEventEnd ?? 0), load: Math.round(n?.loadEventEnd || performance.now()) });
  }), 0));
  if (document.readyState === "complete") loaded(); else addEventListener("load", loaded, { once: true });
  addEventListener("click", onClick, true);
  addEventListener("change", onChange, true);
  addEventListener("input", onInput, true);
  addEventListener("keydown", onKey, true);
  addEventListener("copy", onCopy, true);
  addEventListener("scroll", onScroll, { capture: true, passive: true });
  addEventListener("error", onError, true);
  addEventListener("unhandledrejection", onRejection);
  addEventListener("popstate", safe(() => checkNav("back")));
  document.addEventListener("visibilitychange", onVisibility);
  addEventListener("pagehide", safe(() => { if (!cfg) return; if (visFrom) summary("pagehide"); writeTail(); }));
  addEventListener("pageshow", safe((e) => {
    if (!cfg || !e.persisted) return;
    visFrom = lastTouch = performance.now();
    log("show", { bf: 1 });
    try { localStorage.removeItem(TAIL + pv); } catch { /* blocked */ }
  }));
  addEventListener("storage", safe((e) => { if (cfg && (e.key === CFG || e.key === null) && !read(CFG)) stop(); }));
  watchFetch();
  pen();
  takeTails();
  prune();
}
function stop() { // turned off: forget everything this browser keeps for this domain
  cfg = null;
  try { for (const k of Object.keys(localStorage)) if (k.startsWith("usage.")) localStorage.removeItem(k); } catch { /* blocked */ }
  dbp?.then((d) => d.close()).catch(() => {});
  dbp = null;
  try { indexedDB.deleteDatabase("usage-recorder"); } catch { /* blocked */ }
  shadow?.querySelector(".pen")?.remove();
  delete window.usageRecorder;
  if (wrapped && window.fetch === wrapped) window.fetch = nativeFetch;
}

// ---- the pencil button, notes and the #usage cards, in a shadow root the pages' styles cannot reach
let shadow = null;
const STYLE = `
:host{all:initial}
*{box-sizing:border-box;font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,Ubuntu,sans-serif}
.pen{position:fixed;left:8px;bottom:8px;z-index:2147483647;width:30px;height:30px;padding:0;border-radius:50%;display:grid;place-items:center;
  border:1px solid rgba(128,128,128,.55);background:rgba(250,250,250,.88);color:#333;opacity:.45;cursor:pointer}
.pen:hover,.pen:focus-visible{opacity:1}
@media (pointer:coarse){.pen{width:40px;height:40px}}
.card{position:fixed;z-index:2147483647;left:50%;top:50%;transform:translate(-50%,-50%);width:min(92vw,440px);max-height:86vh;overflow:auto;
  background:#fff;color:#1b1b1b;border:1px solid #c9c9c9;border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.28);padding:16px 18px}
h2{font-size:15px;font-weight:600;margin:0 0 8px}
p{margin:6px 0}
.muted{color:#5f5f5f;font-size:13px}
textarea{width:100%;min-height:110px;resize:vertical;padding:8px;border:1px solid #b5b5b5;border-radius:6px;color:inherit;background:#fff}
.row{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;justify-content:flex-end}
button.b{min-height:34px;padding:6px 14px;border:1px solid #9a9a9a;border-radius:6px;background:#f4f4f4;color:#1b1b1b;cursor:pointer}
button.b.main{background:#1f5fbf;border-color:#1f5fbf;color:#fff}
.toast{position:fixed;z-index:2147483647;left:46px;bottom:calc(var(--lift,8px) + 4px);padding:4px 10px;border-radius:6px;background:#1b1b1b;color:#fff;font-size:13px}
@media (prefers-color-scheme:dark){
  .card{background:#1d1f22;color:#e8e8e8;border-color:#444}.muted{color:#a8a8a8}
  textarea{background:#15171a;border-color:#555}button.b{background:#2a2d31;color:#e8e8e8;border-color:#555}
  .pen{background:rgba(40,40,40,.88);color:#ddd}
}`;
function ui() {
  if (shadow) return shadow;
  const host = document.createElement("usage-recorder");
  host.style.cssText = "all:initial";
  shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = STYLE;
  shadow.append(style);
  document.documentElement.append(host);
  return shadow;
}
const para = (text, cls) => { const p = document.createElement("p"); p.textContent = text; if (cls) p.className = cls; return p; };
function card(title, lines, buttons) { // resolves with the value of the button pressed (null: closed)
  const s = ui();
  s.querySelector(".card")?.remove();
  const c = document.createElement("div");
  c.className = "card"; c.setAttribute("role", "dialog"); c.setAttribute("aria-label", title);
  const h = document.createElement("h2"); h.textContent = title; c.append(h);
  for (const l of lines) c.append(l instanceof Node ? l : para(l));
  const row = document.createElement("div"); row.className = "row"; c.append(row);
  s.append(c);
  return new Promise((resolve) => {
    const close = (v) => { c.remove(); resolve(v); };
    for (const [label, value, main] of buttons) {
      const b = document.createElement("button");
      b.className = main ? "b main" : "b"; b.textContent = label; b.dataset.v = value ?? "";
      b.onclick = () => close(value);
      row.append(b);
    }
    c.addEventListener("keydown", (e) => { if (e.key === "Escape") close(null); });
    row.querySelector(".main")?.focus();
  });
}
function toast(text) {
  const t = document.createElement("div"); t.className = "toast"; t.textContent = text;
  ui().append(t); setTimeout(() => t.remove(), 1800);
}
function pen() {
  const s = ui();
  if (s.querySelector(".pen")) return;
  const b = document.createElement("button");
  b.className = "pen"; b.title = "Note for the revamp (Alt+Shift+N)"; b.setAttribute("aria-label", "Note for the revamp");
  b.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
  b.onclick = () => openNote();
  s.append(b);
  const place = safe(() => { // above a bar fixed to the foot of the page, if there is one
    let lift = 8;
    const under = new Set([4, 14, 26, 40].flatMap((dy) => document.elementsFromPoint(24, innerHeight - dy)));
    for (const e of under) {
      if (e === document.documentElement || e === document.body || own(e)) continue;
      for (let n = e; n && n !== document.body; n = n.parentElement) {
        const pos = getComputedStyle(n).position;
        if (pos !== "fixed" && pos !== "sticky") continue;
        const r = n.getBoundingClientRect();
        if (r.top > innerHeight * 0.6) lift = Math.max(lift, Math.ceil(innerHeight - r.top) + 8);
        break;
      }
    }
    if (b.style.bottom === lift + "px") return;
    b.style.bottom = lift + "px";
    s.host.style.setProperty("--lift", lift + "px");
  });
  for (const ms of [1500, 5000, 12000]) setTimeout(place, ms); // pages that draw themselves late
  addEventListener("resize", place);
}
async function openNote() {
  if (!cfg || shadow?.querySelector(".card")) return;
  const ta = document.createElement("textarea");
  ta.placeholder = "What did you want here, or what should this page do?";
  ta.maxLength = 4000;
  ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) shadow.querySelector(".card button.main")?.click(); });
  const ctx = para(`On ${location.pathname}${recent.length ? " · after: " + recent.slice(-3).join(", ") : ""}`, "muted");
  setTimeout(() => ta.focus(), 0);
  const v = await card("Note for the revamp", [ctx, ta], [["Cancel", null], ["Save note", "save", true]]);
  if (v === "save" && ta.value.trim() && cfg) {
    log("note", { ...where(true), text: cut(ta.value.trim(), 4000), recent: [...recent] });
    soon(10e3);
    toast("Note saved");
  }
}
const when = (x) => new Date(x).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
const lastSent = () => { try { return +(localStorage.getItem("usage.sent") || 0); } catch { return 0; } };
async function counts() {
  try {
    const d = await db();
    return await Promise.all([req(d.transaction("q").objectStore("q").count()), req(d.transaction("sent").objectStore("sent").count())]);
  } catch { return ["?", "?"]; }
}
async function download() {
  const d = await db();
  const [q, s] = await Promise.all([req(d.transaction("q").objectStore("q").getAll()), req(d.transaction("sent").objectStore("sent").getAll())]);
  const blob = new Blob([JSON.stringify({ v: RV, dev: cfg.dev, o: location.host, exported: new Date().toISOString(), r: [...s, ...q] })], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `usage-${location.hostname}-${cfg.dev}-${new Date().toISOString().slice(0, 10)}.json`;
  ui().append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10e3);
}
async function status() {
  if (!cfg) return card("Usage recorder", [`This browser is not recording on ${location.host}.`], [["Close", null, true]]);
  const [q, s] = await counts();
  const last = lastSent();
  const v = await card("Usage recorder", [
    `This browser records on ${location.host} as “${cfg.dev}”, since ${when(cfg.since)}.`,
    `Waiting to be sent: ${q}. Last sent: ${last ? when(last) : "not yet"}.`,
    `Kept here for ${KEEP_DAYS} days after sending: ${s} records.`,
    para(`Records go to ${cfg.u ?? "the Google Form ending …" + cfg.f.slice(-6)}.`, "muted"),
  ], [["Send now", "send"], ["Download", "dl"], ["Turn off", "off"], ["Close", null, true]]);
  if (v === "send") { await flush(); return status(); }
  if (v === "dl") { await download(); return status(); }
  if (v === "off") return turnOff();
}
const OTHER = { "3pp-noah.github.io": "https://nth-member.github.io/", "nth-member.github.io": "https://3pp-noah.github.io/",
  "127.0.0.1:8701": "http://127.0.0.1:8702/", "127.0.0.1:8702": "http://127.0.0.1:8701/" }[location.host]; // the other domain (test stand-ins too)
async function enrol(n, h) {
  if (cfg && cfg.dev === n.dev && cfg.e === n.e && (cfg.f ?? cfg.u) === (n.f ?? n.u)) return status();
  const v = await card("Usage recorder", [
    cfg ? `This browser already records here as “${cfg.dev}”. Replace that with the following?` : `Record your use of the pages on ${location.host} in this browser?`,
    `Device name: “${n.dev}”. Records go to ${n.u ?? "the Google Form ending …" + n.f.slice(-6)}.`,
    para("Recorded: pages opened, controls used, the values of choices, numbers and searches (other typed text only as a length; "
      + "nothing typed or shown on the gematria page), time on the page, scrolling, copying, errors, failed requests, and your notes. "
      + "Nobody else's use is recorded.", "muted"),
  ], [["Cancel", null], ["Record", "yes", true]]);
  if (v !== "yes") return;
  const next = { ...n, since: new Date().toISOString() };
  try { localStorage.setItem(CFG, JSON.stringify(next)); } catch {
    return card("Usage recorder", ["This browser does not let the page keep settings, so it cannot record."], [["Close", null, true]]);
  }
  cfg = next;
  navigator.storage?.persist?.().catch(() => {});
  start();
  const before = lastSent();
  log("enrol", { dev: cfg.dev, rv: RV });
  await flush();
  const went = lastSent() > before;
  const other = OTHER && new URL(OTHER).host;
  const more = await card("Usage recorder", [
    `Recording here as “${cfg.dev}”. ` + (went ? "A first record has been sent; it should be in the Sheet within a minute."
      : "Its first record could not be sent yet: it waits here and goes when the page next reaches Google."),
    para(other ? `${other} is enrolled on its own, with the same settings.` : "Each domain is enrolled on its own.", "muted"),
  ], other ? [["Close", null], [`Enrol ${other} too`, "other", true]] : [["Close", null, true]]);
  if (more === "other") location.href = OTHER + h;
}
async function turnOff() {
  const v = await card("Usage recorder", [`Stop recording in this browser on ${location.host}, and delete the records it keeps here?`,
    para("What has been sent stays in the Sheet.", "muted")], [["Cancel", null], ["Stop", "yes", true]]);
  if (v !== "yes") return;
  if (cfg) { log("off"); await flush(); }
  stop();
  await card("Usage recorder", [`Stopped. This browser records nothing on ${location.host}.`], [["Close", null, true]]);
}
function obey(h) {
  let m;
  if ((m = /^#usage=on\.([\w-]{20,200})\.(\d{3,15})\.([a-z0-9-]{1,24})$/i.exec(h))) return enrol({ f: m[1], e: m[2], dev: m[3].toLowerCase() }, h);
  if (LOCAL && (m = /^#usage=test\.([^.]+)\.(\d{1,15})\.([a-z0-9-]{1,24})$/i.exec(h))) return enrol({ u: decode(m[1]), e: m[2], dev: m[3].toLowerCase() }, h);
  if (h === "#usage=off") return turnOff();
  return status();
}

const clean = () => { try { history.replaceState(history.state, "", location.pathname + location.search); } catch { /* sandboxed */ } };
addEventListener("hashchange", safe(() => {
  if (!isCommand(location.hash)) return checkNav("hash");
  const h = location.hash;
  clean(); lastHref = location.href;
  obey(h);
}));
if (command) clean();
lastHref = location.href;
if (cfg) start();
if (command) obey(command);
})();
