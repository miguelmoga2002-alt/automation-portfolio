// Demo on fictional data: audit three profiles (one of them our own) and list the gaps.
import { readFileSync } from 'node:fs';
import { readProfile, gaps } from '../src/signals.mjs';

const { listings } = JSON.parse(readFileSync(new URL('listings.json', import.meta.url)));
const fmt = (d) => (d === null ? 'none' : `${d} days ago`);
for (const l of listings) {
  const p = readProfile(l, { expectedCampaign: l.expectedCampaign || null });
  console.log(`\n${l.own ? '[OURS] ' : ''}${l.name}`);
  console.log(`  rating ${p.rating === null ? '-' : p.rating.toFixed(1)} from ${p.reviews} reviews | last review ${fmt(p.lastReviewDays)} | owner replies ${p.replyRate === null ? '-' : Math.round(p.replyRate * 100) + '%'} | claimed ${p.claimed ? 'yes' : 'no'} | last post ${fmt(p.lastPostDays)}`);
  for (const g of gaps(p)) console.log(`  - ${g}`);
}
