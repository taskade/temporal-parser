---
"@taskade/temporal-parser": patch
---

Relax `engines.node` from `>=22` to `>=20` (the lowest line the Vitest 4 suite can run). CI now tests 20, 22, and 24. Node 18 is EOL and is not claimed. Docs-only: badges, playground link, and a “when to use this vs Temporal / luxon / date-fns” table. No parser or API changes.
