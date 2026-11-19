# 3PP-NOAH

**The nth-member sites, REVOTT stamps, SOLID STAMP and JOMO SFO-WAM from one place.** Served at https://3pp-noah.github.io/.

`index.html` is the page: a large Ω with nine radio buttons around it —
NTH-HOME (the nth-member page) at the top, then clockwise the nth-member sites and JOMO SFO-WAM,
which has its own home under the 3pp-noah organisation — and four clocks at its corners (below).
Choosing a button shows what the site is and an **Open** button; Enter or a double-click opens it
directly. No build step, no dependencies.

| button | opens |
|---|---|
| NTH-HOME | https://nth-member.github.io/ — the organisation's page, listing its sites |
| REVOTT | https://nth-member.github.io/revott/ |
| THE NTH MEMBER | https://nth-member.github.io/member/ |
| REVOTT STAMPS | https://nth-member.github.io/revott-stamps/ — feed items stamped onto a (Y, X) of REVOTT |
| SOLID STAMP | https://nth-member.github.io/solid-stamp/ — a notification at every TNLDY that matches SFO-BBs |
| GDELT | https://nth-member.github.io/gdelt/ |
| H-GEMATRIA/ASCII | https://nth-member.github.io/gematria/ |
| ALIEN CORRIDOR | https://nth-member.github.io/alien-corridor/ |
| JOMO SFO-WAM | https://3pp-noah.github.io/jomo-sfo-wam/ — repository 3pp-noah/jomo-sfo-wam |

## The clocks at the corners

Four clocks run at the corners of the page, all four read at one instant, ten times a second:

| corner | clock | reading | it reads 0 at (Nsukka) |
|---|---|---|---|
| top left | **TNLDY** | TNLDY, read from Nsukka on the Yg clock | |
| top right | **EXE_TPDP.100D** | (TNLDY − 17651.8) / 100 | 2018-03-07 03:32:52.174 |
| bottom left | **AGAIN_BORN.100D**, aka GOG_ID.100D | (TNLDY − 22440) / 100 | 2031-04-16 12:31:18.261 |
| bottom left, pressed | **AGAIN_BORN_CIRCUMSPECTION.100D** | (TNLDY − 22692) / 100 | 2031-12-24 07:18:15.652 |
| bottom right | **DNPS.100D** | (TNLDY − 33·17640/48.3) / 100 | 2002-11-06 00:00:00.000 |

- **TNLDY** comes from `nsukka-yg-clock.js`, a byte-identical copy of the Nsukka/Yg clock that every
  other 3PP-NOAH site uses: the Yg year (17640/48.3 days) laid on Nsukka's calendar from 1 December and
  recalibrated there each year, so that on 1 December all four clocks step together (+5/23 day on
  2026-12-01).
- **The 100-day clocks are the MDQNM engine's own.** Their Ztp values are the engine's (`EXE_TPDP.100D`,
  `GOGID.100D` = `END_IE_PURPOSE_BIRTH.100D` and `END_IE_PURPOSE_CIRCUMSPECTION.100D` in `crf0`;
  `DNPS12052.100D` in `sfo16`). 17651.8, 22440 and 22692 are 14160 + 100·Y for REVOTT's Y = 34.918,
  82.80 and 85.32; DNPS.100D's Ztp is 33 Yg exactly, 277200/23 = 12052.173913… .
- **The bottom-left clock is a button:** pressing it switches between AGAIN_BORN.100D and
  AGAIN_BORN_CIRCUMSPECTION.100D. Each visit starts with AGAIN_BORN.100D.
- **Precision.** TNLDY is shown to 6 decimals and a 100-day clock to 8: the same step, 86.4 ms, on every
  clock. The readings are exact (integer arithmetic over the clock's own denominator, 23·86 400 000) and
  are shown floored, as a clock shows the tick it has reached. Each clock's tooltip gives its formula
  and the instant at which it reads 0.
- **Placement.** Where the window leaves room beside the dial, the clocks are fixed to the window's
  corners. Otherwise (on phones) the page keeps their height free above and below the dial, and when the
  page is taller than the window they stand at the corners of the page itself, so that none of them
  covers the dial or its buttons.
- `clocks.js` holds the definitions and the reading. It also loads under Node
  (`require("./clocks.js")`), for checking.

## The words inside the Ω

At each visit the Ω holds one verse of the words of Jesus Christ from the New Testament, in the
Revised Standard Version; hovering over it (or a tap, on a phone) shows it in full.

| Part | Role |
|---|---|
| `words/units.json` | the 2,050 verses of Christ's words, by reference only — no scripture text is stored here |
| `words/words.js` | fetches the chosen verse's chapter from the Bolls.life Bible API and cuts out the words spoken, by the RSV's quotation marks |
| `words/build.mjs` | makes `units.json`: which quotations are Christ's comes from the red letters (`\wj`) of the World English Bible's USFM text |

- **The draw is truly random:** the verse's number comes from random.org (atmospheric noise). If
  random.org cannot be reached, the browser's cryptographic generator is used instead; the
  verse's `data-source` attribute records which drew it.
- **A new verse per visit:** each browser remembers the verses it has shown and draws among the
  others until all 2,050 have been seen.
- **Coverage:** 2,031 of the WEB's 2,059 red-letter verses. The rest are verses the RSV omits,
  John 3:16–21 (which the RSV prints outside Christ's words, as the evangelist's), and others
  quoting his words back to him.

Scripture quotations are from the Revised Standard Version of the Bible, copyright © 1946, 1952,
and 1971 the National Council of the Churches of Christ in the United States of America.

## usage.js

Every page of 3pp-noah.github.io and nth-member.github.io loads `usage.js`, the owner's usage
recorder. **For a visitor it does nothing:** unless the owner has enrolled that browser, it stores,
sends and changes nothing. In an enrolled browser it records how the pages are used — pages opened,
controls used, the values of choices, numbers and searches (other typed text only as a length, and
nothing typed or shown on the gematria page), time on the page, errors — and sends the records to the
owner's private Google Sheet, so that the sites' revamp follows their actual use. No records are kept
in this repository.

## Refreshing the sites

One command, on the computer that keeps the sites, refreshes every 3PP-NOAH site whose data changes: JOMO
SFO-WAM's feeds, REVOTT stamps, then GDELT into the GDELT day sources, REVOTT, the nth member,
H-Gematria/ASCII and IPPROTO.

```bash
cd ~ && ./refresh-all.sh --push     # refresh and publish every updatable site
cd ~ && ./refresh-all.sh            # refresh and commit, push nothing
cd ~ && ./refresh-all.sh --check    # what GDELT has that is new; changes nothing
```

JOMO SFO-WAM's feeds and REVOTT stamps also refresh themselves every 15 minutes, from cron.
