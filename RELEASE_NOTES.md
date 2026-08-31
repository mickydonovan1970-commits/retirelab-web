# RetireLab Release 7.1.9 — Optimiser Constraint Fix

## Fixed

- Fixed an optimiser edge case where the **current portfolio** could remain the suggested allocation even when it breached the entered **Maximum allocation to any one fund**.
- The current portfolio is still used as the comparison benchmark, but all optimiser candidates now begin from a constraint-compliant allocation.
- Cash optimisation now also uses that constraint-compliant allocation rather than an over-cap current mix.
- Added a final defensive validation before displaying a recommendation so a suggested fund weight cannot exceed the entered concentration cap.

### Example fixed

A current 75% / 25% two-fund allocation with a 40% maximum may still appear as **75% current** (correctly describing the portfolio), but **Suggested** will now be constructed only from allocations in which no fund exceeds 40%.

No Monte Carlo assumptions, objective scoring weights, fund-library assumptions, or portfolio data have been changed in this release.
