# RetireLab Release 7.1.5 — Import Name Fix

## Fixed
Importing a RetireLab project now preserves the project name stored inside the exported JSON file.

Previously each import appended `(Imported)`, so repeated export/import cycles could produce names such as:

`59+ Plan (Imported) (Imported)`

The import process is now lossless with respect to the project name:

`59+ Plan` → export → import → `59+ Plan`

The JSON filename does not replace the saved project name.
