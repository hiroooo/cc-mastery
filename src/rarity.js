/**
 * Trading-card rarity, derived from the overall level. This is the "foil"
 * layer: it decides how flashy the card looks (star count, tier badge, holo
 * intensity, AND the whole card's color theme) without changing any score.
 *
 * Each tier carries a `palette` the card renderer reads:
 *   frame  – two stops for the metallic border/plate gradient
 *   accent – the tier's signature ink (title, labels, npx line)
 *   bg     – three stops for the radial background glow
 *   holo   – rainbow foil intensity multiplier (0..1)
 */
export const RARITY_TIERS = [
  {
    id: 'SSR', minLevel: 75, stars: 5, ja: '至高', en: 'Mythic', holo: 1.0,
    palette: {
      frame: ['#7a5a14', '#fff6cc'], frameMid: '#f4d27a',
      accent: '#f4d27a', accentSoft: 'rgba(244,210,122,0.85)',
      bg: ['#2a2350', '#161a38', '#080a18'],
    },
  },
  {
    id: 'SR', minLevel: 55, stars: 4, ja: '超希少', en: 'Ultra Rare', holo: 0.68,
    palette: {
      frame: ['#5b3aa0', '#e6d4ff'], frameMid: '#b18cf0',
      accent: '#c9a9ff', accentSoft: 'rgba(201,169,255,0.85)',
      bg: ['#2c2258', '#1a1638', '#0a0818'],
    },
  },
  {
    id: 'R', minLevel: 35, stars: 3, ja: '希少', en: 'Rare', holo: 0.42,
    palette: {
      frame: ['#2f5f9e', '#cfe6ff'], frameMid: '#7fb2ee',
      accent: '#8fc0ff', accentSoft: 'rgba(143,192,255,0.85)',
      bg: ['#1a2c50', '#121d34', '#080c18'],
    },
  },
  {
    id: 'UC', minLevel: 18, stars: 2, ja: '良質', en: 'Uncommon', holo: 0.24,
    palette: {
      frame: ['#4a6a3a', '#dcf0c4'], frameMid: '#8fbf6a',
      accent: '#a6d97e', accentSoft: 'rgba(166,217,126,0.85)',
      bg: ['#1f3020', '#14201a', '#080d0a'],
    },
  },
  {
    id: 'N', minLevel: 0, stars: 1, ja: '標準', en: 'Common', holo: 0.1,
    palette: {
      frame: ['#5a6070', '#e2e6ef'], frameMid: '#aab2c4',
      accent: '#c3c9d8', accentSoft: 'rgba(195,201,216,0.85)',
      bg: ['#242938', '#181c28', '#0a0c14'],
    },
  },
];

/** Resolve rarity from a level (1–99). Returns a RARITY_TIERS entry. */
export function resolveRarity(level) {
  return RARITY_TIERS.find((t) => level >= t.minLevel) ?? RARITY_TIERS[RARITY_TIERS.length - 1];
}
