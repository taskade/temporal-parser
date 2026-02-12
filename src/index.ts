// index.ts
// Main entry point for the temporal parser library

// Export lexer functionality
export { combineTimezoneOffsets } from './combineTimezoneOffsets.js';
export { lexTemporal } from './lexer.js';

// Export lexer types
export type { AnyToken, CombinedToken, Token } from './lexer-types.js';
export { CombinedTokType, TokType } from './lexer-types.js';

// Export parser functionality
export { parseTemporal } from './parser.js';

// Export offset parser (useful standalone utility)
export { parseOffset } from './parseOffset.js';

// Export time string parser (useful standalone utility)
export { parseTimeString } from './parseTimeString.js';

// Export stringify functionality
export {
  stringifyAnnotation,
  stringifyDate,
  stringifyDateTime,
  stringifyDuration,
  stringifyOffset,
  stringifyRange,
  stringifyTemporal,
  stringifyTime,
  stringifyTimeZone,
} from './stringify.js';

// Export parser types
export type {
  AnnotationAst,
  DateAst,
  DateTimeAst,
  DurationAst,
  OffsetAst,
  RangeAst,
  TemporalAst,
  TimeAst,
  TimeZoneAst,
  ValueAst,
} from './parser-types.js';

// Export errors
export { LexError, ParseError } from './errors.js';
