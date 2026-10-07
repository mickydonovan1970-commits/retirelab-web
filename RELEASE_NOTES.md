# RetireLab Release 7.1.12 — Defensive Reserve Strategy

- Added **Use cash, then defensive reserve, then CORE** as a Weak CORE Years strategy.
- Any CORE fund can be explicitly designated as a **Defensive reserve** in the CORE allocation table.
- In a weak year, spending uses Bridge Cash first; if cash is insufficient, designated defensive funds are sold next; only then does RetireLab fall back to the selected normal CORE sale method.
- Strong-year sales and Bridge Cash refills continue to use the existing CORE sale method.
- Defensive-reserve status is stored with the fund in saved projects.
- The first version deliberately does **not** automatically rebuild the defensive reserve after recovery years.
- Existing withdrawal strategies, Monte Carlo assumptions, optimiser scoring and fund assumptions are otherwise unchanged.

# RetireLab Release 7.1.11 — Current Age State Fix

- Fixed a state-sync bug that could reset Dashboard Current Age when Starting SIPP Cash was adjusted.
- Passive accumulation handoff refreshes now preserve Dashboard Current Age.
- Explicit accumulation handoff changes can still align Current Age with the selected retirement age.
- No changes to Monte Carlo methodology, optimiser scoring, fund assumptions, or saved project data.

# RetireLab Release 7.1.10 — DGRG Fund Library Addition

## Added

- Added **WisdomTree US Quality Dividend Growth UCITS ETF** to the Fund Library.
- LSE ticker: **DGRG**
- ISIN: **IE00BZ56RG20**
- Category: **US Equity**
- Type: **US quality dividend-growth equity ETF**
- RetireLab planning defaults: **7.5% nominal return / 16.0% volatility / 0.88 correlation proxy**.
- The fund description reflects its rules-based focus on profitable, dividend-paying US companies with quality and growth characteristics and its dividend-weighted methodology.

These figures are editable planning assumptions for Monte Carlo modelling, not forecasts. No optimiser logic, existing fund assumptions, project persistence, or retirement-plan calculations have been changed.
