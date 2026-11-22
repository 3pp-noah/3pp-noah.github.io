/* The four clocks at the corners of the 3PP-NOAH page.

   TNLDY is read from Nsukka on the Yg clock (nsukka-yg-clock.js). TNL.YG and TNL.YJ are TNLDY counted in Yg and in yJ,
   the engine's *tnl-yg* and *tnl-yj* (sfo10: (Z - 0)·48.3/17640 and (Z - 0)/360). The others are 100-day clocks, each
   reading (TNLDY - Ztp) / 100: five of the MDQNM engine's and three of the author's.

     EXE_TPDP.100D                         Ztp 17651.8  = 14160 + 100·34.918, REVOTT's EXE_TPDP slice (crf0 "on EXE_TPDP.100D")
     END_IE_PURPOSE.100D, aka GOG_ID.100D  Ztp 22440    = 14160 + 100·82.80 (crf0 "on GOGID.100D", "on END_IE_PURPOSE_BIRTH.100D")
     AGAIN_BORN_CIRCUMSPECTION.100D        Ztp 22692    = 14160 + 100·85.32 (sfo08 *again-born-ie-born-of-the-spirit-is-the-
                                                          end-ie-purpose-of-all-things-circumspection100d*)
     DNPS.100D                             Ztp 33 Yg    = 33·17640/48.3 (sfo16 "on DNPS12052.100D")
     EXE_CDOWN.100D                        Ztp 25931.8  the author's countdown (2026-11-19)
     ARM_CDOWN.100D                        Ztp 26414.8  the author's countdown (2026-11-19)
     WHIZZ-KIDS-BEAST.100D                 Ztp 16610    the author's (2026-11-22)

   Every corner is a button that steps through its clocks in turn: top left TNLDY, TNL.YG and TNL.YJ; top right
   EXE_TPDP.100D and EXE_CDOWN.100D; bottom left END_IE_PURPOSE.100D and AGAIN_BORN_CIRCUMSPECTION.100D; bottom right
   DNPS.100D, ARM_CDOWN.100D and WHIZZ-KIDS-BEAST.100D.

   Readings are exact: Z is an integer numerator over 23·86 400 000 (zOf().num), so each reading is a ratio of
   BigInts, shown floored, as a clock shows the tick it has reached: TNLDY to 6 places and a 100-day clock to 8, both
   a step of 86.4 ms, and TNL.YG and TNL.YJ to 9, a step of about 31 ms. Loads as a plain script after
   nsukka-yg-clock.js (window.HubClocks), or through require(). */
(function (root, Yg) {
  "use strict";
  const DEN = BigInt(Yg.YG_DEN * Yg.DAY_MS);                       // Z = num / DEN exactly

  /* n/d (BigInts, d > 0) floored to `places` decimals, as text. */
  function fixed(n, d, places) {
    const s = n * 10n ** BigInt(places);
    let q = s / d;
    if (s % d !== 0n && s < 0n) q -= 1n;
    const neg = q < 0n, t = (neg ? -q : q).toString().padStart(places + 1, "0");
    return (neg ? "-" : "") + t.slice(0, t.length - places) + "." + t.slice(t.length - places);
  }

  const CLOCKS = {
    tnldy: { name: "TNLDY", ztp: [0n, 1n], unit: [1n, 1n], places: 6 },
    tnlyg: { name: "TNL.YG", ztp: [0n, 1n], unit: [BigInt(Yg.YG_NUM), BigInt(Yg.YG_DEN)], places: 9,
             detail: "Ztp 0 · Yg = 17640/48.3 d", formula: "TNLDY / Yg, with Yg = 17640/48.3 = 8400/23 days" },
    tnlyj: { name: "TNL.YJ", ztp: [0n, 1n], unit: [360n, 1n], places: 9,
             detail: "Ztp 0 · yJ = 360 d", formula: "TNLDY / yJ, with yJ = 360 days" },
    exe: { name: "EXE_TPDP.100D", ztp: Yg.frac("17651.8"), ztpText: "17651.8" },
    end: { name: "END_IE_PURPOSE.100D", aka: "GOG_ID.100D", ztp: Yg.frac("22440"), ztpText: "22440" },
    circ: { name: "AGAIN_BORN_CIRCUMSPECTION.100D", ztp: Yg.frac("22692"), ztpText: "22692" },
    dnps: { name: "DNPS.100D", ztp: [33n * BigInt(Yg.YG_NUM), BigInt(Yg.YG_DEN)], ztpText: "33·17640/48.3" },
    execd: { name: "EXE_CDOWN.100D", ztp: Yg.frac("25931.8"), ztpText: "25931.8" },
    armcd: { name: "ARM_CDOWN.100D", ztp: Yg.frac("26414.8"), ztpText: "26414.8" },
    wkb: { name: "WHIZZ-KIDS-BEAST.100D", ztp: Yg.frac("16610"), ztpText: "16610" },
  };
  for (const c of Object.values(CLOCKS)) {
    if (c.unit === undefined) c.unit = [100n, 1n];       // days per unit, as a fraction
    if (c.places === undefined) c.places = 8;
  }

  /* A clock's reading at the TNLDY numerator `num` (zOf(ms).num). */
  const read = (c, num) => fixed((BigInt(num) * c.ztp[1] - c.ztp[0] * DEN) * c.unit[1], c.ztp[1] * DEN * c.unit[0], c.places);
  /* Every instant (epoch ms) at which a clock reads 0. */
  const zeros = c => Yg.instantsOfFrac(c.ztp[0], c.ztp[1]);

  /* The corners that switch, each through its clocks in turn; every visit starts on the first. */
  const SWITCH = { tl: [CLOCKS.tnldy, CLOCKS.tnlyg, CLOCKS.tnlyj], tr: [CLOCKS.exe, CLOCKS.execd],
                   bl: [CLOCKS.end, CLOCKS.circ], br: [CLOCKS.dnps, CLOCKS.armcd, CLOCKS.wkb] };

  const api = { CLOCKS, SWITCH, fixed, read, zeros };
  root.HubClocks = api;
  if (typeof module === "object" && module && module.exports) module.exports = api;
  if (typeof document === "undefined") return;

  // ---- the page: the buttons #clock-tl, #clock-tr, #clock-bl and #clock-br, each with .name, .value and .detail
  const $ = id => document.getElementById(id);
  const box = { tl: $("clock-tl"), tr: $("clock-tr"), bl: $("clock-bl"), br: $("clock-br") };
  if (!box.tl || !box.tr || !box.bl || !box.br) return;
  const all = [box.tl, box.tr, box.bl, box.br];
  const part = (el, cls) => el.querySelector("." + cls);
  const shown = { tl: 0, tr: 0, bl: 0, br: 0 }, cur = k => SWITCH[k][shown[k]], next = k => (shown[k] + 1) % SWITCH[k].length;

  function describe(el, c) {
    const name = part(el, "name");
    name.textContent = "";
    let from = 0;                                  // where a name is too wide, it breaks after its last "_" or before ".100D"
    for (const at of [c.name.lastIndexOf("_") + 1, c.name.lastIndexOf(".")].filter(i => i > 0).sort((a, b) => a - b)) {
      if (at > from) { name.append(c.name.slice(from, at), document.createElement("wbr")); from = at; }
    }
    name.append(c.name.slice(from));
    if (c === CLOCKS.tnldy) {                      // its detail line is the Nsukka time, which render() writes
      const r = Yg.nextRecalibration(Date.now());
      el.title = "TNLDY, read from Nsukka on the Yg clock (Yg = 17640/48.3 days); next recalibration " +
        Yg.nsukka(r.at).slice(0, 16) + " Nsukka, " + r.stepText;
      return;
    }
    if (c.formula) { part(el, "detail").textContent = c.detail; el.title = `${c.name} = ${c.formula}`; return; }
    const zero = zeros(c).map(ms => Yg.nsukka(ms)).join(" and ");
    let ztp = c.ztpText;
    if (c === CLOCKS.dnps) ztp = "33 Yg = " + fixed(c.ztp[0], c.ztp[1], 6) + "…";
    part(el, "detail").textContent = (c.aka ? "aka " + c.aka + " · " : "") + "Ztp " + ztp;
    el.title = `${c.name}${c.aka ? " (" + c.aka + ")" : ""} = (TNLDY − ${c.ztpText}) / 100; it reads 0 at ${zero} Nsukka`;
  }
  function show(k) {
    const el = box[k];
    describe(el, cur(k));
    const swap = document.createElement("span");
    swap.className = "swap"; swap.setAttribute("aria-hidden", "true"); swap.textContent = "⇄";
    part(el, "name").append(swap);
    el.title += `. Press to show ${SWITCH[k][next(k)].name}.`;
    if (SWITCH[k].length === 2) el.setAttribute("aria-pressed", String(shown[k] === 1));  // a toggle; three is a cycle
  }

  const value = Object.fromEntries(Object.entries(box).map(([k, el]) => [k, part(el, "value")]));
  const nsukka = part(box.tl, "detail");
  let recal = 0;
  function render() {
    const now = Date.now(), num = Yg.zOf(now).num;                // one instant for all four
    for (const k of Object.keys(SWITCH)) value[k].textContent = read(cur(k), num);
    if (cur("tl") === CLOCKS.tnldy) nsukka.textContent = "Nsukka " + Yg.nsukka(now).slice(0, 19);
    if (now >= recal) { recal = Yg.nextRecalibration(now).at; show("tl"); }  // TNLDY's tooltip names the next one
  }
  const tick = () => { if (!document.hidden) render(); };

  /* At the corners of the window while the page's column leaves room beside them. Otherwise (.stacked) the page
     keeps their height free above and below its column; and if the page is then taller than the window
     (.scrolls), they stand at the corners of the page itself, so that none of them covers the column. */
  const column = ["h1", ".dial", ".panel"].map(s => document.querySelector(s)), GAP = 12;
  let pending = 0;
  function place() {
    pending = 0;
    const b = document.body, d = document.documentElement;
    b.classList.remove("stacked", "scrolls");
    b.style.paddingTop = b.style.paddingBottom = "";
    const cols = column.map(e => e.getBoundingClientRect());
    const left = Math.min(...cols.map(r => r.left)), right = Math.max(...cols.map(r => r.right));
    const [tl, tr, bl, br] = all.map(e => e.getBoundingClientRect());
    if (Math.max(tl.right, bl.right) + GAP <= left && Math.min(tr.left, br.left) - GAP >= right) return;
    b.classList.add("stacked");
    const top = parseFloat(getComputedStyle(box.tl).top), bottom = parseFloat(getComputedStyle(box.bl).bottom);
    const keep = () => {
      b.style.paddingTop = Math.ceil(top + Math.max(box.tl.offsetHeight, box.tr.offsetHeight) + GAP) + "px";
      b.style.paddingBottom = Math.ceil(bottom + Math.max(box.bl.offsetHeight, box.br.offsetHeight) + GAP) + "px";
    };
    keep();
    if (d.scrollHeight > d.clientHeight) { b.classList.add("scrolls"); keep(); }  // a scrollbar may narrow them
  }
  const soon = () => { if (!pending) pending = requestAnimationFrame(place); };

  for (const k of Object.keys(SWITCH)) {
    box[k].addEventListener("click", () => { shown[k] = next(k); show(k); render(); });
    show(k);
  }
  render();
  all.forEach(el => { el.hidden = false; });
  place();
  setInterval(tick, 100);
  document.addEventListener("visibilitychange", tick);
  addEventListener("resize", soon);
  if (root.ResizeObserver) { const ro = new ResizeObserver(soon); [...all, ...column].forEach(el => ro.observe(el)); }
})(typeof globalThis !== "undefined" ? globalThis : this,
   typeof NsukkaYg !== "undefined" ? NsukkaYg : require("./nsukka-yg-clock.js"));
