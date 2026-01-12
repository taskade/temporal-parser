---
'@taskade/temporal-parser': minor
---

feat: Add support for BC dates (negative years in ISO 8601)

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
const bcDate = parseTemporal('-0044-03-15');
// { kind: 'DateTime', date: { year: -44, month: 3, day: 15 }, ... }

// Stringify BC date
stringifyDate({ kind: 'Date', year: -44, month: 3, day: 15 });
// Returns: '-0044-03-15'

// Year 0 represents 1 BC in ISO 8601
parseTemporal('0000-01-01');
// { kind: 'DateTime', date: { year: 0, month: 1, day: 1 }, ... }
```

This implementation maintains full backward compatibility and follows ISO 8601:2004 extended year format specification.
