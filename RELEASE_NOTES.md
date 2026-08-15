# RetireLab Release 7.1.7 — Import Filename Naming

## Changed
Imported projects are now named from the JSON filename rather than the project name stored inside the file.

Examples:

- `59_Plan_17k.json` → `59_Plan_17k`
- `test_project_to_delete.json` → `test_project_to_delete`

The `.json` extension is removed and no `(Imported)` suffix is added.

This makes the filename the user's explicit label for the imported copy.
