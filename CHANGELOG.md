# @taskade/temporal-parser

## 1.1.0

### Minor Changes

- c557ac0: feat: Add support for BC dates (negative years in ISO 8601)

  Implement parsing and stringification of BC dates using ISO 8601 extended year format with negative year numbers. This follows the astronomical year numbering system where year 0 = 1 BC, year -1 = 2 BC, etc.

  **Key features:**
  - Parse BC dates with negative year notation: `-0044-03-15` (44 BC)
  - Support year 0 representing 1 BC: `0000-01-01`
  - Handle BC dates with time and timezone components
  - Proper year padding in output: `-0044`, `-0001`
  - Full round-trip compatibility

  **Supported formats:**
  - BC year only: `-0100`
  - BC year-month: `-0753-04`
  - BC full date: `-0044-03-15`
  - BC datetime: `-0044-03-15T12:00:00`
  - BC with timezone: `-0044-03-15T12:00:00Z`

  **Examples:**

  ```typescript
  // Parse the Ides of March, 44 BC
  const bcDate = parseTemporal("-0044-03-15");
  // { kind: 'DateTime', date: { year: -44, month: 3, day: 15 }, ... }

  // Stringify BC date
  stringifyDate({ kind: "Date", year: -44, month: 3, day: 15 });
  // Returns: '-0044-03-15'

  // Year 0 represents 1 BC in ISO 8601
  parseTemporal("0000-01-01");
  // { kind: 'DateTime', date: { year: 0, month: 1, day: 1 }, ... }
  ```

  This implementation maintains full backward compatibility and follows ISO 8601:2004 extended year format specification.

- 7223124: feat: add comprehensive stringify API for AST serialization

  Add comprehensive stringify API for AST serialization. Implements full round-trip serialization support by converting parsed temporal ASTs back to ISO 8601/IXDTF formatted strings.

  **New exports:**
  - `stringifyTemporal()` - Main function for all temporal types
  - `stringifyDate()`, `stringifyTime()`, `stringifyDateTime()` - DateTime components
  - `stringifyDuration()`, `stringifyRange()` - Duration and Range types
  - `stringifyOffset()`, `stringifyTimeZone()`, `stringifyAnnotation()` - Supporting components

  **Features:**
  - Automatic normalization of offsets to canonical format (±HH:MM)
  - Component-based reconstruction for consistent output
  - Full round-trip compatibility with parser
  - Preserves all AST information including annotations and critical flags

  **Example:**

  ```typescript
  import { parseTemporal, stringifyTemporal } from "@taskade/temporal-parser";

  const ast = parseTemporal("2025-01-12T10:00:00+0530"); // Compact format
  const normalized = stringifyTemporal(ast);
  // '2025-01-12T10:00:00+05:30' (canonical format)
  ```

### Patch Changes

- 692b0f7: fix: Support comma as decimal separator in fractional seconds (European format)

  Add support for comma (`,`) as a decimal separator in fractional seconds for both time and duration components, as specified in ISO 8601. This enables parsing of European-formatted temporal strings while maintaining canonical dot (`.`) notation in serialized output.

  **Supported formats:**
  - Time with fractional seconds: `T10:30:45,123` → `T10:30:45.123`
  - Duration with fractional seconds: `PT1,5S` → `PT1.5S`

  **Behavior:**
  - Parser accepts both `.` and `,` as decimal separators
  - Stringify normalizes all output to use `.` for consistency
  - Full round-trip compatibility maintained

  This change improves ISO 8601 compliance and enables parsing of temporal strings from European locales where comma is the standard decimal separator.

## 1.0.5

### Patch Changes

- 60b71d8: Enable npm provenance for trusted publishing. Adds NPM_CONFIG_PROVENANCE flag to use OIDC authentication instead of long-lived tokens.

## 1.0.4

### Patch Changes

- eb78e97: build(ci): pass GITHUB_TOKEN token to changesets release action
- 792e265: build(ci): Allow publishing to GitHub Packages by removing the hard-coded npmjs registry from `publishConfig`.

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
