// The words of Jesus Christ in the New Testament, Revised Standard Version, one saying at a time.
//
// The RSV text comes live from the Bolls.life Bible API. words/units.json lists the verses by
// reference only — book, chapter, the quotation's place among the chapter's quotations, and the
// verse — so no scripture text is stored here. words/build.mjs makes that list.
//
// Quotation marks in the API's RSV text: ' opens and closes a quotation (“ ”); ` opens a
// quotation within it (‘); " closes one (’) and also stands for the apostrophe (’). An opening '
// met inside a quotation continues the speech into a new paragraph.

export const API = "https://bolls.life/get-text/RSV";

export const BOOKS = {
  40: "Matthew", 41: "Mark", 42: "Luke", 43: "John", 44: "Acts", 45: "Romans",
  46: "1 Corinthians", 47: "2 Corinthians", 48: "Galatians", 49: "Ephesians", 50: "Philippians",
  51: "Colossians", 52: "1 Thessalonians", 53: "2 Thessalonians", 54: "1 Timothy", 55: "2 Timothy",
  56: "Titus", 57: "Philemon", 58: "Hebrews", 59: "James", 60: "1 Peter", 61: "2 Peter",
  62: "1 John", 63: "2 John", 64: "3 John", 65: "Jude", 66: "Revelation",
};

const opensQuote = (prev, next) => (prev === "" || /[\s(\[—–-]/.test(prev)) && next !== "" && !/\s/.test(next);

// Every quotation in a chapter, in order: [{parts: [{verse, text}]}].
export function quotations(verses) {
  const spans = [];
  let cur = null;
  const add = (verse, ch) => {
    const last = cur.parts[cur.parts.length - 1];
    if (last && last.verse === verse) last.text += ch;
    else cur.parts.push({ verse, text: ch });
  };
  for (const { verse, text } of verses) {
    const t = text.replace(/<[^>]+>/g, "");
    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      if (ch === "'") {
        if (opensQuote(i ? t[i - 1] : "", t[i + 1] ?? "")) {
          if (cur) spans.push(cur);
          cur = { parts: [] };
        } else if (cur) {
          spans.push(cur);
          cur = null;
        }
        continue;
      }
      if (cur) add(verse, ch);
    }
    if (cur) add(verse, " ");
  }
  if (cur) spans.push(cur);
  return spans
    .map((s) => ({ parts: s.parts.map((p) => ({ verse: p.verse, text: p.text.trim() })).filter((p) => p.text) }))
    .filter((s) => s.parts.length);
}

// Quotations within a quotation, in one verse's part of it: ` … " (‘ … ’). A " between two
// letters is an apostrophe, not a close; one still open at the verse's end runs on into the next.
export function innerQuotations(text) {
  const out = [];
  let cur = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "`") { cur = ""; continue; }
    if (ch === '"' && cur !== null && !(/[A-Za-z]/.test(text[i - 1] ?? "") && /[A-Za-z]/.test(text[i + 1] ?? ""))) {
      if (cur.trim()) out.push(cur.trim());
      cur = null;
      continue;
    }
    if (cur !== null) cur += ch;
  }
  if (cur !== null && cur.trim()) out.push(cur.trim()); // runs on into the next verse
  return out;
}

// The API's marks to typographic ones.
export function typeset(text) {
  return text
    .replace(/`/g, "‘")
    .replace(/"/g, "’")
    .replace(/\s*--\s*/g, " — ")
    .replace(/\s+/g, " ")
    .trim();
}

// One verse of Christ's words. unit = [book, chapter, k, verse, j?] from units.json:
//   k >= 0 — the verse's part of the chapter's k-th quotation; with j, the j-th quotation inside
//            that part (the Lord's words as recounted by Peter and Paul in Acts);
//   k = -1 — the whole verse (a discourse whose quotation marks the source text breaks off).
export function saying(verses, [book, chapter, k, verse, j]) {
  let text;
  if (k === -1) {
    text = verses.find((v) => v.verse === verse)?.text.replace(/<[^>]+>/g, "").replace(/'/g, "");
  } else {
    const part = quotations(verses)[k]?.parts.find((p) => p.verse === verse);
    text = part && (j === undefined ? part.text : innerQuotations(part.text)[j]);
  }
  if (!text) return null;
  // A verse that begins or ends inside a sentence is marked so.
  const t = typeset(text).replace(/[,;:]$/, "…").replace(/^(?=[a-z])/, "…");
  return { text: t, ref: `${BOOKS[book]} ${chapter}:${verse}`, book, chapter, verse };
}

// A uniform whole number in [0, n). True randomness first: random.org, whose numbers come from
// atmospheric noise. If it cannot be reached, the browser's cryptographic generator, which is
// seeded from the device's entropy but is itself pseudorandom; `source` says which was used.
export async function drawIndex(n, timeoutMs = 4000) {
  try {
    const url = `https://www.random.org/integers/?num=1&min=0&max=${n - 1}&col=1&base=10&format=plain&rnd=new`;
    const r = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(timeoutMs) });
    const i = Number((await r.text()).trim());
    if (r.ok && Number.isInteger(i) && i >= 0 && i < n) return { index: i, source: "random.org (atmospheric noise)" };
  } catch { /* fall through */ }
  // Rejection sampling keeps the draw uniform.
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf); while (buf[0] >= limit);
  return { index: buf[0] % n, source: "this device's cryptographic generator (random.org unreachable)" };
}

// Each browser remembers which verses it has been shown and draws among the others, so every
// visit brings a verse not seen before; once all have been shown, the round begins again.
const SEEN = "words-seen";
function seen() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN) || "[]")); } catch { return new Set(); }
}
function remember(set) {
  try { localStorage.setItem(SEEN, JSON.stringify([...set])); } catch { /* private window: no memory */ }
}

const chapters = new Map();
export async function randomSaying(units) {
  const key = (u) => u.join(".");
  let shown = seen();
  let pool = units.filter((u) => !shown.has(key(u)));
  if (!pool.length) { shown = new Set(); pool = units; }
  const { index, source } = await drawIndex(pool.length);
  const unit = pool[index];
  shown.add(key(unit));
  remember(shown);
  const at = `${unit[0]}/${unit[1]}`;
  if (!chapters.has(at)) {
    const r = await fetch(`${API}/${at}/`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    chapters.set(at, await r.json());
  }
  const s = saying(chapters.get(at), unit);
  if (!s) throw new Error(`no saying at ${key(unit)}`);
  return { ...s, source };
}
