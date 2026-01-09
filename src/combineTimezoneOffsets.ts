// combineTimezoneOffsets.ts
// Combines numeric timezone offset tokens into single tokens for easier parsing

import { type AnyToken, CombinedTokType, type Token, TokType } from './lexer-types.js';

/**
 * Combine numeric timezone offsets into single tokens for easier parsing.
 * This is an optional post-processing step for the lexer output.
 *
 * Combines patterns like:
 * - (+|-) Number Colon Number => +08:00, -05:30
 * - (+|-) Number (2 or 4 digits) => +09, -0530
 *
 * Only combines when context suggests a timezone offset (after time components),
 * NOT after:
 * - Z (mutually exclusive per ISO 8601)
 * - brackets (offset comes BEFORE brackets per RFC 9557/IXDTF)
 * - standalone dates (e.g., 2025-01 where - is a date separator)
 *
 * @param tokens - The raw token array from lexTemporal
 * @returns Array of tokens (either original Token or combined CombinedToken with TZOffset type where applicable)
 *
 * @example
 * ```typescript
 * const raw = lexTemporal('10:00:00+08:00');
 * const combined = combineTimezoneOffsets(raw);
 * // Result includes: { type: 'TZOffset', value: '+08:00' }
 * ```
 */
export function combineTimezoneOffsets(tokens: Token[]): AnyToken[] {
  const out: AnyToken[] = [];
  let i = 0;

  const peek = (k: number) => tokens[i + k];

  // Helper to check if previous tokens suggest this could be a timezone offset
  // Timezone offsets come after time components (HH:MM:SS)
  // NOT after just a date like 2025-01
  // NOT after Z (Z and numeric offsets are mutually exclusive per ISO 8601)
  // NOT after brackets (per RFC 9557/IXDTF: offset comes BEFORE brackets)
  const couldBeTzOffset = () => {
    if (out.length < 1) {
      return false;
    }
    const prev: AnyToken | undefined = out[out.length - 1];
    if (prev == null) {
      return false;
    }

    // After Z - NOT valid (Z and numeric offsets are mutually exclusive)
    // Per ISO 8601: use either Z OR +HH:MM, never both
    if (prev.type === TokType.Z) {
      return false;
    }

    // After bracket - NOT valid (offset must come BEFORE brackets per RFC 9557)
    // Valid: Time+08:00[Asia/Tokyo]
    // Invalid: [Asia/Tokyo]+08:00
    if (prev.type === TokType.RBracket) {
      return false;
    }

    // After a number, check context
    if (prev.type === TokType.Number) {
      if (out.length < 2) {
        return false;
      }
      const prevPrev = out[out.length - 2];

      // After a number with colon before it (time component)
      // e.g., ...10:00:00+08:00 - the number before + has a colon before it
      if (prevPrev?.type === TokType.Colon) {
        return true;
      }

      // After a number with dot before it (milliseconds)
      // e.g., ...10:00:00.999+08:00 - the number before + has a dot before it
      if (prevPrev?.type === TokType.Dot) {
        return true;
      }
    }

    return false;
  };

  while (i < tokens.length) {
    const t = tokens[i]!;
    const isSign = t.type === TokType.Plus || t.type === TokType.Dash;

    // Only try to combine if context suggests timezone offset
    if (isSign && couldBeTzOffset()) {
      // (+|-) Number Colon Number  => +08:00
      if (
        peek(1)?.type === TokType.Number &&
        peek(2)?.type === TokType.Colon &&
        peek(3)?.type === TokType.Number
      ) {
        const originalTokens = [t, peek(1)!, peek(2)!, peek(3)!];
        const start = t.start;
        const end = peek(3)!.end;
        const value = `${t.value}${peek(1)!.value}:${peek(3)!.value}`;
        out.push({ type: CombinedTokType.TZOffset, value, tokens: originalTokens, start, end });
        i += 4;
        continue;
      }

      // (+|-) Number where Number is 2 or 4 digits => +09 or -0530
      if (peek(1)?.type === TokType.Number) {
        const num = peek(1)!.value;
        if (num.length === 2 || num.length === 4) {
          const originalTokens = [t, peek(1)!];
          const start = t.start;
          const end = peek(1)!.end;
          const value = `${t.value}${num}`;
          out.push({ type: CombinedTokType.TZOffset, value, tokens: originalTokens, start, end });
          i += 2;
          continue;
        }
      }
    }

    out.push(t);
    i++;
  }

  return out;
}
