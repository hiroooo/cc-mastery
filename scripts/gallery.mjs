#!/usr/bin/env node
/**
 * Generate the rarity-tiers showcase (docs/rarity-tiers.png source).
 * Renders one representative card per tier with equal axis values (so the
 * radar is a clean pentagon and only the color theme differs), writes an HTML
 * gallery to stdout. Open it and screenshot for the README asset.
 *
 *   node scripts/gallery.mjs > gallery.html
 */
import { renderCardSvg } from '../src/render/card-svg.js';
import { resolveTitle } from '../src/titles.js';
import { makeT } from '../src/i18n.js';
import { RARITY_TIERS, resolveRarity } from '../src/rarity.js';

const t = makeT('ja');
const REP_LEVEL = { SSR: 88, SR: 64, R: 46, UC: 27, N: 10 };

const cards = RARITY_TIERS.map((tier, idx) => {
  const lv = REP_LEVEL[tier.id];
  const axisVal = Math.round(Math.min(96, 30 + lv * 0.7));
  const axes = ['改造', 'エージェント化', '自動化', 'PDCA', '稼働量'].map((ja, i) => ({
    key: `k${i}`, ja, en: 'A', score: axisVal, breakdown: [],
  }));
  const s = {
    axes, total: axisVal, level: lv,
    deviation: Math.round(50 + (10 * (axisVal - 35)) / 15),
    rarity: resolveRarity(lv),
  };
  const hi = idx === 0 ? 99 : RARITY_TIERS[idx - 1].minLevel - 1;
  const stats = [
    { label: 'スキル', value: 80 }, { label: 'エージェント', value: 23 },
    { label: 'フック', value: 10 }, { label: 'セッション', value: 340 },
    { label: '稼働日数', value: 29 }, { label: 'メモリー', value: 998 },
  ];
  return `<figure><figcaption><b>${tier.id}</b> ${tier.ja} · <span>Lv ${tier.minLevel}–${hi}</span></figcaption>${renderCardSvg({ score: s, title: resolveTitle(s), stats, lang: 'ja', t, generatedAt: '2026-07-10' })}</figure>`;
}).join('');

process.stdout.write(`<!doctype html><meta charset=utf8><style>
body{background:radial-gradient(900px 500px at 50% -80px,#141a30,#05070d 60%);margin:0;padding:40px 24px 60px;font-family:system-ui,'Hiragino Sans',sans-serif}
h1{color:#f0e6cf;text-align:center;letter-spacing:3px;font-size:22px;margin:0 0 6px}
.sub{color:#8b90a8;text-align:center;font-size:14px;margin:0 0 34px}
.grid{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:1fr;gap:30px}
figure{margin:0}figcaption{color:#cfd6e6;font-size:15px;margin-bottom:10px;letter-spacing:1px}
figcaption b{color:#f4d27a;font-size:17px}figcaption span{color:#8b90a8}
svg{width:100%;height:auto;border-radius:14px;box-shadow:0 18px 60px rgba(0,0,0,.55)}
</style><body><h1>RARITY TIERS ／ レア度一覧</h1><p class="sub">レベルが上がるほどカードの色とホロが派手に。★とフレームの金属色で段階がひと目でわかる。</p><div class="grid">${cards}</div></body>`);
