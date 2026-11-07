# Outreach scheduler

**Reach people when they open the app.** For my job search I connect with recruiters in Dublin
and Dubai. A request sent at 3 a.m. their time sinks under everything that arrives before they
wake up, so each country gets its own morning window, in its own time zone.

## How it works

- **A daily queue** of contacts in Google Sheets, prioritized and balanced across companies.
- **Local windows.** Each country sends between 07:00 and 08:00 local time: Dubai at 04:00 to
  05:00 Madrid time in winter, Dublin at 08:00 to 09:00. Time zones and daylight saving come from
  the IANA zones, so the plan stays right all year without manual changes
  ([src/windows.mjs](src/windows.mjs)).
- **Human pacing.** Never two actions closer than 75 seconds; the spare time in the window is
  spread at random, about one request every 4 minutes.
- **Nothing out of hours.** If the machine was off or a run started late, what no longer fits in
  today's window stays queued for tomorrow instead of being sent at the wrong time.
- **Feedback loop.** A daily job detects accepted requests, updates the sheet and sends me a
  Telegram message; another one checks that the session is still valid.
- **Respecting the platform's limits.** If the platform signals a weekly invitation limit, the
  campaign pauses until the next day and tries again, instead of insisting.
- **One codebase, several accounts.** A second account runs from the same code with its own
  config file (queue, window, browser profile, logs), so a fix reaches both.

## A lesson worth keeping

A retry once clicked the wrong button. The first click had already worked, but the check
"is the request pending?" looked at the whole page and missed it, and the retry pressed a
*Connect* button in a sidebar of suggested people. The fix: anchor every check to the block that
holds the person's name, and before retrying, check whether the first attempt already succeeded.

## In this folder

- `src/windows.mjs`: the windows and pacing (production logic, translated to English).
- `demo/run.mjs`: plans a day for a fictional queue of 30 contacts.
- Tests in `../test/` cover four dates, including both daylight-saving changes.

```bash
npm run demo:outreach
```

The part that drives the browser stays private.
