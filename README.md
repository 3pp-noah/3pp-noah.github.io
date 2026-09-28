# 3PP-NOAH

**The nth-member sites and JOMO SFO-WAM from one place.** Served at https://3pp-noah.github.io/.

`index.html` is the whole site: a large Ω with seven radio buttons around it —
NTH-HOME (the nth-member page) at the top, then clockwise the five nth-member sites and JOMO SFO-WAM,
which has its own home under the 3pp-noah organisation. Choosing one shows what it is and an **Open**
button; Enter or a double-click opens it directly. No build step, no dependencies.

| button | opens |
|---|---|
| NTH-HOME | https://nth-member.github.io/ — the organisation's page, listing its sites |
| REVOTT | https://nth-member.github.io/revott/ |
| THE NTH MEMBER | https://nth-member.github.io/member/ |
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
  random.org cannot be reached, the browser's cryptographic generator is used instead, and the
  expanded verse says which source drew it.
- **A new verse per visit:** each browser remembers the verses it has shown and draws among the
  others until all 2,050 have been seen.
- **Coverage:** 2,031 of the WEB's 2,059 red-letter verses. The rest are verses the RSV omits,
  John 3:16–21 (which the RSV prints outside Christ's words, as the evangelist's), and others
  quoting his words back to him.

Scripture quotations are from the Revised Standard Version of the Bible, copyright © 1946, 1952,
and 1971 the National Council of the Churches of Christ in the United States of America.
