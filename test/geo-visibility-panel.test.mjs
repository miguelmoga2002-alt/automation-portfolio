import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAnalyzer, shareOfVoice } from '../geo-visibility-panel/src/analyzer.mjs';

const brand = {
  domain: 'northwindwindows.example', detector: 'northwind\\s*windows',
  competitors: [{ name: 'Harbor Glazing', variants: ['harbor glazing'] }],
  directories: [{ name: 'TradeFinder', domains: ['tradefinder.example'], texts: ['tradefinder'] }],
};

test('a business the model invents is rejected', async () => {
  const a = createAnalyzer(brand, { extract: async () => ['Harbor Glazing', 'Invented Co', 'Northwind Windows'] });
  const r = await a.analyze({ text: 'Try Harbor Glazing or Northwind Windows.' }, 'q');
  assert.equal(r.position, 2);
  assert.match(r.notes.join(), /Invented Co/);
});

test('directories are not counted as businesses', () => {
  const a = createAnalyzer(brand);
  assert.deepEqual(a.keepPresent(['TradeFinder', 'Harbor Glazing'], 'Harbor Glazing on TradeFinder'), ['Harbor Glazing']);
});

test('a link to the brand site counts as a mention; accents and case do not matter', async () => {
  const a = createAnalyzer(brand);
  const r1 = await a.analyze({ text: 'See this guide.', links: ['https://www.northwindwindows.example/prices'] }, 'q');
  assert.equal(r1.mentioned, true);
  const r2 = await a.analyze({ text: 'NORTHWIND WÍNDOWS is good, so is Harbor Glazing' }, 'q');
  assert.equal(r2.mentioned, true);
  assert.equal(r2.position, 1);
});

test('share of voice compares with the previous month', () => {
  const s = shareOfVoice(
    [{ platform: 'A', mentioned: true, competitors: [] }, { platform: 'B', mentioned: false, competitors: ['X'] }],
    [{ platform: 'A', mentioned: false, competitors: [] }, { platform: 'B', mentioned: false, competitors: [] }],
  );
  assert.equal(s.overall, 0.5);
  assert.equal(s.previous, 0);
});
