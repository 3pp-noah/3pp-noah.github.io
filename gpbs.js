/* The GPBS power cycle, live: the ✦ button beside the title opens it.

   The author's drawing of 14 February 2025 (sent 26 August 2025, with corrections the same day) redrawn as a heat-engine
   cycle: four states at the corners (GPBN, GPBE, GPBM, TSoTS), four devices on the sides (BotS pump, TSBS boiler,
   ATDF turbine, MFR condenser), every marking as the author wrote it: TNLDY over EXE_TPDP.100D (red) and, where the
   drawing gives one, GOG_ID.100D (blue). TNLDY that the drawing does not write is computed from EXE_TPDP.100D and shown
   in grey italic. The present state moves round the cycle: its readings are clocks.js's own, exact and floored, and
   it is placed between the two markings it lies between, by TNLDY. Needs nsukka-yg-clock.js and clocks.js first. */
(function () {
  "use strict";
  const Yg = window.NsukkaYg, HC = window.HubClocks;
  const dlg = document.getElementById("gpbs"), btn = document.getElementById("magic");
  if (!Yg || !HC || !dlg || !btn || typeof dlg.showModal !== "function") { if (btn) btn.hidden = true; return; }
  const NS = "http://www.w3.org/2000/svg", M = "\u2212";
  const EXE = HC.CLOCKS.exe, GOG = HC.CLOCKS.end;               // Ztp 17651.8 and 22440
  const W = 1400, H = 1030, L = 300, R = 1080, T = 330, B = 810, MX = (L + R) / 2, MY = (T + B) / 2;

  const el = (tag, attrs, parent, text) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.append(e);
    return e;
  };
  const m = s => s.replace(/-/g, M);                             // the minus sign, as the drawing writes it
  const w = s => [[s, false]], c = s => [[s, true]];             // TNLDY written on the drawing / computed here

  /* A marking: an optional event line, then TNLDY, EXE_TPDP.100D and (if given) GOG_ID.100D, one line each. */
  function label(parent, x, y, anchor, { ev, ink, exe, gog }) {
    const g = el("g", { class: "g-lbl" }, parent);
    if (ev) el("text", { class: "g-ev", x, y: y - 17, "text-anchor": anchor }, g, ev);
    const t = el("text", { x, y, "text-anchor": anchor }, g);
    for (const [s, computed] of ink) el("tspan", { class: computed ? "g-tn g-c" : "g-tn" }, t, s);
    el("text", { class: "g-exe", x, y: y + 16, "text-anchor": anchor }, g, m(exe));
    if (gog) el("text", { class: "g-gog", x, y: y + 32, "text-anchor": anchor }, g, m(gog));
    return g;
  }
  const tick = (p, x, y, across) => el("line", across ? { class: "g-tick", x1: x, y1: y - 7, x2: x, y2: y + 7 }
                                                       : { class: "g-tick", x1: x - 7, y1: y, x2: x + 7, y2: y }, p);

  /* Where the present state stands: [TNLDY, x, y, where, the marking's EXE_TPDP.100D], in the order of the cycle. */
  const A = [
    [15851.8, L, B, "GPBN", "-18.00"],
    [16151.8, L, 735, "BotS", "-15.00"], [16301.8, L, 662, "BotS", "-13.50"], [16355.8, L, 480, "BotS", "-12.96"],
    [16451.8, L, 405, "BotS", "-12.00"],
    [16531.8, L, T, "GPBE", "-11.20"], [16851.8, L, T, "GPBE", "-8.00"],
    [16985, 380, T, "TSBS", "-6.668"], [17651.8, 530, T, "TSBS", "0.00"], [18101.8, 865, T, "TSBS", "4.50"],
    [18292.8, 1012, T, "TSBS", "6.41"],
    [18938.8, R, T, "GPBM", "13.918"], [19164.8, R, T, "GPBM", "15.128"],
    [20093.8, R, 375, "ATDF", "24.418"], [20244.6, R, 440, "ATDF", "25.928"], [20423.8, R, 505, "ATDF", "27.718"],
    [20479.8, R, 725, "ATDF", "28.28"], [20783.6, R, 780, "ATDF", "31.318"],
    [21143.6, R, B, "TSoTS", "34.918"], [21633.6, R, B, "TSoTS", "39.818"],
    [21669.8, 1000, B, "MFR", "40.18"], [22331.8, 850, B, "MFR", "46.80"], [24399.8, 520, B, "MFR", "67.48"],
    [24851.8, 340, B, "MFR", "72.00"],
    [25931.8, L, B, "GPBN", "82.80"],
  ];

  let svg, trail, mark, markText;
  function build() {
    svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img",
      "aria-label": "The GPBS power cycle: BotS pump, TSBS boiler, ATDF turbine and MFR condenser around the states GPBN, GPBE, GPBM and TSoTS, with the present state marked on TNLDY, EXE_TPDP.100D and GOG_ID.100D." });
    const defs = el("defs", {}, svg);
    const mk = el("marker", { id: "g-arrow", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 8, markerHeight: 8,
                              orient: "auto-start-reverse" }, defs);
    el("path", { class: "g-head", d: "M0,0 L10,5 L0,10 Z" }, mk);

    const loop = `M${L},${B} V${T} H${R} V${B} Z`;                // clockwise, from GPBN
    el("path", { class: "g-pipe", d: loop }, svg);
    trail = el("polyline", { class: "g-trail", points: "" }, el("g", { role: "timer" }, svg));  // a clock's ticks, for usage.js
    el("path", { class: "g-flow", d: loop }, svg);                // the working fluid moving round
    for (const [x, y, rot] of [[L, 772, -90], [L, 370, -90], [455, T, 0], [940, T, 0], [R, 352, 90], [R, 800, 90],
                               [925, B, 180], [430, B, 180]])
      el("path", { class: "g-chev", d: "M-7,-6 L5,0 L-7,6", transform: `translate(${x},${y}) rotate(${rot})` }, svg);

    const marks = el("g", {}, svg);
    // left side: BotS, flowing up
    for (const [y, ink, exe] of [[735, w("16151.8"), "-15.00"], [662, w("16301.8 | 16319.8"), "-13.50 | -13.32"],
                                 [480, w("16355.8"), "-12.96"], [405, w("16451.8"), "-12.00"]]) {
      tick(marks, L, y, false); label(marks, L - 16, y - 2, "end", { ink, exe });
    }
    // top side: TSBS, flowing right
    for (const [x, ink, exe, ev] of [[380, w("16985 → 17460.2"), "-6.668 → -1.916"], [530, w("17651.8 → 17751.8"), "0.00 → 1.00"],
                                     [865, w("18101.8 → 18192.8"), "4.50 → 5.41"],
                                     [1012, w("18292.8 → 18461.8"), "6.41 | 6.65 → 8.10", "COVID-19 · 18292.8"]]) {
      tick(marks, x, T, true); label(marks, x, T - 30, "middle", { ink, exe, ev });
    }
    // right side: ATDF, flowing down
    for (const [y, ink, exe, gog, ev] of [[375, w("20093.8"), "24.118 | 24.418", null, "D. Trump"],
                                          [440, w("20244.6"), "25.928", "-21.954", "Tariff War"],
                                          [505, w("20423.8"), "27.41 | 27.718", "-20.162"],
                                          [725, w("20479.8 | 20531.8 → 20604.6"), "28.28 | 28.80 → 29.528", "-19.602 | -19.082 → -18.354"],
                                          [780, c("20783.6"), "31.318", "-16.564"]]) {
      tick(marks, R, y, false); label(marks, R + 16, y + 2, "start", { ink, exe, gog, ev });
    }
    // bottom side: MFR, flowing left
    for (const [x, ink, exe, gog] of [[1000, c("21669.8 → 21879.8"), "40.18 → 42.28", "-7.702 → -5.602"],
                                      [850, c("22331.8 → 22691.8"), "46.80 → 50.40", "-1.082 → 2.518"],
                                      [520, c("24399.8 | 24419.8 → 24651.8"), "67.48 | 67.68 → 70.00", "19.598 | 19.798 → 22.118"],
                                      [340, c("24851.8 → 25211.8"), "72.00 → 75.60", "24.118 → 27.718"]]) {
      tick(marks, x, B, true); label(marks, x, B + 30, "middle", { ink, exe, gog });
    }
    el("text", { class: "g-trib", x: L + 14, y: B - 12 }, marks, "PERIOD OF THE GREAT TRIBULATION");

    // the four states
    const corner = (x, y, name, n, dx, dy, anchor, lines) => {
      const g = el("g", { class: "g-lbl" }, marks);
      el("circle", { class: "g-state", cx: x, cy: y, r: 7.5 }, svg);
      const t = el("text", { x: x + dx, y: y + dy, "text-anchor": anchor }, g);
      el("tspan", { class: "g-name" }, t, name);
      el("tspan", { class: "g-sub", dx: 8 }, t, "state " + n);
      let yy = y + dy + 22;
      for (const ln of lines) {
        if (ln.ev) yy += 17;
        label(g, x + dx, yy, anchor, ln);
        yy += ln.gog ? 54 : 38;
      }
    };
    corner(L, B, "GPBN", 1, -36, 34, "end", [{ ink: w("15691.8 | 15743.8 → 15851.8"), exe: "-19.60 | -19.08 → -18.00" },
                                            { ink: w("25931.8"), exe: "82.80", gog: "34.918", ev: "the cycle closes" }]);
    corner(L, T, "GPBE", 2, -16, -116, "end", [{ ink: w("16531.8 … 16612.8 |"), exe: "-11.20 … -10.39 |" },
                                              { ink: w("16733.8 … 16851.8"), exe: "-9.18 … -8.00" }]);
    corner(R, T, "GPBM", 3, 16, -126, "start", [{ ink: w("18938.8 → 19164.8"), exe: "13.918 → 15.128" },
                                               { ink: w("19102"), exe: "14.502", ev: "V. Putin & Zelensky" }]);
    corner(R, B, "TSoTS", 4, 16, 34, "start", [{ ink: [...c("21143.6 → "), ...w("21319.8"), ...c(" → 21633.6")],
                                               exe: "34.918 → 36.68 → 39.818", gog: "-12.964 → -11.202 → -8.064" }]);

    // the devices, over the pipe
    const dev = el("g", { class: "g-devs" }, svg);
    el("circle", { class: "g-dev", cx: L, cy: MY, r: 46 }, dev);
    el("text", { class: "g-name", x: L, y: MY + 3, "text-anchor": "middle" }, dev, "BotS");
    el("text", { class: "g-sub", x: L, y: MY + 20, "text-anchor": "middle" }, dev, "pump");
    el("circle", { class: "g-state", cx: 66, cy: MY, r: 5 }, dev);
    el("text", { class: "g-name g-sm", x: 66, y: MY - 14, "text-anchor": "middle" }, dev, "UNN_SP");
    el("line", { class: "g-energy g-dash", x1: 76, y1: MY, x2: L - 52, y2: MY, "marker-end": "url(#g-arrow)" }, dev);
    const nx = (76 + L - 52) / 2 + 6;
    let t = el("text", { class: "g-ftxt", x: nx, y: MY - 10, "text-anchor": "middle" }, dev);
    el("tspan", { class: "g-fname" }, t, "NDST"); t.append(" (12)");
    el("text", { class: "g-ftxt", x: nx, y: MY + 20, "text-anchor": "middle" }, dev, "work in");

    el("rect", { class: "g-dev", x: MX - 85, y: T - 32, width: 170, height: 64, rx: 6 }, dev);
    el("text", { class: "g-name", x: MX, y: T + 3, "text-anchor": "middle" }, dev, "TSBS");
    el("text", { class: "g-sub", x: MX, y: T + 20, "text-anchor": "middle" }, dev, "boiler");
    el("rect", { class: "g-dev", x: MX - 70, y: T - 170, width: 140, height: 48, rx: 24 }, dev);
    el("text", { class: "g-name g-sm", x: MX, y: T - 147, "text-anchor": "middle" }, dev, "VSSL");
    el("text", { class: "g-sub", x: MX, y: T - 132, "text-anchor": "middle" }, dev, "furnace");
    el("line", { class: "g-energy", x1: MX, y1: T - 122, x2: MX, y2: T - 38, "marker-end": "url(#g-arrow)" }, dev);
    t = el("text", { class: "g-ftxt", x: MX + 12, y: T - 82 }, dev);
    el("tspan", { class: "g-fname" }, t, "A.G.E."); t.append(" (23)");
    el("text", { class: "g-ftxt", x: MX + 12, y: T - 66 }, dev, "heat in");

    const ty0 = 560, ty1 = 700, sy = (ty0 + ty1) / 2;
    el("path", { class: "g-dev", d: `M${R - 24},${ty0} L${R + 24},${ty0} L${R + 58},${ty1} L${R - 58},${ty1} Z` }, dev);
    el("text", { class: "g-name", x: R, y: sy + 8, "text-anchor": "middle" }, dev, "ATDF");
    el("text", { class: "g-sub", x: R, y: sy + 25, "text-anchor": "middle" }, dev, "turbine");
    el("line", { class: "g-shaft", x1: R + 46, y1: sy + 30, x2: R + 172, y2: sy + 30 }, dev);
    el("line", { class: "g-shaft", x1: R + 47, y1: sy + 36, x2: R + 172, y2: sy + 36 }, dev);
    t = el("text", { class: "g-ftxt", x: R + 110, y: sy + 22, "text-anchor": "middle" }, dev);
    el("tspan", { class: "g-fname" }, t, "N://ACC.ESS"); t.append(" · NGA");
    t = el("text", { class: "g-ftxt", x: R + 110, y: sy + 56, "text-anchor": "middle" }, dev);
    el("tspan", { class: "g-fname" }, t, "NOAH"); t.append(" (34) · work out");
    el("rect", { class: "g-dev", x: R + 172, y: sy + 6, width: 132, height: 54, rx: 6 }, dev);
    el("text", { class: "g-name g-sm", x: R + 238, y: sy + 30, "text-anchor": "middle" }, dev, "TAH");
    el("text", { class: "g-sub", x: R + 238, y: sy + 47, "text-anchor": "middle" }, dev, "secondary output");

    el("circle", { class: "g-dev", cx: MX, cy: B, r: 56 }, dev);
    el("text", { class: "g-name", x: MX, y: B + 2, "text-anchor": "middle" }, dev, "MF");
    el("text", { class: "g-sub", x: MX, y: B + 19, "text-anchor": "middle" }, dev, "MFR · condenser");
    el("line", { class: "g-energy", x1: MX, y1: B + 58, x2: MX, y2: B + 136, "marker-end": "url(#g-arrow)" }, dev);
    t = el("text", { class: "g-ftxt", x: MX + 12, y: B + 90 }, dev);
    el("tspan", { class: "g-fname" }, t, "MF"); t.append(" (41) · heat out");
    el("text", { class: "g-ftxt", x: MX + 12, y: B + 106 }, dev, "primary output");
    el("rect", { class: "g-dev", x: MX - 80, y: B + 142, width: 160, height: 50, rx: 25 }, dev);
    el("text", { class: "g-name g-sm", x: MX, y: B + 165, "text-anchor": "middle" }, dev, "D.E.M.");
    el("text", { class: "g-sub", x: MX, y: B + 181, "text-anchor": "middle" }, dev, "Deux Ex Machina");

    el("circle", { class: "g-core", cx: MX, cy: MY, r: 78 }, dev);
    el("text", { class: "g-name g-big", x: MX, y: MY - 4, "text-anchor": "middle" }, dev, "GPBS");
    el("text", { class: "g-sub", x: MX, y: MY + 18, "text-anchor": "middle" }, dev, "working fluid");
    el("text", { class: "g-exe g-strong", x: MX, y: MY + 37, "text-anchor": "middle" }, dev, "EXE_TPDP");

    // the present state
    mark = el("g", { class: "g-mark", role: "timer" }, svg);
    el("circle", { class: "g-now-ring", r: 11 }, mark);
    el("circle", { class: "g-now-dot", r: 4 }, mark);
    markText = el("text", { class: "g-now-txt" }, mark);
    for (const cls of ["g-now-tn", "g-now-exe", "g-now-gog"]) el("tspan", { class: cls }, markText);
    document.getElementById("gpbs-scroll").append(svg);
  }

  // ---- live
  const $ = id => document.getElementById(id);
  const out = { tn: $("gpbs-tn"), exe: $("gpbs-exe"), gog: $("gpbs-gog"), ns: $("gpbs-ns"), where: $("gpbs-where"),
                pct: $("gpbs-pct"), bar: $("gpbs-bar") };
  const short = (s, places) => s.replace(new RegExp(`(\\.\\d{${places}})\\d*$`), "$1").replace(/^-/, M);
  let timer = 0, lastPos = "";
  function render() {
    const now = Date.now(), num = Yg.zOf(now).num, z = Number(num) / (Yg.YG_DEN * Yg.DAY_MS);
    const tn = HC.read(HC.CLOCKS.tnldy, num), exe = HC.read(EXE, num), gog = HC.read(GOG, num);
    out.tn.textContent = tn; out.exe.textContent = m(exe); out.gog.textContent = m(gog);
    out.ns.textContent = Yg.nsukka(now).slice(0, 19);
    const i = A.findIndex((a, k) => k + 1 < A.length && a[0] <= z && z < A[k + 1][0]);
    if (i < 0) {
      mark.setAttribute("hidden", ""); trail.setAttribute("points", "");
      const where = z < A[0][0] ? "before GPBN, where the cycle begins" : "past GPBN, where the cycle closes";
      if (out.where.textContent !== where) out.where.textContent = where;
      out.pct.textContent = ""; out.bar.style.width = "0";
      return;
    }
    const [t0, x0, y0, w0, e0] = A[i], [t1, x1, y1, w1, e1] = A[i + 1], f = (z - t0) / (t1 - t0);
    const x = x0 + (x1 - x0) * f, y = y0 + (y1 - y0) * f;
    const where = (w0 === w1 ? `In ${w0}` : `${w0} → ${w1}`) + ` · from ${m(e0)} (TNLDY ${t0}) to ${m(e1)} (TNLDY ${t1})`;
    if (out.where.textContent !== where) out.where.textContent = where;
    out.pct.textContent = (100 * f).toFixed(4) + " %";
    out.bar.style.width = (100 * f).toFixed(3) + "%";
    const pos = `${x.toFixed(2)},${y.toFixed(2)}`;
    if (pos !== lastPos) {                                          // it moves about a pixel a week
      lastPos = pos;
      mark.setAttribute("transform", `translate(${pos})`);
      trail.setAttribute("points", A.slice(0, i + 1).map(a => `${a[1]},${a[2]}`).join(" ") + ` ${pos}`);
      // its readings stand inside the loop, beside it
      const vertical = Math.abs(x1 - x0) < 1;
      const tx = vertical ? (x < MX ? 18 : -18) : 0, anchor = vertical ? (x < MX ? "start" : "end") : "middle";
      const ty = vertical ? -14 : (y < MY ? 30 : -50);
      markText.setAttribute("text-anchor", anchor);
      [...markText.children].forEach((s, k) => { s.setAttribute("x", tx); s.setAttribute("y", ty + 16 * k); });
    }
    const [sTn, sExe, sGog] = markText.children;
    sTn.textContent = short(tn, 2); sExe.textContent = short(exe, 4); sGog.textContent = short(gog, 4);
    mark.removeAttribute("hidden");
  }
  function show() {
    if (!svg) build();
    render();
    if (!dlg.open) dlg.showModal();
    clearInterval(timer);
    timer = setInterval(() => { if (!document.hidden) render(); }, 100);
    // where the drawing is larger than the window, open it at the present state
    const sc = $("gpbs-scroll"), r = mark.getBoundingClientRect(), box = sc.getBoundingClientRect();
    if (sc.scrollWidth > sc.clientWidth) sc.scrollLeft += r.left - box.left - sc.clientWidth / 2;
    const top = dlg.querySelector(".gpbs-top").offsetHeight, d = dlg.getBoundingClientRect();
    if (dlg.scrollHeight > dlg.clientHeight) dlg.scrollTop += r.top - d.top - top - (dlg.clientHeight - top) / 2;
  }
  btn.addEventListener("click", show);
  $("gpbs-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });  // a click on the backdrop
  dlg.addEventListener("close", () => clearInterval(timer));
})();
