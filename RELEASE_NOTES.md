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
