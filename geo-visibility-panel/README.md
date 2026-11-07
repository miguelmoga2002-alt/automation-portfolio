# GEO visibility panel

**Do AI assistants recommend us?** More and more customers ask ChatGPT or Google's AI answers
"which company should I hire to replace my windows in Barcelona?" instead of searching. This panel
measures, every month, whether the answer names my family's aluminium carpentry business, in what
position, next to which competitors, and which sources the AI cites.

## How a round works

1. **Fixed question set.** 26 questions a real customer would ask, in Spanish and tied to the
   cities and services the business covers, tagged by intent: *money* (who should I hire),
   *informational* (how much, what permits) and *differentiator* (what only we offer). Each
   question has a permanent number and optional active months, so seasonal questions (for example,
   grants for a given year) can be retired without breaking comparisons.
2. **Six AI surfaces.** ChatGPT, Gemini, Perplexity, Claude, Google AI Overviews and Google AI
   Mode: 156 answers a month. Chats run in temporary or incognito mode so history does not bias
   the answers.
3. **Spread out and capped.** The round runs over three days at the start of each month, with a
   cap per run (80 questions, 3 hours), 20 to 40 s between questions and 1 to 2 minutes between
   platforms.
4. **Evidence first.** Each answer is saved as text, its links and a screenshot before anything
   else.
5. **Analysis.** Deterministic detection of the brand, known competitors and directories, plus a
   local LLM that lists the businesses recommended. Its list is only accepted for names present
   in the text ([src/analyzer.mjs](src/analyzer.mjs)).
6. **Publishing.** One row per answer in a Notion database and a monthly report: share of voice
   overall, by platform and by intent, change against the previous month, most cited competitors
   and sources, and coverage (which answers are missing and why).

Captchas, usage limits and login walls are detected and stored with their own status; they are
never counted as "not mentioned".

## What I learned building it

- **An invented business is worse than a missed one.** The model sometimes "recommends" a company
  that is not in the answer. Verifying against the literal text removed that class of error.
- **AI answers cite through opaque redirects.** Google's AI answers link through tracking
  redirects, so the cited domain is read from what the page shows, not from the link.
- **Sites change their markup every few weeks.** Selectors live in a config file with fallbacks,
  and a test command saves a screenshot and the HTML of one question so a fix takes minutes.
- **A missing answer is information.** The report shows coverage per platform so a bad month is
  not mistaken for lost visibility.

## In this folder

- `src/analyzer.mjs`: answer analysis and share-of-voice computation (production logic, translated
  to English and simplified).
- `demo/`: a fictional brand, competitors and answers, including one business the model "invents".

```bash
npm run demo:geo
```

The browser automation, real questions' answers, competitors and the Notion integration stay
private.
