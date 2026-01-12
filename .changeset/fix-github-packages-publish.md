---
"@taskade/temporal-parser": patch
---

build(ci): Fix GitHub Packages publish by skipping prepublishOnly script. The publish workflow now uses --ignore-scripts flag to prevent duplicate builds and avoid registry configuration conflicts.
