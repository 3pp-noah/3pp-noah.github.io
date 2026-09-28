// Build words/units.json: every saying of Jesus Christ in the RSV New Testament, by reference.
//
//   node words/build.mjs            (Node 18+; needs `unzip`; caches downloads in ~/.cache/words-build)
//
// Which quotations are Christ's words comes from the World English Bible (public domain), whose
// USFM text marks them \wj … \wj* — the red letters. For each quotation in the RSV (the same
// parser the page uses, words.js): where several quotations open in one verse and the WEB has as
// many there, they are matched in order (a question of Christ's and the reply to it); otherwise
// the words are compared with the WEB's marked and unmarked words for the same verses, and the
// quotation is Christ's when its verses carry marked words and it shares more words with them
// than with the rest. Each unit is one verse (or the part of it Christ speaks). Only references
// are written; the page fetches the text.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { API, BOOKS, innerQuotations, quotations, saying } from "./words.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = join(homedir(), ".cache", "words-build");
const WEB_ZIP = "https://ebible.org/Scriptures/eng-web_usfm.zip";
const USFM = ["MAT", "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH",
  "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV"];

mkdirSync(join(CACHE, "rsv"), { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url, file) {
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  for (let attempt = 0; ; attempt++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const text = await r.text();
      writeFileSync(file, text);
      await sleep(150);
      return JSON.parse(text);
    } catch (e) {
      if (attempt === 2) throw new Error(`${url}: ${e.message}`);
      await sleep(2000);
    }
  }
}

// WEB verses: {"book/chapter/verse": {marked: Set, other: Set, quotes: [true if Christ's, …]}}
// quotes lists the quotations that open in the verse, in order.
function webVerses() {
  const zip = join(CACHE, "eng-web_usfm.zip");
  if (!existsSync(zip)) execFileSync("curl", ["-sfL", "-o", zip, WEB_ZIP]);
  const out = new Map();
  const words = (s) => s.toLowerCase().match(/[a-z]+/g) || [];
  USFM.forEach((code, i) => {
    const book = 40 + i;
    const usfm = execFileSync("sh", ["-c", `unzip -p "${zip}" '*-${code}eng-web.usfm'`], { maxBuffer: 1 << 26 }).toString();
    const clean = usfm
      .replace(/\\f .*?\\f\*/gs, " ").replace(/\\x .*?\\x\*/gs, " ")
      .replace(/\\\+?w ([^|\\]*)\|[^\\]*\\\+?w\*/g, "$1");
    let chapter = 0, verse = 0, inWj = false;
    const tokens = clean.split(/(\\c \d+|\\v \d+|\\wj\*|\\wj )/);
    for (const tok of tokens) {
      let m;
      if ((m = tok.match(/^\\c (\d+)/))) { chapter = +m[1]; verse = 0; continue; }
      if ((m = tok.match(/^\\v (\d+)/))) { verse = +m[1]; continue; }
      if (tok === "\\wj ") { inWj = true; continue; }
      if (tok === "\\wj*") { inWj = false; continue; }
      if (!verse) continue;
      const key = `${book}/${chapter}/${verse}`;
      if (!out.has(key)) out.set(key, { marked: new Set(), other: new Set(), quotes: [] });
      const text = tok.replace(/\\[a-z0-9]+\*?/gi, " ");
      for (const _ of text.matchAll(/“/g)) out.get(key).quotes.push(inWj);
      for (const w of words(text)) out.get(key)[inWj ? "marked" : "other"].add(w);
    }
  });
  return out;
}

const wordsOf = (t) => new Set(t.toLowerCase().match(/[a-z]+/g) || []);
const share = (said, set) => said.size ? [...said].filter((w) => set.has(w)).length / said.size : 0;

// Is this verse's part of a quotation Christ's? When the RSV opens as many quotations in the verse
// as the WEB does, they correspond in order; otherwise compare words with the WEB's red letters.
function christsPart(text, verseKey, web, nth, count) {
  const v = web.get(verseKey);
  if (!v) return false;
  if (nth >= 0 && count > 0 && v.quotes.length === count) return v.quotes[nth];
  const said = wordsOf(text);
  return v.marked.size > 0 && share(said, v.marked) > 0 && share(said, v.marked) >= share(said, v.other);
}

const web = webVerses();
const books = (await getJSON("https://bolls.life/get-books/RSV/", join(CACHE, "books.json"))).filter((b) => b.bookid >= 40);
const units = [];
const perBook = {};
let quotes = 0;
const add = (unit, verses) => {
  const sy = saying(verses, unit);
  if (!sy || !/[A-Za-z]/.test(sy.text)) return;
  units.push(unit);
  perBook[BOOKS[unit[0]]] = (perBook[BOOKS[unit[0]]] || 0) + 1;
};
for (const { bookid: book, chapters } of books) {
  for (let chapter = 1; chapter <= chapters; chapter++) {
    const verses = await getJSON(`${API}/${book}/${chapter}/`, join(CACHE, "rsv", `${book}_${chapter}.json`));
    const spans = quotations(verses);
    quotes += spans.length;
    const christ = spans.map(() => false);
    const inQuote = new Set();
    spans.forEach((span, k) => {
      span.parts.forEach((part, i) => {
        inQuote.add(part.verse);
        const opening = i === 0 ? spans.filter((s) => s.parts[0].verse === part.verse) : [];
        const key = `${book}/${chapter}/${part.verse}`;
        const inner = innerQuotations(part.text);
        if (book === 44 && inner.length) {
          // Acts: the Lord's words recounted inside Peter's and Paul's speeches — the quotation
          // within, not the apostle's narration around it.
          inner.forEach((q, j) => {
            if (christsPart(q, key, web, -1, 0)) add([book, chapter, k, part.verse, j], verses);
          });
        } else if (christsPart(part.text, key, web, i === 0 ? opening.indexOf(span) : -1, opening.length)) {
          christ[k] = true;
          add([book, chapter, k, part.verse], verses);
        }
      });
    });
    // A verse outside every quotation, wholly red in the WEB, between two quotations of Christ's:
    // a discourse whose quotation marks the source text breaks off (Luke 15:20–24). The RSV's own
    // closes stand — John 3:16–21 follows Christ's last quotation but precedes another speaker's.
    for (const { verse } of verses) {
      if (inQuote.has(verse)) continue;
      const v = web.get(`${book}/${chapter}/${verse}`);
      if (!v || !v.marked.size || v.other.size > 3) continue;
      const before = spans.map((s, k) => [s, k]).filter(([s]) => s.parts.at(-1).verse < verse).at(-1);
      const after = spans.map((s, k) => [s, k]).find(([s]) => s.parts[0].verse > verse);
      if (before && after && christ[before[1]] && christ[after[1]]) add([book, chapter, -1, verse], verses);
    }
  }
}
units.sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[3] - y[3] || x[2] - y[2] || (x[4] ?? -1) - (y[4] ?? -1));

writeFileSync(join(HERE, "units.json"), "[\n" + units.map((u) => JSON.stringify(u)).join(",\n") + "\n]\n");
console.log(`${quotes} quotations in the RSV New Testament; ${units.length} verses of Christ's words`);
console.log(Object.entries(perBook).map(([b, n]) => `${b} ${n}`).join(" · "));
