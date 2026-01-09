// lexer-types.ts
// Token types and interfaces for the lexer

export enum TokType {
  // Numbers: sequences of digits (0-9)
  // Examples: "2025", "01", "12", "59"
  Number = 'Number',

  // Ident (Identifier): sequences of alphabetic characters (A-Z, a-z)
  // This is the generic "text" token for letter-based designators.
  // Examples: "P" (duration), "Y" (year), "M" (month), "gregory" (calendar)
  // The lexer keeps it simple; the parser interprets the meaning.
  Ident = 'Ident',

  // Single-character punctuation tokens
  Dash = 'Dash', // -
  Colon = 'Colon', // :
  Dot = 'Dot', // .
  Plus = 'Plus', // +
  Slash = 'Slash', // /
  Comma = 'Comma', // ,
  Equals = 'Equals', // =
  Underscore = 'Underscore', // _
  Exclamation = 'Exclamation', // ! (critical flag in IXDTF)

  // Special letter tokens with dedicated meaning in ISO 8601
  T = 'T', // Date/time separator: 2025-01-01T10:00:00
  Z = 'Z', // UTC timezone marker: 2025-01-01T10:00:00Z

  // Bracket tokens for IXDTF annotations/extensions
  LBracket = 'LBracket', // [
  RBracket = 'RBracket', // ]

  // BracketText: complex text inside brackets that contains non-letter chars
  // Example: in [u-ca=gregory], "u-ca" is BracketText (has dash), "gregory" is Ident (letters only)
  // Example: in [Asia/Singapore], "Asia/Singapore" is BracketText (has slash)
  BracketText = 'BracketText',

  EOF = 'EOF',
}

export type Token = {
  type: TokType;
  value: string;
  start: number; // inclusive
  end: number; // exclusive
};

// Combined token types for timezone offsets
export enum CombinedTokType {
  TZOffset = 'TZOffset', // +08:00, -0530, +09
}

export type CombinedToken = {
  type: CombinedTokType;
  value: string;
  tokens: Token[];
  start: number;
  end: number;
};

export type AnyToken = Token | CombinedToken;
