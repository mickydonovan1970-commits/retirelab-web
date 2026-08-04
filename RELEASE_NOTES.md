# RetireLab Release 7.1.2 — Roadmap Shortfall Fix

## Fixed
The Roadmap shortfall engine referenced its cumulative unfunded balance before that balance had been initialised. This caused every Roadmap refresh to fail with a generic model-input alert.

The cumulative unfunded balance is now initialised to zero at the start of each Roadmap calculation. Median Market and Example Lifetime can both be calculated normally, including the signed below-zero chart behaviour introduced in 7.1.1.
