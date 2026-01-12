---
"@taskade/temporal-parser": patch
---

build(ci): Fix GitHub Packages publish workflow to use correct registry. Previously, the GitHub Packages publish step was attempting to publish to npm registry instead of GitHub Packages registry. This adds the explicit `--registry` flag to ensure packages are published to the correct location.
