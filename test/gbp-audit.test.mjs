import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readProfile, gaps, daysAgo } from '../gbp-audit/src/signals.mjs';

test('relative dates', () => {
  assert.equal(daysAgo('3 weeks ago'), 21);
  assert.equal(daysAgo('a year ago'), 365);
  assert.equal(daysAgo('yesterday'), null);
});

test("the owner's reply date is not counted as a review", () => {
  const p = readProfile({ overview: '4.0\n(3)', reviews: 'A\n2 days ago\nok\nResponse from the owner\n1 day ago\nthanks' });
  assert.equal(p.reviewsRead, 1);
  assert.equal(p.replyRate, 1);
  assert.equal(p.lastReviewDays, 2);
});

test('a website link with the wrong campaign and pointing to the home page is flagged', () => {
  const p = readProfile({ overview: '5.0\n(1)', website: 'https://x.example/?utm_campaign=other' }, { expectedCampaign: 'mine' });
  const g = gaps(p).join(' | ');
  assert.match(g, /expected "mine"/);
  assert.match(g, /home page/);
});

test('an unclaimed profile is flagged first', () => {
  const p = readProfile({ overview: '4.1\n(37)\nClaim this business' });
  assert.equal(gaps(p)[0], 'Profile not claimed');
});
