// parseTimeString.ts
// Standalone time parser for hh:mm format with AM/PM support
// Supports both 12-hour (with AM/PM) and 24-hour international formats

import { ParseError } from './errors.js';
import { toInt } from './helpers/toInt.js';
import { lexTemporal } from './lexer.js';
import type { AnyToken } from './lexer-types.js';
import { TokType } from './lexer-types.js';
import type { TimeAst } from './parser-types.js';

/**
 * Parse a time-of-day string from multiple common formats.
 * Supports: locale time ("9:07 AM"), 24h ("09:00", "14:30"), ISO 8601 basic format ("1430"),
 * short 24h ("9:00"), bare hours ("7", "7 AM"), and 12h with lowercase period ("9:07 am").
 *
 * TAA (LLM) often generates time in 24h format ("09:00") instead of the locale
 * format ("9:00 AM") that Luxon's 't' token expects.
 *
 * Supported formats:
 * - Locale time (12-hour with AM/PM): "9:07 AM", "2:30 PM", "02:30PM", "2:30 p.m."
 * - 24-hour format (extended): "09:00", "14:30", "23:59"
 * - ISO 8601 basic format (compact): "1430", "0900", "143045", "143045.123"
 * - Short 24-hour (single digit hour): "9:00", "9:30"
 * - Bare hours (defaults to :00): "7" (→ 7:00), "0" (→ 0:00), "7 AM" (→ 7:00 AM)
 * - Lowercase am/pm: "9:07 am", "2:30 pm"
 * - With optional seconds: "2:30:45 PM", "14:30:45"
 * - With optional fractional seconds: "2:30:45.123 PM", "14:30:45.123"
 *
 * Returns a TimeAst object compatible with Temporal.PlainTime.from()
 *
 * @param input - The time string to parse
 * @returns TimeAst object with hour, minute, and optional second/fraction
 * @throws ParseError if the input is invalid
 */
export function parseTimeString(input: string): TimeAst {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new ParseError('Empty time string. Expected format: "9:07 AM", "09:00", or "14:30"', 0);
  }

  // Lex the input
  const tokens = lexTemporal(trimmed);

  // Create a simple token parser
  let i = 0;
  const peek = (k = 0): AnyToken => tokens[Math.min(i + k, tokens.length - 1)]!;
  const at = (type: TokType): boolean => peek().type === type;
  const eat = (type: TokType): AnyToken => {
    const t = peek();
    if (t.type !== type) {
      throw new ParseError(
        `Invalid time format: "${trimmed}". Expected format: "HH:MM" (e.g., "09:00", "14:30") or "H:MM AM/PM" (e.g., "9:07 AM")`,
        i,
      );
    }
    i++;
    return t;
  };
  const tryEat = (type: TokType): AnyToken | null => {
    if (at(type)) {
      return eat(type);
    }
    return null;
  };

  // Parse: Number [: Number [: Number [. Number]]] [Ident]
  // Example: 2:30 PM, 14:30, 2:30:45.123 PM, 7 AM, 9
  // Also supports ISO 8601 basic format: 1430, 143045, 143045.123

  // Parse hour (or entire time in basic format)
  const hourTok = eat(TokType.Number);
  let hour: number;
  let minute = 0;
  let second: number | undefined;
  let fraction: string | undefined;

  // Check if this is ISO 8601 basic format (no colons)
  // Basic format: hhmm (4 digits), hhmmss (6 digits), or hhmmss.fff
  const numLen = hourTok.value.length;

  if (!at(TokType.Colon) && (numLen === 4 || numLen === 6)) {
    // ISO 8601 basic format
    const timeStr = hourTok.value;

    // Extract hour (first 2 digits)
    hour = toInt(timeStr.substring(0, 2), 'hour', i);

    // Extract minute (next 2 digits)
    minute = toInt(timeStr.substring(2, 4), 'minute', i);

    // Extract optional seconds (last 2 digits if length is 6)
    if (numLen === 6) {
      second = toInt(timeStr.substring(4, 6), 'second', i);

      // Validate second
      if (second < 0 || second > 59) {
        throw new ParseError(`Invalid second: ${second}. Seconds must be between 00-59`, i);
      }
    }

    // Validate minute
    if (minute < 0 || minute > 59) {
      throw new ParseError(`Invalid minute: ${minute}. Minutes must be between 00-59`, i);
    }

    // Optional fractional seconds (. or ,)
    if (tryEat(TokType.Dot) || tryEat(TokType.Comma)) {
      const fracTok = eat(TokType.Number);
      fraction = fracTok.value;
    }
  } else {
    // Extended format (with colons) or bare hour
    hour = toInt(hourTok.value, 'hour', i);

    // Parse optional colon and minute
    if (tryEat(TokType.Colon)) {
      // Parse minute
      const minuteTok = eat(TokType.Number);
      minute = toInt(minuteTok.value, 'minute', i);

      // Validate minute format (must be 2 digits)
      if (minuteTok.value.length !== 2) {
        throw new ParseError(
          `Invalid time format: "${trimmed}". Minutes must be 2 digits (e.g., "9:07" not "9:7")`,
          i,
        );
      }

      // Validate minute
      if (minute < 0 || minute > 59) {
        throw new ParseError(`Invalid minute: ${minute}. Minutes must be between 00-59`, i);
      }

      // Optional seconds
      if (tryEat(TokType.Colon)) {
        const secondTok = eat(TokType.Number);
        second = toInt(secondTok.value, 'second', i);

        // Validate second
        if (second < 0 || second > 59) {
          throw new ParseError(`Invalid second: ${second}. Seconds must be between 00-59`, i);
        }

        // Optional fractional seconds (. or ,)
        if (tryEat(TokType.Dot) || tryEat(TokType.Comma)) {
          const fracTok = eat(TokType.Number);
          fraction = fracTok.value;
        }
      }
    }
  }

  // Optional AM/PM
  let ampmStr: string | undefined;
  if (at(TokType.Ident)) {
    const identTok = eat(TokType.Ident);
    const ident = String(identTok.value).toUpperCase();

    // Check for AM/PM patterns: A, P, AM, PM
    if (ident === 'A' || ident === 'P' || ident === 'AM' || ident === 'PM') {
      ampmStr = ident[0]; // Extract 'A' or 'P'
    } else {
      throw new ParseError(
        `Invalid time format: unexpected "${identTok.value}". Use AM/PM for 12-hour format or omit for 24-hour format`,
        i,
      );
    }

    // Optional dot after A/P (for a.m./p.m. format)
    tryEat(TokType.Dot);

    // Optional M after dot (for a.m./p.m. format)
    if (at(TokType.Ident)) {
      const mTok = tryEat(TokType.Ident);
      if (mTok && String(mTok.value).toUpperCase() !== 'M') {
        throw new ParseError(
          `Invalid time format: unexpected "${mTok.value}". Expected "a.m." or "p.m." format`,
          i,
        );
      }
      // Optional dot after M
      tryEat(TokType.Dot);
    }
  }

  // Expect EOF
  eat(TokType.EOF);

  // Handle AM/PM conversion
  if (ampmStr !== undefined) {
    const isPM = ampmStr === 'P';

    // Validate 12-hour format hour range
    if (hour < 1 || hour > 12) {
      throw new ParseError(
        `Invalid hour for 12-hour format: ${hour}. Hours with AM/PM must be between 1-12 (e.g., "9:07 AM", not "0:07 AM" or "13:07 AM")`,
        i,
      );
    }

    // Convert to 24-hour format
    if (isPM) {
      // PM: 12 PM = 12, 1 PM = 13, ..., 11 PM = 23
      if (hour !== 12) {
        hour += 12;
      }
    } else {
      // AM: 12 AM = 0, 1 AM = 1, ..., 11 AM = 11
      if (hour === 12) {
        hour = 0;
      }
    }
  } else {
    // 24-hour format validation
    if (hour < 0 || hour > 23) {
      throw new ParseError(
        `Invalid hour for 24-hour format: ${hour}. Hours must be between 0-23 (e.g., "09:00", "14:30"). For hours > 12, use 24-hour format or add AM/PM`,
        i,
      );
    }
  }

  return {
    kind: 'Time',
    hour,
    minute,
    second,
    fraction,
  };
}
