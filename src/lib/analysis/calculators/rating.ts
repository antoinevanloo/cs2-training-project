/**
 * Calculate HLTV 2.0 Rating
 * This is a simplified approximation of the HLTV rating formula
 */
export interface RatingInput {
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  kast: number;
  totalRounds: number;
}

export function calculateRating(input: RatingInput): number {
  const { kills, deaths, assists, adr, kast, totalRounds } = input;

  if (totalRounds === 0) return 1.0;

  // Calculate per-round stats
  const kpr = kills / totalRounds;
  const dpr = deaths / totalRounds;
  const apr = assists / totalRounds;

  // Impact rating component (simplified)
  const impact = 2.13 * kpr + 0.42 * apr - 0.41;

  // Kill rating component
  const killRating = kpr / 0.679; // Average KPR at 1.0 rating

  // Survival rating component
  const survivalRating = (totalRounds - deaths) / totalRounds / 0.317;

  // KAST rating component
  const kastRating = (kast / 100) / 0.7; // Average KAST is ~70%

  // ADR rating component
  const adrRating = adr / 80; // Average ADR at 1.0 rating

  // Combine components with weights
  const rating =
    0.0073 * kast +
    0.3591 * kpr +
    -0.5329 * dpr +
    0.2372 * impact +
    0.0032 * adr +
    0.1587;

  // Clamp to reasonable range
  return Math.max(0, Math.min(3, rating));
}

/**
 * Calculate simplified rating for quick estimates
 */
export function calculateSimpleRating(
  kills: number,
  deaths: number,
  assists: number,
  rounds: number
): number {
  if (rounds === 0) return 1.0;

  const kd = deaths > 0 ? kills / deaths : kills;
  const kpr = kills / rounds;
  const apr = assists / rounds;

  // Simplified formula
  const rating = 0.5 * kd + 0.3 * (kpr * 10) + 0.2 * (apr * 10);

  return Math.max(0.3, Math.min(2.5, rating));
}
