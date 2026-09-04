export const RECOMMENDATION_CONFIG = {
  // TBD: minimum acceptable contextual fit, expressed as maximum allowed distance.
  // Valid Strategy V1 distance range is 0-32. No default is set on purpose;
  // this must be calibrated against a small test dataset before launch.
  minAllowedDistance: null as number | null,

  // TBD: Surprise Me candidate pool size and its ranking/randomization logic
  // are unvalidated hypotheses. 10 is the example value from TECH_SPEC §15,
  // kept configurable until calibration; do not treat it as a final product decision.
  surprisePoolSize: 10 as number | null,

  // Inclusive runtime boundaries (minutes) per RECOMMENDATION_SPEC.md §4.
  timeBoundaries: {
    under_90: { max: 89 },
    "90_to_120": { min: 90, max: 120 },
    over_120: { min: 120 },
  } as const,
} as const;
