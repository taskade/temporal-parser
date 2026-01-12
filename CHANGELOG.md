# @taskade/temporal-parser

## 1.0.3

### Patch Changes

- cf18396: build(ci): Allow publishing to GitHub Packages by removing the hard-coded npmjs registry from `publishConfig`.

## 1.0.2

### Patch Changes

- 14c6355: build(ci): Fix GitHub Packages publish by skipping prepublishOnly script. The publish workflow now uses --ignore-scripts flag to prevent duplicate builds and avoid registry configuration conflicts.

## 1.0.1

### Patch Changes

- 7e2bb77: docs: add CHANGELOG.md with 1.0.0 release notes
- 5165f82: build(ci): Fix GitHub Packages publish workflow to use correct registry. Previously, the GitHub Packages publish step was attempting to publish to npm registry instead of GitHub Packages registry. This adds the explicit `--registry` flag to ensure packages are published to the correct location.

## 1.0.0

### Major Changes

- Initial release of temporal parser with comprehensive ISO 8601, RFC 3339, and IXDTF support

  **Features:**
  - Lexer-based tokenization for temporal strings
  - Recursive-descent parser with extensible architecture
  - Support for dates, times, timezones, durations, and ranges
  - IXDTF annotations and bracket extensions
  - Zero runtime dependencies
  - Full TypeScript support with strict mode
  - 91% test coverage with 271 test cases

  **Supported Formats:**
  - Dates: `2025`, `2025-01`, `2025-01-12`
  - Times: `T10:30`, `T10:30:45`, `T10:30:45.123456789`
  - Timezones: `Z`, `+08:00`, `-05:30`, `[Asia/Singapore]`
  - Durations: `P1Y2M3D`, `PT4H5M6S`, `P1Y2M3DT4H5M6S`
  - Ranges: `2025-01-01/2025-12-31`, `/2025-12-31`, `2025-01-01/`
  - Annotations: `[u-ca=gregory]`, `[!u-ca=iso8601]`

  **Standards Compliance:**
  - ISO 8601 date/time formats
  - RFC 3339 timezone semantics (Z vs +00:00 vs -00:00)
  - IXDTF extensions for calendar and timezone annotations
  - Correct timezone offset range (UTC-12:00 to UTC+14:00)
