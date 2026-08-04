# RetireLab Release 7.1.1 — Unfunded Plan Balance

## Engine
- Investment funds and Bridge Cash remain floored at zero.
- Any spending that cannot be funded is accumulated separately as an unfunded plan balance.
- Later unmet spending increases that balance.
- Later income surpluses repay the unfunded balance before rebuilding cash.
- Market returns cannot make a depleted plan appear to recover.

## Results charts
- Wealth percentiles can now continue below zero.
- Negative sections are drawn in red.
- A dashed red zero/depletion line is shown.
- Negative values represent cumulative unmet expenditure, not negative fund holdings.

## Roadmap
- Median Market and Example Lifetime charts use the same signed plan-balance logic.
- The line turns red below zero.
- Tooltips distinguish remaining investments from cumulative unfunded expenditure.
- Year Start Financial Actions explicitly show any expenditure that cannot be funded.
- Step 4 adds an Unfunded plan balance row when required.
