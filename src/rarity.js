/**
 * Trading-card rarity, derived from the overall level. This is the "foil"
 * layer: it decides how flashy the card looks (star count, tier badge, holo
 * intensity) without changing any underlying score.
 */

export const RARITY_TIERS = [
  { id: 'SSR', minLevel: 75, stars: 5, ja: '至高', en: 'Mythic', holo: 1.0 },
  { id: 'SR', minLevel: 55, stars: 4, ja: '超希少', en: 'Ultra Rare', holo: 0.7 },
  { id: 'R', minLevel: 35, stars: 3, ja: '希少', en: 'Rare', holo: 0.45 },
  { id: 'UC', minLevel: 18, stars: 2, ja: '良質', en: 'Uncommon', holo: 0.25 },
  { id: 'N', minLevel: 0, stars: 1, ja: '標準', en: 'Common', holo: 0.12 },
];

/** Resolve rarity from a level (1–99). Returns a RARITY_TIERS entry. */
export function resolveRarity(level) {
  return RARITY_TIERS.find((t) => level >= t.minLevel) ?? RARITY_TIERS[RARITY_TIERS.length - 1];
}
