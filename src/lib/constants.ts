export const RECOMMENDATION_CONFIG = {
  // TBD: minimum acceptable contextual fit, expressed as maximum allowed distance.
  // Valid Strategy V1 distance range is 0-32. No default is set on purpose;
  // this must be calibrated against a small test dataset before launch.
  minAllowedDistance: null as number | null,

  // TBD: Surprise Me candidate pool size and its ranking/randomization logic
  // are unvalidated hypotheses. 10 is the example value from TECH_SPEC §15,
  // kept configurable until calibration; do not treat it as a final product decision.
  surprisePoolSize: 10 as number | null,

  // Runtime boundaries (minutes), mutually exclusive buckets per product
  // decision (2026-09): under_90 <= 89, 90_to_120 = 90..120, over_120 >= 121.
  // A runtime belongs to exactly one bucket.
  timeBoundaries: {
    under_90: { min: 1, max: 89 },
    "90_to_120": { min: 90, max: 120 },
    over_120: { min: 121 },
  } as const,
} as const;
