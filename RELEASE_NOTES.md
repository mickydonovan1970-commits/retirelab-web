# RetireLab Release 6.8.2 — Display Currency

## Added
A project-wide display currency selector on the Dashboard:

- GBP (£)
- USD ($)
- EUR (€)

## Behaviour
- Display formatting only: no exchange-rate conversion is performed.
- Inputs and results are assumed to use the selected currency consistently.
- Simulation maths, returns, volatility and percentages are unchanged.
- Currency is saved separately with each project.
- Loading an individual saved strategy does not change the project's currency.

## Coverage
The central money formatter updates monetary labels, values, result cards, saved strategies, comparisons, Roadmap instructions, charts and tooltips.
