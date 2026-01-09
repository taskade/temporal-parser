import { ParseError } from '../errors.js';

/**
 * Convert a string to an integer, throwing a ParseError if invalid
 * @param s - the string to convert
 * @param label - a descriptive label for error messages (e.g., "year", "month")
 * @param position - the position in the token stream for error reporting
 * @returns the parsed integer value
 * @throws {ParseError} if the string is not a valid integer
 */
export function toInt(s: string, label: string, position: number): number {
  const n = Number(s);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new ParseError(`Invalid integer for ${label}: ${JSON.stringify(s)}`, position);
  }
  return n;
}
