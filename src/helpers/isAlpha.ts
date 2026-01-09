/**
 * Check if character is alphabetic (A-Z or a-z)
 * This defines what can be part of an IDENT token in default mode
 * @param c - the character to check
 * @returns true if character is alphabetic, false otherwise
 */
export function isAlpha(c: string): boolean {
  return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z');
}
