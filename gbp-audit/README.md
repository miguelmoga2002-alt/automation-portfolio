# Google Business Profile audit

**Where do we stand on Google Maps against local competitors?** Once a month this job opens the
profile of the business and of each competitor, the way a person would, and turns what is on
screen into a comparable audit: rating, number of reviews, how recent the last review is, whether
the owner replies, whether the profile is claimed, whether it posts updates and where its website
link goes.

## How it works

1. A config file lists the profiles to audit (13 today: our own branches first, then
   competitors).
2. For each one it searches Google Maps, picks the result whose name matches, and reads the
   overview, the reviews (sorted by newest) and the information tab.
3. The text and a screenshot of each profile are saved to disk; progress is written to a log, so
   an interrupted run resumes where it stopped.
4. One to two minutes between profiles, and it stops at the first sign of a block.
5. The signals ([src/signals.mjs](src/signals.mjs)) become a list of concrete gaps per profile,
   published as one Notion page per month.

## A finding from the first run

Our own branch's website link carried the tracking campaign of a different branch and pointed to
the home page instead of the branch's page, so visits from that profile were credited to the
wrong location. The audit now checks the tracking campaign each profile should use.

## In this folder

- `src/signals.mjs`: from profile text to signals and gaps (production logic, translated to
  English).
- `demo/`: three fictional profiles, one of them ours.

```bash
npm run demo:gbp
```

It reuses the browser session handling and the Notion publishing of the GEO panel (one
codebase, two jobs); those parts stay private.
