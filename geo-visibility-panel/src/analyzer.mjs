// Reads one AI answer and turns it into a row: is the brand there, in what position, which
// competitors and directories appear, which sources are cited.
//
// Detection is deterministic (regex and domain matching). An optional local LLM extracts the
// list of businesses an answer recommends, but its output is only accepted for names that
// appear literally in the answer: the model proposes, the code verifies. A name the model
// invents never reaches the report.

export const normalize = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const containsPhrase = (text, phrase) => new RegExp(`(^|[^a-z0-9])${escapeRe(phrase)}($|[^a-z0-9])`).test(text);
export function host(url) { try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; } }

export function createAnalyzer(brand, { extract = null } = {}) {
  const detector = new RegExp(brand.detector, 'i');
  const competitors = brand.competitors.map((c) => ({ name: c.name, variants: c.variants.map(normalize) }));
  const directories = brand.directories.map((d) => ({ name: d.name, domains: d.domains, texts: d.texts.map(normalize) }));
  const directoryNames = directories.flatMap((d) => [normalize(d.name), ...d.texts]);
  const isBrand = (s) => detector.test(normalize(s));
  const onDomain = (url, domain) => { const h = host(url); return h === domain || h.endsWith(`.${domain}`); };

  const competitorsIn = (text) => {
    const t = normalize(text);
    return competitors.filter((c) => c.variants.some((v) => containsPhrase(t, v))).map((c) => c.name);
  };
  const directoriesIn = (text, urls) => {
    const t = normalize(text);
    return directories
      .filter((d) => urls.some((u) => d.domains.some((dom) => onDomain(u, dom))) || d.texts.some((x) => containsPhrase(t, x)))
      .map((d) => d.name);
  };

  /** Keep only names that appear literally in the text and are not directories. */
  function keepPresent(list, text) {
    const t = normalize(text);
    const out = []; const seen = new Set();
    for (const raw of Array.isArray(list) ? list : []) {
      if (typeof raw !== 'string') continue;
      const name = raw.replace(/\s+/g, ' ').replace(/^[-*•\d.)\s]+/, '').trim();
      const n = normalize(name);
      if (n.length < 3 || seen.has(n) || !t.includes(n)) continue;
      if (directoryNames.some((d) => n === d || n.includes(d))) continue;
      seen.add(n); out.push(name);
    }
    return out;
  }

  /** Fallback position without the model: order of first appearance among brand and known competitors. */
  function approximatePosition(text) {
    const t = normalize(text);
    const hits = [];
    const b = detector.exec(t); if (b) hits.push({ brand: true, at: b.index });
    for (const c of competitors) {
      const idx = c.variants.map((v) => t.search(new RegExp(`(^|[^a-z0-9])${escapeRe(v)}($|[^a-z0-9])`))).filter((i) => i >= 0);
      if (idx.length) hits.push({ brand: false, at: Math.min(...idx) });
    }
    hits.sort((a, b2) => a.at - b2.at);
    const i = hits.findIndex((h) => h.brand);
    return i >= 0 ? i + 1 : null;
  }

  async function analyze({ text = '', links = [] }, question) {
    const urls = [...new Set(links)];
    const brandUrl = urls.find((u) => onDomain(u, brand.domain)) || null;
    const mentioned = isBrand(text) || Boolean(brandUrl);
    const notes = [];
    let businesses = null;
    if (extract && text.trim()) {
      const proposed = await extract(question, text); // e.g. a local model returning a JSON list
      if (proposed) {
        businesses = keepPresent(proposed, text);
        const rejected = proposed.filter((p) => !businesses.includes(p));
        if (rejected.length) notes.push(`rejected (not in the answer): ${rejected.join(', ')}`);
      }
    }
    let position = null;
    if (businesses) { const i = businesses.findIndex(isBrand); position = i >= 0 ? i + 1 : null; }
    else if (mentioned) { position = approximatePosition(text); notes.push('approximate position (no model)'); }
    return {
      mentioned, position, brandUrl,
      competitors: competitorsIn(text),
      directories: directoriesIn(text, urls),
      sources: [...new Set(urls.map(host).filter(Boolean))],
      notes,
    };
  }

  return { analyze, keepPresent, approximatePosition };
}

/** Share of answers that mention the brand, overall and per platform, plus month-over-month change. */
export function shareOfVoice(rows, previousRows = null) {
  const share = (list) => (list.length ? list.filter((r) => r.mentioned).length / list.length : null);
  const platforms = [...new Set(rows.map((r) => r.platform))];
  const prev = previousRows || [];
  return {
    overall: share(rows),
    previous: previousRows ? share(prev) : null,
    byPlatform: platforms.map((p) => ({
      platform: p,
      share: share(rows.filter((r) => r.platform === p)),
      previous: previousRows ? share(prev.filter((r) => r.platform === p)) : null,
    })),
    topCompetitors: Object.entries(rows.flatMap((r) => r.competitors).reduce((acc, c) => ({ ...acc, [c]: (acc[c] || 0) + 1 }), {}))
      .sort((a, b) => b[1] - a[1]).slice(0, 5),
  };
}
