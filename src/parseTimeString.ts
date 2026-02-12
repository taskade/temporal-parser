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
 * Supports: locale time ("9:07 AM"), 24h ("09:00", "14:30"), short 24h ("9:00"),
 * and 12h with lowercase period ("9:07 am").
 *
 * TAA (LLM) often generates time in 24h format ("09:00") instead of the locale
 * format ("9:00 AM") that Luxon's 't' token expects.
 *
 * Supported formats:
 * - Locale time (12-hour with AM/PM): "9:07 AM", "2:30 PM", "02:30PM", "2:30 p.m."
 * - 24-hour format: "09:00", "14:30", "23:59"
 * - Short 24-hour (single digit hour): "9:00", "9:30"
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

  // Parse: Number : Number [: Number [. Number]] [Ident]
  // Example: 2:30 PM, 14:30, 2:30:45.123 PM

  // Parse hour
  const hourTok = eat(TokType.Number);
  let hour = toInt(hourTok.value, 'hour', i);

  // Parse colon
  eat(TokType.Colon);

  // Parse minute
  const minuteTok = eat(TokType.Number);
  const minute = toInt(minuteTok.value, 'minute', i);

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
  let second: number | undefined;
  let fraction: string | undefined;

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
