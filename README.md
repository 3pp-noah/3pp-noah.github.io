# 3PP-NOAH

**The nth-member sites, REVOTT stamps, SOLID STAMP and JOMO SFO-WAM from one place.** Served at https://3pp-noah.github.io/.

`index.html` is the page: a large Ω with nine radio buttons around it —
NTH-HOME (the nth-member page) at the top, then clockwise the nth-member sites and JOMO SFO-WAM,
which has its own home under the 3pp-noah organisation — with four clocks at its corners and, behind the ✦ beside
the title, the GPBS power cycle, live (both below).
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

Four clocks run at the corners of the page, all read at one instant, ten times a second:

| corner | clock | reading | it reads 0 at (Nsukka) |
|---|---|---|---|
| top left | **TNLDY** | TNLDY, read from Nsukka on the Yg clock | |
| top left, pressed | **TNL.YG** | TNLDY / Yg, Yg = 17640/48.3 days | |
| top left, pressed again | **TNL.YJ** | TNLDY / yJ, yJ = 360 days | |
| top right | **EXE_TPDP.100D** | (TNLDY − 17651.8) / 100 | 2018-03-07 03:32:52.174 |
| top right, pressed | **EXE_CDOWN.100D** | (TNLDY − 25931.8) / 100 | 2040-11-06 08:45:54.783 |
| bottom left | **END_IE_PURPOSE.100D**, aka GOG_ID.100D | (TNLDY − 22440) / 100 | 2031-04-16 12:31:18.261 |
| bottom left, pressed | **AGAIN_BORN_CIRCUMSPECTION.100D** | (TNLDY − 22692) / 100 | 2031-12-24 07:18:15.652 |
| bottom right | **DNPS.100D** | (TNLDY − 33·17640/48.3) / 100 | 2002-11-06 00:00:00.000 |
| bottom right, pressed | **ARM_CDOWN.100D** | (TNLDY − 26414.8) / 100 | 2042-03-04 22:19:49.565 |
| bottom right, pressed again | **WHIZZ-KIDS-BEAST.100D** | (TNLDY − 16610) / 100 | 2015-04-30 00:00:00.000 |

- **TNLDY** comes from `nsukka-yg-clock.js`, a byte-identical copy of the Nsukka/Yg clock that every
  other 3PP-NOAH site uses: the Yg year (17640/48.3 days) laid on Nsukka's calendar from 1 December and
  recalibrated there each year, so that on 1 December all four clocks step together (+5/23 day on
  2026-12-01).
- **Five of the 100-day clocks are the MDQNM engine's own.** Their Ztp values are the engine's (`EXE_TPDP.100D`,
  `GOGID.100D` = `END_IE_PURPOSE_BIRTH.100D` and `END_IE_PURPOSE_CIRCUMSPECTION.100D` in `crf0`;
  `DNPS12052.100D` in `sfo16`). 17651.8, 22440 and 22692 are 14160 + 100·Y for REVOTT's Y = 34.918,
  82.80 and 85.32; DNPS.100D's Ztp is 33 Yg exactly, 277200/23 = 12052.173913… .
- **Three are the author's own.** Two are countdowns (2026-11-19): EXE_CDOWN.100D, Ztp 25931.8, and
  ARM_CDOWN.100D, Ztp 26414.8; like every 100-day clock they read (TNLDY − Ztp)/100, rising through negative values
  to 0. The third is WHIZZ-KIDS-BEAST.100D, Ztp 16610 (2026-11-22).
- **TNL.YG and TNL.YJ** are TNLDY counted in Yg and in yJ, the engine's own `*tnl-yg*` and `*tnl-yj*` (Ztp 0).
- **Every corner is a button.** Pressing one moves it to its next clock: top left TNLDY, TNL.YG, TNL.YJ and back to
  TNLDY; top right EXE_TPDP.100D and EXE_CDOWN.100D; bottom left END_IE_PURPOSE.100D and
  AGAIN_BORN_CIRCUMSPECTION.100D; bottom right DNPS.100D, ARM_CDOWN.100D, WHIZZ-KIDS-BEAST.100D and back to DNPS.100D.
  Each visit starts with the first in each corner.
- **Precision.** TNLDY is shown to 6 decimals and a 100-day clock to 8, both a step of 86.4 ms; TNL.YG and
  TNL.YJ to 9, a step of about 31 ms. The readings are exact (integer arithmetic over the clock's own denominator, 23·86 400 000) and
  are shown floored, as a clock shows the tick it has reached. Each clock's tooltip gives its formula
  and the instant at which it reads 0.
- **Placement.** Where the window leaves room beside the dial, the clocks are fixed to the window's
  corners. Otherwise (on phones) the page keeps their height free above and below the dial, and when the
  page is taller than the window they stand at the corners of the page itself, so that none of them
  covers the dial or its buttons.
- `clocks.js` holds the definitions and the reading. It also loads under Node
  (`require("./clocks.js")`), for checking.
- `index.html` loads `clocks.js`, `nsukka-yg-clock.js` and `gpbs.js` with `?v=` and the first 8 hex digits of the
  file's SHA-256 (`sha256sum clocks.js | cut -c1-8`). Change it whenever the file changes: a browser keeps
  a script for up to 10 minutes and a refresh does not fetch it again, but a new address it fetches at once.

## The GPBS power cycle (✦)

The ✦ beside the title opens the GPBS power cycle, live: the author's drawing of 14 February 2025 redrawn as a
heat-engine cycle, with the present state moving round it.

- **The cycle** runs clockwise through four states at the corners (GPBN, GPBE, GPBM, TSoTS) and four devices on the
  sides: BotS, the pump, worked by NDST; TSBS, the boiler, heated by A.G.E. from the VSSL furnace; ATDF, the turbine,
  whose work leaves by the N://ACC.ESS shaft to TAH, the secondary output; MFR, the condenser, whose heat MF goes to
  D.E.M., the primary output. The working fluid is EXE_TPDP.
- **Every marking is the author's**, as written on the drawing: TNLDY in black, EXE_TPDP.100D in red and, where the
  drawing gives one, GOG_ID.100D in blue. TNLDY that the drawing does not write is computed from EXE_TPDP.100D
  (TNLDY = 17651.8 + 100·EXE_TPDP.100D) and shown in grey italic.
- **The present state** is read from the same clocks as the corners (`clocks.js`): TNLDY, EXE_TPDP.100D and
  GOG_ID.100D, ten times a second, exact and floored. It is drawn between the two markings it lies between, placed
  by TNLDY, and the way it has come since GPBN is highlighted. The line above the drawing names those two markings
  and how far it has gone from one to the next.
- `gpbs.js` draws the cycle at the first press and runs it while the popup is open. Where the drawing is larger than
  the window, the popup opens at the present state, with the readings kept in view above it.

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
