---
'@taskade/temporal-parser': minor
---

feat: add comprehensive stringify API for AST serialization

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
import { parseTemporal, stringifyTemporal } from '@taskade/temporal-parser';

const ast = parseTemporal('2025-01-12T10:00:00+0530'); // Compact format
const normalized = stringifyTemporal(ast);
// '2025-01-12T10:00:00+05:30' (canonical format)
```
