// combineTimezoneOffsets.test.ts
import { describe, expect, it } from 'vitest';

import { combineTimezoneOffsets } from './combineTimezoneOffsets.js';
import { lexTemporal } from './lexer.js';
import { CombinedTokType, TokType } from './lexer-types.js';

describe('combineTimezoneOffsets', () => {
  describe('should combine +HH:MM format', () => {
    it('after time component', () => {
      const raw = lexTemporal('10:00:00+08:00');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: CombinedTokType.TZOffset, value: '+08:00', start: 8, end: 14 },
        { type: TokType.EOF },
      ]);
    });

    it('in full datetime', () => {
      const raw = lexTemporal('2025-01-07T10:00:00+08:00');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '2025' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '01' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '07' },
        { type: TokType.T },
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: CombinedTokType.TZOffset, value: '+08:00' },
        { type: TokType.EOF },
      ]);
    });
  });

  describe('should combine -HH:MM format', () => {
    it('after time component', () => {
      const raw = lexTemporal('10:00:00-05:30');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: CombinedTokType.TZOffset, value: '-05:30', start: 8, end: 14 },
        { type: TokType.EOF },
      ]);
    });
  });

  describe('should combine +HHMM format (4 digits)', () => {
    it('after time component', () => {
      const raw = lexTemporal('10:00:00+0530');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: CombinedTokType.TZOffset, value: '+0530' },
        { type: TokType.EOF },
      ]);
    });

    it('negative offset', () => {
      const raw = lexTemporal('10:00:00-0530');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: CombinedTokType.TZOffset, value: '-0530' },
        { type: TokType.EOF },
      ]);
    });
  });

  describe('should combine +HH format (2 digits)', () => {
    it('after time component', () => {
      const raw = lexTemporal('10:00:00+09');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: CombinedTokType.TZOffset, value: '+09' },
        { type: TokType.EOF },
      ]);
    });

    it('negative offset', () => {
      const raw = lexTemporal('10:00:00-05');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: CombinedTokType.TZOffset, value: '-05' },
        { type: TokType.EOF },
      ]);
    });
  });

  describe('should NOT combine in wrong contexts', () => {
    it('should not combine date separators', () => {
      const raw = lexTemporal('2025-01-07');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '2025' },
        { type: TokType.Dash, value: '-' },
        { type: TokType.Number, value: '01' },
        { type: TokType.Dash, value: '-' },
        { type: TokType.Number, value: '07' },
        { type: TokType.EOF },
      ]);
    });

    it('should not combine year-month separator', () => {
      const raw = lexTemporal('2025-01');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '2025' },
        { type: TokType.Dash, value: '-' },
        { type: TokType.Number, value: '01' },
        { type: TokType.EOF },
      ]);
    });

    it('should not combine invalid digit counts', () => {
      const raw = lexTemporal('10:00:00+123'); // 3 digits, not valid
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Plus, value: '+' },
        { type: TokType.Number, value: '123' },
        { type: TokType.EOF },
      ]);
    });

    it('should not combine 1-digit numbers', () => {
      const raw = lexTemporal('10:00:00+5');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Plus, value: '+' },
        { type: TokType.Number, value: '5' },
        { type: TokType.EOF },
      ]);
    });

    it('should not combine 3-digit numbers', () => {
      const raw = lexTemporal('10:00:00+530');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Plus, value: '+' },
        { type: TokType.Number, value: '530' },
        { type: TokType.EOF },
      ]);
    });

    it('should not combine 5-digit numbers', () => {
      const raw = lexTemporal('10:00:00+05300');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Plus, value: '+' },
        { type: TokType.Number, value: '05300' },
        { type: TokType.EOF },
      ]);
    });
  });

  describe('should preserve non-offset tokens', () => {
    it('date and time tokens', () => {
      const raw = lexTemporal('2025-01-07T10:00:00+08:00');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '2025' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '01' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '07' },
        { type: TokType.T },
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: CombinedTokType.TZOffset, value: '+08:00' },
        { type: TokType.EOF },
      ]);
    });

    it('all token types in complex example', () => {
      const raw = lexTemporal('2025-01-07T10:00:00.123Z');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '2025' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '01' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '07' },
        { type: TokType.T },
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Dot },
        { type: TokType.Number, value: '123' },
        { type: TokType.Z },
        { type: TokType.EOF },
      ]);
    });
  });

  describe('should handle multiple offsets', () => {
    it('in same input', () => {
      const raw = lexTemporal('10:00:00+08:00 15:30:00-05:30');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: CombinedTokType.TZOffset, value: '+08:00' },
        { type: TokType.Number, value: '15' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '30' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: CombinedTokType.TZOffset, value: '-05:30' },
        { type: TokType.EOF },
      ]);
    });
  });

  describe('should maintain token positions', () => {
    it('for +HH:MM format', () => {
      const raw = lexTemporal('10:00:00+08:00');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '10', start: 0, end: 2 },
        { type: TokType.Colon, value: ':', start: 2, end: 3 },
        { type: TokType.Number, value: '00', start: 3, end: 5 },
        { type: TokType.Colon, value: ':', start: 5, end: 6 },
        { type: TokType.Number, value: '00', start: 6, end: 8 },
        { type: CombinedTokType.TZOffset, value: '+08:00', start: 8, end: 14 },
        { type: TokType.EOF, value: '', start: 14, end: 14 },
      ]);
    });

    it('for +HHMM format', () => {
      const raw = lexTemporal('10:00:00+0530');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '10', start: 0, end: 2 },
        { type: TokType.Colon, start: 2, end: 3 },
        { type: TokType.Number, value: '00', start: 3, end: 5 },
        { type: TokType.Colon, start: 5, end: 6 },
        { type: TokType.Number, value: '00', start: 6, end: 8 },
        { type: CombinedTokType.TZOffset, value: '+0530', start: 8, end: 13 },
        { type: TokType.EOF, start: 13, end: 13 },
      ]);
    });

    it('for +HH format', () => {
      const raw = lexTemporal('10:00:00+09');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '10', start: 0, end: 2 },
        { type: TokType.Colon, start: 2, end: 3 },
        { type: TokType.Number, value: '00', start: 3, end: 5 },
        { type: TokType.Colon, start: 5, end: 6 },
        { type: TokType.Number, value: '00', start: 6, end: 8 },
        { type: CombinedTokType.TZOffset, value: '+09', start: 8, end: 11 },
        { type: TokType.EOF, start: 11, end: 11 },
      ]);
    });
  });

  describe('context-aware combination', () => {
    it('should NOT combine after Z (mutually exclusive per ISO 8601)', () => {
      // Z and numeric offsets are mutually exclusive in ISO 8601
      // Use either Z OR +HH:MM, never both
      const raw = lexTemporal('Z+08:00');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Z },
        { type: TokType.Plus },
        { type: TokType.Number, value: '08' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.EOF },
      ]);
    });

    it('should NOT combine after bracket (offset must come before brackets per RFC 9557)', () => {
      // Per RFC 9557/IXDTF: offset comes BEFORE brackets
      // Valid:   10:00:00+08:00[Asia/Tokyo]
      // Invalid: [Asia/Tokyo]+08:00
      const raw = lexTemporal('[test]+08:00');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.LBracket },
        { type: TokType.Ident, value: 'test' },
        { type: TokType.RBracket },
        { type: TokType.Plus },
        { type: TokType.Number, value: '08' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.EOF },
      ]);
    });

    it('should combine after time with seconds', () => {
      const raw = lexTemporal('23:59:59+00:00');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '23' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '59' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '59' },
        { type: CombinedTokType.TZOffset, value: '+00:00' },
        { type: TokType.EOF },
      ]);
    });

    it('should combine after time without seconds', () => {
      const raw = lexTemporal('10:30+08:00');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '30' },
        { type: CombinedTokType.TZOffset, value: '+08:00' },
        { type: TokType.EOF },
      ]);
    });

    it('should NOT combine without proper context', () => {
      const raw = lexTemporal('+08:00');
      const combined = combineTimezoneOffsets(raw);
      // No context, should not combine
      expect(combined).toMatchObject([
        { type: TokType.Plus },
        { type: TokType.Number, value: '08' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.EOF },
      ]);
    });

    it('should NOT combine in duration context', () => {
      const raw = lexTemporal('P1Y-2M');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Ident, value: 'P' },
        { type: TokType.Number, value: '1' },
        { type: TokType.Ident, value: 'Y' },
        { type: TokType.Dash, value: '-' },
        { type: TokType.Number, value: '2' },
        { type: TokType.Ident, value: 'M' },
        { type: TokType.EOF },
      ]);
    });
  });

  describe('edge cases', () => {
    it('should handle empty token array', () => {
      const combined = combineTimezoneOffsets([]);
      expect(combined).toMatchObject([]);
    });

    it('should handle single token', () => {
      const raw = lexTemporal('Z');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([{ type: TokType.Z }, { type: TokType.EOF }]);
    });

    it('should handle tokens without any offsets', () => {
      const raw = lexTemporal('2025-01-07');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '2025' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '01' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '07' },
        { type: TokType.EOF },
      ]);
    });

    it('should handle offset at end of complex datetime', () => {
      const raw = lexTemporal('2025-01-07T10:00:00.999+08:00');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '2025' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '01' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '07' },
        { type: TokType.T },
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Dot },
        { type: TokType.Number, value: '999' },
        { type: CombinedTokType.TZOffset, value: '+08:00' },
        { type: TokType.EOF },
      ]);
    });

    it('should handle offset with zero values', () => {
      const raw = lexTemporal('10:00:00+00:00');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: CombinedTokType.TZOffset, value: '+00:00' },
        { type: TokType.EOF },
      ]);
    });

    it('should handle maximum valid offsets', () => {
      const raw = lexTemporal('10:00:00+23:59');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: CombinedTokType.TZOffset, value: '+23:59' },
        { type: TokType.EOF },
      ]);
    });
  });

  describe('with annotations', () => {
    it('should combine offset before annotations', () => {
      const raw = lexTemporal('10:00:00+08:00[u-ca=gregory]');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: CombinedTokType.TZOffset, value: '+08:00' },
        { type: TokType.LBracket },
        { type: TokType.BracketText, value: 'u-ca' },
        { type: TokType.Equals },
        { type: TokType.Ident, value: 'gregory' },
        { type: TokType.RBracket },
        { type: TokType.EOF },
      ]);
    });

    it('should have offset BEFORE bracket annotation (correct order per RFC 9557)', () => {
      // Correct order: offset BEFORE brackets
      const raw = lexTemporal('10:00:00+08:00[test]');
      const combined = combineTimezoneOffsets(raw);
      expect(combined).toMatchObject([
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: CombinedTokType.TZOffset, value: '+08:00' },
        { type: TokType.LBracket },
        { type: TokType.Ident, value: 'test' },
        { type: TokType.RBracket },
        { type: TokType.EOF },
      ]);
    });
  });

  describe('idempotence', () => {
    it('should be idempotent - combining twice produces same result', () => {
      const raw = lexTemporal('10:00:00+08:00');
      const combined1 = combineTimezoneOffsets(raw);
      const combined2 = combineTimezoneOffsets(combined1);
      expect(combined1).toEqual(combined2);
    });

    it('should handle already combined tokens', () => {
      const raw = lexTemporal('10:00:00+08:00');
      const combined = combineTimezoneOffsets(raw);
      const reCombined = combineTimezoneOffsets(combined);

      expect(reCombined).toMatchObject([
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: CombinedTokType.TZOffset, value: '+08:00' },
        { type: TokType.EOF },
      ]);
    });
  });
});
