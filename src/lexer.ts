// lexer.ts
// Temporal (IXDTF / ISO-8601-ish) lexer with support for *extensions/annotations* like calendar.
//
// Supports:
// - Basic date/time tokens: numbers, identifiers, T, Z, punctuation
// - Ranges: '/'
// - Durations: 'P' (as IDENT; parser enforces rules)
// - Time zone forms:
//    - 'Z'
//    - numeric offsets: +08:00 / -0530 / +09   (optionally combined via helper)
//    - bracketed IANA TZ: [Asia/Singapore]
// - IXDTF-style annotations/extensions in brackets, e.g.:
//    - [u-ca=gregory]   (calendar)
//    - [u-tz=Asia/Singapore] (timeZone)
//    - multiple bracket groups: 2025-01-01T00:00Z[u-ca=iso8601][u-tz=UTC]
//
// The lexer is permissive; your parser should validate semantics.

import { LexError } from './errors.js';
import { isAlpha } from './helpers/isAlpha.js';
import { isBracketWordChar } from './helpers/isBracketWordChar.js';
import { isDigit } from './helpers/isDigit.js';
import type { Token } from './lexer-types.js';
import { TokType } from './lexer-types.js';

export function lexTemporal(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  const emit = (type: TokType, start: number, end: number, value?: string) => {
    tokens.push({ type, value: value ?? src.slice(start, end), start, end });
  };

  // Lex a number: consume consecutive digits
  // Examples: "2025", "01", "59"
  const lexNumber = () => {
    const start = i;
    i++;
    while (i < src.length && isDigit(src[i]!)) {
      i++;
    }
    emit(TokType.Number, start, i);
  };

  // Lex an identifier: consume consecutive alphabetic characters
  // This is where IDENT tokens are created!
  //
  // Examples of what becomes IDENT:
  //   - Duration designators: P, Y, M, W, D, H, S
  //   - Calendar names: gregory, hebrew, iso8601
  //   - Any letter sequence: P, YMD, UTC, America
  //
  // Special cases:
  //   - "T" gets its own token type (datetime separator)
  //   - "Z" gets its own token type (UTC marker)
  //   - Everything else becomes Ident
  //
  // IMPORTANT: We only consume a single letter at a time to allow T and Z
  // to be recognized individually (e.g., "DT" should be "D" then "T", not "DT")
  const lexIdent = () => {
    const start = i;
    const ch = src[i]!;
    i++;

    // Special handling for T and Z - emit them as special tokens
    if (ch === 'T') {
      emit(TokType.T, start, i, 'T');
      return;
    }
    if (ch === 'Z') {
      emit(TokType.Z, start, i, 'Z');
      return;
    }

    // For other letters, consume consecutive letters that are NOT T or Z
    // This allows multi-letter identifiers like "gregory" but keeps T and Z separate
    while (i < src.length && isAlpha(src[i]!) && src[i] !== 'T' && src[i] !== 'Z') {
      i++;
    }

    emit(TokType.Ident, start, i); // Generic identifier
  };

  const lexBracketContent = () => {
    // We are positioned after '['. Emit content tokens until ']'.
    while (i < src.length) {
      const ch = src[i]!;

      if (ch === ']') {
        return;
      }

      // Skip whitespace inside brackets (rare but harmless)
      if (/\s/.test(ch)) {
        i++;
        continue;
      }

      // Single-char tokens inside brackets
      if (ch === '=') {
        emit(TokType.Equals, i, i + 1);
        i++;
        continue;
      }
      if (ch === '_') {
        emit(TokType.Underscore, i, i + 1);
        i++;
        continue;
      }
      if (ch === ':') {
        emit(TokType.Colon, i, i + 1);
        i++;
        continue;
      }
      if (ch === '-') {
        emit(TokType.Dash, i, i + 1);
        i++;
        continue;
      }
      if (ch === '+') {
        emit(TokType.Plus, i, i + 1);
        i++;
        continue;
      }
      if (ch === '/') {
        emit(TokType.Slash, i, i + 1);
        i++;
        continue;
      }
      if (ch === '.') {
        emit(TokType.Dot, i, i + 1);
        i++;
        continue;
      }
      if (ch === ',') {
        emit(TokType.Comma, i, i + 1);
        i++;
        continue;
      }
      if (ch === '!') {
        emit(TokType.Exclamation, i, i + 1);
        i++;
        continue;
      }

      // Words inside brackets (u-ca, gregory, Asia/Singapore, iso8601, Etc/GMT+8, etc.)
      if (isBracketWordChar(ch)) {
        const start = i;
        i++;
        while (i < src.length && isBracketWordChar(src[i]!)) {
          i++;
        }
        const text = src.slice(start, i);

        // Decision: Ident vs BracketText
        // - If purely letters (A-Z, a-z): emit as Ident
        //   Examples: "gregory", "hebrew", "u", "ca"
        // - If contains other chars (digits, -, /, +, .): emit as BracketText
        //   Examples: "u-ca", "Asia/Singapore", "iso8601", "Etc/GMT+8"
        if (/^[A-Za-z]+$/.test(text)) {
          emit(TokType.Ident, start, i, text);
        } else {
          emit(TokType.BracketText, start, i, text);
        }

        continue;
      }

      throw new LexError(`Unexpected character ${JSON.stringify(ch)} inside brackets`, i);
    }

    throw new LexError("Unterminated bracket annotation, expected ']'", src.length);
  };

  while (i < src.length) {
    const ch = src[i]!;

    // Skip whitespace
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Bracketed extensions/annotations/timezone IDs
    if (ch === '[') {
      emit(TokType.LBracket, i, i + 1);
      i++;

      lexBracketContent();

      if (i >= src.length || src[i] !== ']') {
        throw new LexError("Unterminated bracket annotation, expected ']'", i);
      }
      emit(TokType.RBracket, i, i + 1);
      i++;
      continue;
    }

    // Numbers: sequences of digits
    if (isDigit(ch)) {
      lexNumber();
      continue;
    }

    // Letters: this is where IDENT tokens are created!
    // Any alphabetic character triggers identifier lexing.
    // Examples: P (duration), Y (year), M (month), gregory, UTC
    if (isAlpha(ch)) {
      lexIdent();
      continue;
    }

    // Punctuation (default mode)
    switch (ch) {
      case '-':
        emit(TokType.Dash, i, i + 1);
        i++;
        continue;
      case ':':
        emit(TokType.Colon, i, i + 1);
        i++;
        continue;
      case '.':
        emit(TokType.Dot, i, i + 1);
        i++;
        continue;
      case '+':
        emit(TokType.Plus, i, i + 1);
        i++;
        continue;
      case '/':
        emit(TokType.Slash, i, i + 1);
        i++;
        continue;
      case ',':
        emit(TokType.Comma, i, i + 1);
        i++;
        continue;
      case '=':
        emit(TokType.Equals, i, i + 1);
        i++;
        continue;
      case '_':
        emit(TokType.Underscore, i, i + 1);
        i++;
        continue;
      default:
        throw new LexError(`Unexpected character ${JSON.stringify(ch)}`, i);
    }
  }

  emit(TokType.EOF, src.length, src.length, '');
  return tokens;
}
