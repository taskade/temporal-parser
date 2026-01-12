# Temporal Parser

A lexer and parser for ISO 8601, RFC 3339, and IXDTF temporal expressions, built with compiler design principles.

## Features

- **Standards compliant**: ISO 8601, RFC 3339, and IXDTF support
- **Extensible architecture**: Exposed lexer allows custom parser implementations
- **Zero dependencies**: No external runtime dependencies
- **Type-safe**: Written in TypeScript with full type definitions
- **Small footprint**: ~18KB minified
- **Dual module support**: ESM and CommonJS builds
- **Well tested**: 91% test coverage with 271 test cases

## Installation

```bash
npm install @taskade/temporal-parser
```

## Quick Start

```typescript
import { parseTemporal } from '@taskade/temporal-parser';

// Parse a complete datetime with timezone
const result = parseTemporal('2025-01-12T10:00:00+08:00[Asia/Singapore]');
console.log(result);
// {
//   kind: 'DateTime',
//   date: { kind: 'Date', year: 2025, month: 1, day: 12 },
//   time: { kind: 'Time', hour: 10, minute: 0, second: 0 },
//   offset: { kind: 'NumericOffset', sign: '+', hours: 8, minutes: 0, raw: '+08:00' },
//   timeZone: { kind: 'IanaTimeZone', id: 'Asia/Singapore', critical: false },
//   annotations: []
// }

// Parse a duration
const duration = parseTemporal('P1Y2M3DT4H5M6S');
// { kind: 'Duration', years: 1, months: 2, days: 3, hours: 4, minutes: 5, seconds: 6, ... }

// Parse a date range
const range = parseTemporal('2025-01-01/2025-12-31');
// { kind: 'Range', start: {...}, end: {...} }
```

## Supported Formats

### Dates
- Year: `2025`
- Year-Month: `2025-01`
- Full date: `2025-01-12`

### Times
- Hour-Minute: `T10:30`
- With seconds: `T10:30:45`
- With fractional seconds: `T10:30:45.123456789`
- European format (comma): `T10:30:45,123` (normalized to dot in output)

### Timezones
- UTC: `Z`
- Numeric offset: `+08:00`, `-05:30`, `+0530`, `+09`
- IANA timezone: `[Asia/Singapore]`, `[America/New_York]`

### Durations
- Date parts: `P1Y2M3D` (1 year, 2 months, 3 days)
- Time parts: `PT4H5M6S` (4 hours, 5 minutes, 6 seconds)
- Combined: `P1Y2M3DT4H5M6S`
- Fractional seconds: `PT1.5S` or `PT1,5S` (comma normalized to dot)

### IXDTF Annotations
- Calendar: `[u-ca=gregory]`
- Critical flags: `[!u-ca=iso8601]`
- Multiple annotations: `2025-01-12[u-ca=gregory][u-tz=UTC]`

### Ranges
- Closed: `2025-01-01/2025-12-31`
- Open start: `/2025-12-31`
- Open end: `2025-01-01/`
- Duration-based: `2025-01-01/P1Y`

## Advanced Usage

### Using the Lexer

```typescript
import { lexTemporal, combineTimezoneOffsets } from '@taskade/temporal-parser';

// Tokenize a temporal string
const tokens = lexTemporal('2025-01-12T10:00:00+08:00');

// Optionally combine timezone offset tokens
const combined = combineTimezoneOffsets(tokens);
```

### Standalone Offset Parser

```typescript
import { parseOffset } from '@taskade/temporal-parser';

const offset = parseOffset('+08:00');
// { kind: 'NumericOffset', sign: '+', hours: 8, minutes: 0, raw: '+08:00' }
```

### Stringify AST Back to String

```typescript
import { parseTemporal, stringifyTemporal } from '@taskade/temporal-parser';

// Parse and stringify
const ast = parseTemporal('2025-01-12T10:00:00+08:00[Asia/Singapore]');
const str = stringifyTemporal(ast);
// '2025-01-12T10:00:00+08:00[Asia/Singapore]'

// Offsets are normalized to canonical format (±HH:MM)
const ast2 = parseTemporal('2025-01-12T10:00:00+0530'); // Compact format
const str2 = stringifyTemporal(ast2);
// '2025-01-12T10:00:00+05:30' (normalized)

// Stringify individual components
import { stringifyDate, stringifyTime, stringifyDuration } from '@taskade/temporal-parser';

stringifyDate({ kind: 'Date', year: 2025, month: 1, day: 12 });
// '2025-01-12'

stringifyTime({ kind: 'Time', hour: 10, minute: 30, second: 45 });
// '10:30:45'

stringifyDuration({ kind: 'Duration', years: 1, months: 2, raw: 'P1Y2M', annotations: [] });
// 'P1Y2M'
```

## Motivation

Time is one of the most complex human inventions.
Leap years, calendars, time zones, daylight saving rules, cultural conventions—every attempt to model time exposes exceptions and edge cases. Even today, we still struggle to write correct and maintainable code for something as fundamental as dates and times.

Despite its wide adoption, ISO 8601 / RFC 3339 is incomplete. It lacks proper support for time zones beyond numeric offsets, forcing real-world systems to rely on extensions such as IXDTF (inspired by Java's ZonedDateTime). Unfortunately, only very recent tools—and the latest generation of LLMs—have begun to meaningfully understand these formats.

In JavaScript and TypeScript, temporal parsing remains especially difficult. No single data structure can fully represent time. Instead, we are left with a wide variety of string representations, each with different semantics and assumptions.

Even the TC39 community explicitly chose not to fully solve parsing when designing the Temporal API, acknowledging the scope and complexity of the problem.
(See: https://tc39.es/proposal-temporal/docs/parse-draft.html)

And yet, time remains one of the most important concepts for human productivity and coordination.

This project tackles the problem head-on.

## Approach

This repository treats temporal parsing as a compiler problem.

Instead of relying on fragile regexes or opinionated parsers, we apply classic compiler techniques—lexing and parsing—to temporal strings. Our goal is not to impose a single "correct" interpretation of time, but to make the structure of temporal expressions explicit and programmable.

What makes this project different is that we intentionally expose the lexer.
- The lexer is designed to be generic and logic-light
- It focuses on turning temporal strings into a meaningful token stream
- Parsers are built on top of this lexer to interpret tokens into higher-level structures

If the provided parser does not match your needs, you are free to:
- Write your own parser
- Extend or replace parts of the grammar
- Apply your own semantics to the same token stream

In other words, this project does not claim to "solve time."
It gives you the tools to reason about it.

## API Reference

### `parseTemporal(input: string): TemporalAst`

Main parser function that accepts an ISO 8601 / IXDTF string and returns an AST.

**Returns:** One of:
- `DateTimeAst` - A datetime value with optional timezone and annotations
- `DurationAst` - A duration value (P...)
- `RangeAst` - A range between two values

**Throws:** `ParseError` if the input is invalid.

### `lexTemporal(input: string): Token[]`

Tokenizes the input string into a stream of tokens.

### `combineTimezoneOffsets(tokens: Token[]): AnyToken[]`

Post-processes tokens to combine timezone offset components into single tokens.

### `parseOffset(offsetString: string, position?: number): OffsetAst`

Parses a numeric timezone offset string.

**Supported formats:**
- Standard: `+08:00`, `-05:30`
- Compact: `+0530`, `-0800`
- Short: `+09`, `-05`

**Valid ranges:**
- Hours: 0-14 (UTC-12:00 to UTC+14:00)
- Minutes: 0-59

### `stringifyTemporal(ast: TemporalAst): string`

Converts a temporal AST back to its string representation.

**Returns:** ISO 8601 / IXDTF formatted string

**Also available:**
- `stringifyDate(date: DateAst): string`
- `stringifyTime(time: TimeAst): string`
- `stringifyDateTime(dateTime: DateTimeAst): string`
- `stringifyDuration(duration: DurationAst): string`
- `stringifyRange(range: RangeAst): string`
- `stringifyOffset(offset: OffsetAst): string`
- `stringifyTimeZone(timeZone: TimeZoneAst): string`
- `stringifyAnnotation(annotation: AnnotationAst): string`

## TypeScript Support

Full TypeScript definitions are included. All AST types are exported:

```typescript
import type {
  TemporalAst,
  DateTimeAst,
  DurationAst,
  RangeAst,
  DateAst,
  TimeAst,
  OffsetAst,
  TimeZoneAst,
  AnnotationAst,
} from '@taskade/temporal-parser';
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## Development

This project was developed with LLM assistance (GPT 5.2/Claude Sonnet 4.5), under human direction for design decisions, architecture, and verification. All code is tested and reviewed on a best-effort basis.

## License

MIT © [Taskade](https://taskade.com)
