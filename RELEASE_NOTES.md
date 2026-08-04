# RetireLab Release 7.1 — Maximum Expenditure Optimiser

## Annual expenditure modes
- Enter manually
- Maximise for objective success
- Maximise for plan success

## Optimisation
- Editable required-success target, defaulting to 95%.
- Uses the selected Faster, Standard or Slower simulation population.
- Every spending trial uses the same full set of simulated market and inflation paths.
- Binary search finds the highest £50 increment meeting the target.
- The result automatically populates Annual expenditure.
- Final verification reports the achieved success rate.
- Progress feedback explains the current search stage.
- Material plan changes mark the prior optimisation as out of date.

## Important
The fixed-path approach means “the same thousands of simulated lifetimes”, not one example lifetime. It isolates the effect of changing expenditure while retaining the full Monte Carlo distribution.
