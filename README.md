# 3PP-NOAH

**The nth-member sites, REVOTT stamps, SOLID STAMP and JOMO SFO-WAM from one place.** Served at https://3pp-noah.github.io/.

`index.html` is the whole site: a large Ω with nine radio buttons around it —
NTH-HOME (the nth-member page) at the top, then clockwise the nth-member sites and JOMO SFO-WAM,
which has its own home under the 3pp-noah organisation. Choosing one shows what it is and an **Open**
button; Enter or a double-click opens it directly. No build step, no dependencies.

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
