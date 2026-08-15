# RetireLab Release 7.1.4 — Project Integrity

## Fixed
Project loading no longer captures the default or outgoing screen into the destination project before that project's saved snapshot has been applied.

This fixes the lifecycle for:

- switching between projects
- browser refresh/startup
- duplicating a project
- importing an exported project
- deleting the active project and loading the replacement

## Saved with each project
The project snapshot includes:

- Objective age and minimum required wealth
- Income rows
- Annual expenditure, indexation and large expenditures
- Retirement portfolio, fund values and fund assumptions
- Bridge Cash and withdrawal strategy rules
- Expenditure optimisation mode and success target
- Accumulation settings, portfolio and latest accumulation result
- Display currency
- Simulation history and next simulation number
- Last open tab

## Additional safeguards
- Autosave is temporarily suppressed while a project snapshot is being applied.
- Imported projects receive safe defaults for optional metadata missing from older files.
- Expenditure optimiser radio controls are explicitly resynchronised after project restoration.
- Project exports capture the latest on-screen state before producing the JSON file.
