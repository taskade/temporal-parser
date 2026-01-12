// parseOffset.ts
// Parse timezone offset strings into structured components

import { ParseError } from './errors.js';
import { toInt } from './helpers/toInt.js';
import type { OffsetAst } from './parser-types.js';

// Timezone offset validation constants
// Per ISO 8601 and real-world usage:
// - Westernmost: UTC-12:00 (Baker Island, Howland Island)
// - Easternmost: UTC+14:00 (Line Islands, Kiritimati)
const MAX_OFFSET_HOURS = 14;
const MAX_MINUTES = 59;

/**
 * Parse a timezone offset string into structured components.
 *
 * Supports three formats:
 * - Standard: +08:00, -05:30
 * - Compact: +0530, -0800
 * - Short: +09, -05
 *
 * Valid timezone offset ranges (per ISO 8601):
 * - Hours: 0-14 (UTC-12:00 to UTC+14:00)
 * - Minutes: 0-59
 *
 * Note: This function only parses numeric offsets (e.g., +08:00).
 * For UTC, use 'Z' (UtcOffset kind) which is semantically different from +00:00.
 * Per RFC 3339 section 4.3, -00:00 indicates "local time with unknown offset".
 *
 * @param offsetString - The offset string to parse (e.g., '+08:00', '-0530', '+09')
 * @param position - Position in token stream for error reporting (optional)
 * @returns Parsed offset with sign, hours, and minutes
 * @throws {ParseError} If the offset format is invalid or out of range
 *
 * @example
 * ```typescript
 * parseOffset('+08:00') // { kind: 'NumericOffset', sign: '+', hours: 8, minutes: 0, raw: '+08:00' }
 * parseOffset('-05:30') // { kind: 'NumericOffset', sign: '-', hours: 5, minutes: 30, raw: '-05:30' }
 * parseOffset('+0530')  // { kind: 'NumericOffset', sign: '+', hours: 5, minutes: 30, raw: '+0530' }
 * parseOffset('+09')    // { kind: 'NumericOffset', sign: '+', hours: 9, minutes: 0, raw: '+09' }
 * parseOffset('+14:00') // { kind: 'NumericOffset', sign: '+', hours: 14, minutes: 0, raw: '+14:00' }
 * ```
 */
export function parseOffset(offsetString: string, position = 0): OffsetAst {
  // Validate input is not empty
  if (offsetString.length === 0) {
    throw new ParseError('Offset string cannot be empty', position);
  }

  const raw = offsetString;

  // Validate first character is sign and assert type
  const sign = raw[0];
  if (sign !== '+' && sign !== '-') {
    throw new ParseError(`Offset must start with + or -, got ${JSON.stringify(sign)}`, position);
  }
  // Type assertion: TypeScript now knows sign is '+' | '-'
  const validSign: '+' | '-' = sign;

  const rest = raw.slice(1);

  // Validate rest is not empty
  if (rest.length === 0) {
    throw new ParseError(`Offset sign must be followed by digits`, position);
  }

  let hours: number;
  let minutes: number;

  if (rest.includes(':')) {
    // Format: +08:00 or -05:30
    const parts = rest.split(':');
    if (parts.length !== 2) {
      throw new ParseError(`Invalid offset format: ${raw} (expected HH:MM)`, position);
    }
    // After length check, we know parts[0] and parts[1] exist
    const [h, m] = parts;
    hours = toInt(h!, 'offset hours', position);
    minutes = toInt(m!, 'offset minutes', position);
  } else if (rest.length === 4) {
    // Format: +0530 or -0800
    hours = toInt(rest.slice(0, 2), 'offset hours', position);
    minutes = toInt(rest.slice(2, 4), 'offset minutes', position);
  } else if (rest.length === 2) {
    // Format: +08 or -05
    hours = toInt(rest, 'offset hours', position);
    minutes = 0;
  } else {
    throw new ParseError(
      `Invalid offset format: ${raw} (expected +HH:MM, +HHMM, or +HH)`,
      position,
    );
  }

  // Validate ranges
  if (hours < 0 || hours > MAX_OFFSET_HOURS) {
    throw new ParseError(`Offset hours must be 0-${MAX_OFFSET_HOURS}, got ${hours}`, position);
  }
  if (minutes < 0 || minutes > MAX_MINUTES) {
    throw new ParseError(`Offset minutes must be 0-${MAX_MINUTES}, got ${minutes}`, position);
  }

  return { kind: 'NumericOffset', sign: validSign, hours, minutes, raw };
}
