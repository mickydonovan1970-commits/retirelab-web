# RetireLab Release 6.6.1 — Saved Strategy Loading Fix

## Fixed
- **Load into RetireLab** now restores the complete saved portfolio rather than only overwriting existing fund positions.
- Dynamic Fund Library holdings, custom funds, allocations and fund assumptions are rebuilt exactly from the saved strategy.
- Income, expenditure and all basic settings are restored through the same central loader used by saved projects.
- The Fund Library, Assumptions table, portfolio statistics and diversification check refresh immediately after loading.
- RetireLab opens the Strategy page after loading so the restored holdings can be verified at once.
- The loaded strategy is written into the active project through autosave.
