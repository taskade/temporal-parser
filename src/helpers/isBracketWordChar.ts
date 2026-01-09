import { isAlpha } from './isAlpha.js';
import { isDigit } from './isDigit.js';

/**
 * Check if character is valid inside bracket annotations
 * In default mode, IDENT is letters only (keeps date/time parsing clean).
 * In bracket mode, we allow broader "words" like:
 *   - u-ca (has dash)
 *   - Asia/Singapore (has slash)
 *   - Etc/GMT+8 (has plus)
 *   - iso8601 (has digits)
 * @param c - the character to check
 * @returns true if character is valid in bracket context, false otherwise
 */
export function isBracketWordChar(c: string): boolean {
  return (
    isAlpha(c) || isDigit(c) || c === '-' || c === '/' || c === '+' || c === '.' // allow dots in some TZ-ish values
  );
}
