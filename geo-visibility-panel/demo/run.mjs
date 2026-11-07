// Demo on fictional data: analyze this month's answers and compare with last month.
// The "model" field stands in for the local LLM's extraction, including one invented name
// ("Crystal Bay Installers") that the verifier must reject.
import { readFileSync } from 'node:fs';
import { createAnalyzer, shareOfVoice } from '../src/analyzer.mjs';

const here = new URL('.', import.meta.url);
const brand = JSON.parse(readFileSync(new URL('brand.json', here)));
const data = JSON.parse(readFileSync(new URL('answers.json', here)));

const rows = [];
for (const a of data.current) {
  const q = data.questions.find((x) => x.n === a.n);
  const analyzer = createAnalyzer(brand, { extract: async () => a.model });
  const r = await analyzer.analyze({ text: a.text, links: a.links }, q.text);
  rows.push({ ...r, n: a.n, platform: a.platform });
  console.log(`Q${a.n} ${a.platform.padEnd(10)} mentioned=${r.mentioned} position=${r.position ?? '-'} competitors=[${r.competitors.join(', ')}] directories=[${r.directories.join(', ')}] sources=[${r.sources.join(', ')}]${r.notes.length ? ' | ' + r.notes.join('; ') : ''}`);
}
const sov = shareOfVoice(rows, data.previous);
const pct = (x) => (x === null ? 'n/a' : `${Math.round(x * 100)}%`);
console.log(`\nShare of voice: ${pct(sov.overall)} (last month ${pct(sov.previous)})`);
for (const p of sov.byPlatform) console.log(`  ${p.platform.padEnd(10)} ${pct(p.share)} (last month ${pct(p.previous)})`);
console.log(`Most cited competitors: ${sov.topCompetitors.map(([c, n]) => `${c} (${n})`).join(', ')}`);
