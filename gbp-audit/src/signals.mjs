// Turns the visible text of a Google Business Profile (what a person sees on Maps) into the
// signals of an audit: rating, reviews, how recent the last one is, whether the owner replies,
// whether the profile is claimed, whether it posts updates, and whether its website link is
// tracked correctly. Pure functions: the browser part only saves the text and a screenshot.

const AGO = /(\d+|an?|one)\s+(day|week|month|year)s?\s+ago/i;
const UNIT_DAYS = { day: 1, week: 7, month: 30, year: 365 };

/** "3 weeks ago" -> 21 (approximate days), or null. */
export function daysAgo(s) {
  const m = String(s || '').match(AGO);
  if (!m) return null;
  const n = /^\d+$/.test(m[1]) ? Number(m[1]) : 1;
  return n * UNIT_DAYS[m[2].toLowerCase()];
}

export function readProfile({ overview = '', reviews = '', website = '' }, { expectedCampaign = null } = {}) {
  const r = {};
  const rating = overview.match(/(?:^|\n)\s*([1-5][.,]\d)\s*(?:\n|\(|\s)/);
  r.rating = rating ? Number(rating[1].replace(',', '.')) : null;
  const count = overview.match(/\(([\d,]+)\)/) || overview.match(/([\d,]+)\s+reviews/i);
  r.reviews = count ? Number(count[1].replace(/,/g, '')) : 0;

  // a review date is an "... ago" line that is not the owner's reply (that one sits on or right after "Response from the owner")
  const lines = reviews.split('\n');
  let replies = 0; const reviewAges = [];
  lines.forEach((ln, i) => {
    const owner = /Response from the owner/i.test(ln) || /Response from the owner/i.test(lines[i - 1] || '');
    if (/Response from the owner/i.test(ln)) replies += 1;
    if (AGO.test(ln) && !owner) reviewAges.push(daysAgo(ln));
  });
  r.lastReviewDays = reviewAges.length ? Math.min(...reviewAges) : null;
  r.reviewsRead = reviewAges.length;
  r.replyRate = reviewAges.length ? Math.min(1, replies / reviewAges.length) : null;
  r.claimed = !/claim this business|own this business\?/i.test(overview);
  const updates = overview.match(/(?:Updates|From the owner)[\s\S]{0,400}/i);
  r.lastPostDays = updates ? daysAgo(updates[0]) : null;

  // website link: is it tracked, and with the campaign this location should use?
  r.website = website || null;
  r.websiteIssues = [];
  if (website) {
    let u = null; try { u = new URL(website); } catch { r.websiteIssues.push('invalid URL'); }
    if (u) {
      const campaign = u.searchParams.get('utm_campaign');
      if (!campaign) r.websiteIssues.push('no UTM tracking');
      else if (expectedCampaign && campaign !== expectedCampaign) r.websiteIssues.push(`UTM campaign is "${campaign}", expected "${expectedCampaign}"`);
      if (u.pathname === '/' || u.pathname === '') r.websiteIssues.push('points to the home page, not a location page');
    }
  } else r.websiteIssues.push('no website');
  return r;
}

/** Concrete gaps to fix, in priority order. */
export function gaps(p, { staleReviewDays = 90, stalePostDays = 30 } = {}) {
  const out = [];
  if (!p.claimed) out.push('Profile not claimed');
  if (p.reviews < 10) out.push(`Only ${p.reviews} reviews`);
  if (p.lastReviewDays === null || p.lastReviewDays > staleReviewDays) out.push('No recent reviews');
  if (p.replyRate !== null && p.replyRate < 0.5) out.push(`Owner replies to ${Math.round(p.replyRate * 100)}% of reviews`);
  if (p.lastPostDays === null || p.lastPostDays > stalePostDays) out.push('No recent posts');
  out.push(...p.websiteIssues.map((w) => `Website link: ${w}`));
  return out;
}
