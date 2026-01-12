// lexer.test.ts
import { describe, expect, it } from 'vitest';

import { combineTimezoneOffsets } from './combineTimezoneOffsets.js';
import { LexError } from './errors.js';
import { lexTemporal } from './lexer.js';
import { CombinedTokType, TokType } from './lexer-types.js';

describe('lexTemporal', () => {
  describe('basic date tokens', () => {
    it('should lex a simple year', () => {
      const tokens = lexTemporal('2025');
      expect(tokens).toMatchObject([
        { type: TokType.Number, value: '2025', start: 0, end: 4 },
        { type: TokType.EOF, value: '', start: 4, end: 4 },
      ]);
    });

    it('should lex a full date YYYY-MM-DD', () => {
      const tokens = lexTemporal('2025-01-07');
      expect(tokens).toMatchObject([
        { type: TokType.Number, value: '2025', start: 0, end: 4 },
        { type: TokType.Dash, value: '-', start: 4, end: 5 },
        { type: TokType.Number, value: '01', start: 5, end: 7 },
        { type: TokType.Dash, value: '-', start: 7, end: 8 },
        { type: TokType.Number, value: '07', start: 8, end: 10 },
        { type: 'EOF', value: '', start: 10, end: 10 },
      ]);
    });

    it('should lex a date with time separator', () => {
      const tokens = lexTemporal('2025-01-07T10:00:00');
      expect(tokens).toMatchObject([
        { type: TokType.Number, value: '2025', start: 0, end: 4 },
        { type: TokType.Dash, value: '-', start: 4, end: 5 },
        { type: TokType.Number, value: '01', start: 5, end: 7 },
        { type: TokType.Dash, value: '-', start: 7, end: 8 },
        { type: TokType.Number, value: '07', start: 8, end: 10 },
        { type: TokType.T, value: 'T', start: 10, end: 11 },
        { type: TokType.Number, value: '10', start: 11, end: 13 },
        { type: TokType.Colon, value: ':', start: 13, end: 14 },
        { type: TokType.Number, value: '00', start: 14, end: 16 },
        { type: TokType.Colon, value: ':', start: 16, end: 17 },
        { type: TokType.Number, value: '00', start: 17, end: 19 },
        { type: TokType.EOF, value: '', start: 19, end: 19 },
      ]);
    });
  });

  describe('time tokens', () => {
    it('should lex time with colons', () => {
      const tokens = lexTemporal('10:30:45');
      expect(tokens).toMatchObject([
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon, value: ':' },
        { type: TokType.Number, value: '30' },
        { type: TokType.Colon, value: ':' },
        { type: TokType.Number, value: '45' },
        { type: TokType.EOF },
      ]);
    });

    it('should lex fractional seconds', () => {
      const tokens = lexTemporal('10:30:45.123');
      expect(tokens).toMatchObject([
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '30' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '45' },
        { type: TokType.Dot, value: '.' },
        { type: TokType.Number, value: '123' },
        { type: TokType.EOF },
      ]);
    });
  });

  describe('timezone tokens', () => {
    it('should lex Z as UTC marker', () => {
      const tokens = lexTemporal('2025-01-07T10:00:00Z');
      expect(tokens).toMatchObject([
        { type: TokType.Number, value: '2025' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '01' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '07' },
        { type: TokType.T, value: 'T' },
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Z, value: 'Z' },
        { type: TokType.EOF },
      ]);
    });

    it('should lex positive timezone offset', () => {
      const tokens = lexTemporal('+08:00');
      expect(tokens).toMatchObject([
        { type: TokType.Plus, value: '+' },
        { type: TokType.Number, value: '08' },
        { type: TokType.Colon, value: ':' },
        { type: TokType.Number, value: '00' },
        { type: TokType.EOF },
      ]);
    });

    it('should lex negative timezone offset', () => {
      const tokens = lexTemporal('-05:30');
      expect(tokens).toMatchObject([
        { type: TokType.Dash, value: '-' },
        { type: TokType.Number, value: '05' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '30' },
        { type: TokType.EOF },
      ]);
    });

    it('should lex compact timezone offset', () => {
      const tokens = lexTemporal('+0900');
      expect(tokens).toMatchObject([
        { type: TokType.Plus, value: '+' },
        { type: TokType.Number, value: '0900' },
        { type: TokType.EOF },
      ]);
    });
  });

  describe('duration tokens', () => {
    it('should lex duration with P', () => {
      const tokens = lexTemporal('P1Y2M3D');
      expect(tokens).toMatchObject([
        { type: TokType.Ident, value: 'P' },
        { type: TokType.Number, value: '1' },
        { type: TokType.Ident, value: 'Y' },
        { type: TokType.Number, value: '2' },
        { type: TokType.Ident, value: 'M' },
        { type: TokType.Number, value: '3' },
        { type: TokType.Ident, value: 'D' },
        { type: TokType.EOF },
      ]);
    });

    it('should lex duration with time part', () => {
      const tokens = lexTemporal('PT2H30M');
      expect(tokens).toMatchObject([
        { type: TokType.Ident, value: 'P' },
        { type: TokType.T, value: 'T' },
        { type: TokType.Number, value: '2' },
        { type: TokType.Ident, value: 'H' },
        { type: TokType.Number, value: '30' },
        { type: TokType.Ident, value: 'M' },
        { type: TokType.EOF },
      ]);
    });

    it('should lex duration with fractional seconds', () => {
      const tokens = lexTemporal('PT1.5S');
      expect(tokens).toMatchObject([
        { type: TokType.Ident, value: 'P' },
        { type: TokType.T, value: 'T' },
        { type: TokType.Number, value: '1' },
        { type: TokType.Dot, value: '.' },
        { type: TokType.Number, value: '5' },
        { type: TokType.Ident, value: 'S' },
        { type: TokType.EOF },
      ]);
    });
  });

  describe('bracket annotations', () => {
    it('should lex simple bracket annotation', () => {
      const tokens = lexTemporal('[u-ca=gregory]');
      expect(tokens).toMatchObject([
        { type: TokType.LBracket },
        { type: TokType.BracketText, value: 'u-ca' },
        { type: TokType.Equals, value: '=' },
        { type: TokType.Ident, value: 'gregory' },
        { type: TokType.RBracket },
        { type: TokType.EOF },
      ]);
    });

    it('should lex timezone in brackets', () => {
      const tokens = lexTemporal('[Asia/Singapore]');
      expect(tokens).toMatchObject([
        { type: TokType.LBracket },
        { type: TokType.BracketText, value: 'Asia/Singapore' },
        { type: TokType.RBracket },
        { type: TokType.EOF },
      ]);
    });

    it('should lex multiple bracket groups', () => {
      const tokens = lexTemporal('[u-ca=iso8601][u-tz=UTC]');
      expect(tokens).toMatchObject([
        { type: TokType.LBracket },
        { type: TokType.BracketText, value: 'u-ca' },
        { type: TokType.Equals },
        { type: TokType.BracketText, value: 'iso8601' },
        { type: TokType.RBracket },
        { type: TokType.LBracket },
        { type: TokType.BracketText, value: 'u-tz' },
        { type: TokType.Equals },
        { type: TokType.Ident, value: 'UTC' },
        { type: TokType.RBracket },
        { type: TokType.EOF },
      ]);
    });

    it('should lex equals sign in brackets', () => {
      const tokens = lexTemporal('[key=value]');
      expect(tokens).toMatchObject([
        { type: TokType.LBracket },
        { type: TokType.Ident, value: 'key' },
        { type: TokType.Equals, value: '=' },
        { type: TokType.Ident, value: 'value' },
        { type: TokType.RBracket },
        { type: TokType.EOF },
      ]);
    });

    it('should distinguish Ident from BracketText', () => {
      const tokens = lexTemporal('[gregory]');
      // "gregory" is all letters, should be Ident
      expect(tokens).toMatchObject([
        { type: TokType.LBracket },
        { type: TokType.Ident, value: 'gregory' },
        { type: TokType.RBracket },
        { type: TokType.EOF },
      ]);
    });

    it('should lex BracketText with special chars', () => {
      const tokens = lexTemporal('[u-ca]');
      // "u-ca" has dash, should be BracketText
      expect(tokens).toMatchObject([
        { type: TokType.LBracket },
        { type: TokType.BracketText, value: 'u-ca' },
        { type: TokType.RBracket },
        { type: TokType.EOF },
      ]);
    });

    it('should lex critical flag in annotation', () => {
      const tokens = lexTemporal('[!u-ca=gregory]');
      expect(tokens).toMatchObject([
        { type: TokType.LBracket },
        { type: TokType.Exclamation, value: '!' },
        { type: TokType.BracketText, value: 'u-ca' },
        { type: TokType.Equals, value: '=' },
        { type: TokType.Ident, value: 'gregory' },
        { type: TokType.RBracket },
        { type: TokType.EOF },
      ]);
    });

    it('should lex critical flag with timezone-like annotation', () => {
      const tokens = lexTemporal('[!Asia/Singapore]');
      expect(tokens).toMatchObject([
        { type: TokType.LBracket },
        { type: TokType.Exclamation, value: '!' },
        { type: TokType.BracketText, value: 'Asia/Singapore' },
        { type: TokType.RBracket },
        { type: TokType.EOF },
      ]);
    });
  });

  describe('range tokens', () => {
    it('should lex slash separator', () => {
      const tokens = lexTemporal('2025-01-01/2025-01-31');
      expect(tokens).toMatchObject([
        { type: TokType.Number, value: '2025' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '01' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '01' },
        { type: TokType.Slash, value: '/' },
        { type: TokType.Number, value: '2025' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '01' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '31' },
        { type: TokType.EOF },
      ]);
    });

    it('should lex open-ended range', () => {
      const tokens = lexTemporal('/2025-12-31');
      expect(tokens).toMatchObject([
        { type: TokType.Slash, value: '/' },
        { type: TokType.Number, value: '2025' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '12' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '31' },
        { type: TokType.EOF },
      ]);
    });
  });

  describe('whitespace handling', () => {
    it('should skip whitespace', () => {
      const tokens = lexTemporal('2025 - 01 - 07');
      // Should have same tokens as without spaces
      expect(tokens).toMatchObject([
        { type: TokType.Number, value: '2025' },
        { type: TokType.Dash, value: '-' },
        { type: TokType.Number, value: '01' },
        { type: TokType.Dash, value: '-' },
        { type: TokType.Number, value: '07' },
        { type: TokType.EOF },
      ]);
    });
  });

  describe('error handling', () => {
    it('should throw on invalid character', () => {
      expect(() => lexTemporal('2025@01')).toThrow(LexError);
    });

    it('should throw on unterminated bracket', () => {
      expect(() => lexTemporal('[u-ca=gregory')).toThrow(LexError);
    });

    it('should throw on unexpected character in brackets', () => {
      expect(() => lexTemporal('[test#value]')).toThrow(LexError);
    });

    it('should include position in error', () => {
      try {
        lexTemporal('2025@01');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(LexError);
        expect((e as LexError).position).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('special characters', () => {
    it('should lex comma', () => {
      const tokens = lexTemporal('[a,b]');
      expect(tokens).toMatchObject([
        { type: TokType.LBracket },
        { type: TokType.Ident, value: 'a' },
        { type: TokType.Comma, value: ',' },
        { type: TokType.Ident, value: 'b' },
        { type: TokType.RBracket },
        { type: TokType.EOF },
      ]);
    });

    it('should lex underscore', () => {
      const tokens = lexTemporal('[test_value]');
      expect(tokens).toMatchObject([
        { type: TokType.LBracket },
        { type: TokType.Ident, value: 'test' },
        { type: TokType.Underscore, value: '_' },
        { type: TokType.Ident, value: 'value' },
        { type: TokType.RBracket },
        { type: TokType.EOF },
      ]);
    });

    it('should lex dot', () => {
      const tokens = lexTemporal('10.5');
      expect(tokens).toMatchObject([
        { type: TokType.Number, value: '10' },
        { type: TokType.Dot, value: '.' },
        { type: TokType.Number, value: '5' },
        { type: TokType.EOF },
      ]);
    });
  });

  describe('complex examples', () => {
    it('should lex full ISO 8601 datetime with timezone', () => {
      const tokens = lexTemporal('2025-01-07T10:00:00Z');
      expect(tokens).toMatchObject([
        { type: TokType.Number, value: '2025' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '01' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '07' },
        { type: TokType.T, value: 'T' },
        { type: TokType.Number, value: '10' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.Z, value: 'Z' },
        { type: TokType.EOF },
      ]);
    });

    it('should lex datetime with offset and annotations', () => {
      const tokens = lexTemporal('2025-01-07T10:00:00+08:00[u-ca=iso8601]');
      expect(tokens).toMatchObject([
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
        { type: TokType.Plus, value: '+' },
        { type: TokType.Number, value: '08' },
        { type: TokType.Colon },
        { type: TokType.Number, value: '00' },
        { type: TokType.LBracket },
        { type: TokType.BracketText, value: 'u-ca' },
        { type: TokType.Equals },
        { type: TokType.BracketText, value: 'iso8601' },
        { type: TokType.RBracket },
        { type: TokType.EOF },
      ]);
    });

    it('should lex date range', () => {
      const tokens = lexTemporal('2025-01-01/2025-01-31');
      expect(tokens).toMatchObject([
        { type: TokType.Number, value: '2025' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '01' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '01' },
        { type: TokType.Slash, value: '/' },
        { type: TokType.Number, value: '2025' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '01' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '31' },
        { type: TokType.EOF },
      ]);
    });

    it('should lex duration with date and time parts', () => {
      const tokens = lexTemporal('P10DT2H30M');
      expect(tokens).toMatchObject([
        { type: TokType.Ident, value: 'P' },
        { type: TokType.Number, value: '10' },
        { type: TokType.Ident, value: 'D' },
        { type: TokType.T, value: 'T' },
        { type: TokType.Number, value: '2' },
        { type: TokType.Ident, value: 'H' },
        { type: TokType.Number, value: '30' },
        { type: TokType.Ident, value: 'M' },
        { type: TokType.EOF },
      ]);
    });
  });

  describe('demo examples', () => {
    it('should lex datetime with calendar annotation', () => {
      const input = '2025-01-07T10:00:00Z[u-ca=gregory]';
      const raw = lexTemporal(input);

      expect(raw).toMatchObject([
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
        { type: TokType.Z },
        { type: TokType.LBracket },
        { type: TokType.BracketText, value: 'u-ca' },
        { type: TokType.Equals },
        { type: TokType.Ident, value: 'gregory' },
        { type: TokType.RBracket },
        { type: TokType.EOF },
      ]);

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
        { type: TokType.Z },
        { type: TokType.LBracket },
        { type: TokType.BracketText, value: 'u-ca' },
        { type: TokType.Equals },
        { type: TokType.Ident, value: 'gregory' },
        { type: TokType.RBracket },
        { type: TokType.EOF },
      ]);
    });

    it('should lex datetime with offset and multiple annotations', () => {
      const input = '2025-01-07T10:00:00+08:00[u-ca=iso8601][u-tz=Asia/Singapore]';
      const raw = lexTemporal(input);
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
        { type: TokType.LBracket },
        { type: TokType.BracketText, value: 'u-ca' },
        { type: TokType.Equals },
        { type: TokType.BracketText, value: 'iso8601' },
        { type: TokType.RBracket },
        { type: TokType.LBracket },
        { type: TokType.BracketText, value: 'u-tz' },
        { type: TokType.Equals },
        { type: TokType.BracketText, value: 'Asia/Singapore' },
        { type: TokType.RBracket },
        { type: TokType.EOF },
      ]);
    });

    it('should lex datetime with named timezone and annotation', () => {
      const input = '2025-01-07T10:00:00[Asia/Singapore][u-ca=hebrew]';
      const raw = lexTemporal(input);

      expect(raw).toMatchObject([
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
        { type: TokType.LBracket },
        { type: TokType.BracketText, value: 'Asia/Singapore' },
        { type: TokType.RBracket },
        { type: TokType.LBracket },
        { type: TokType.BracketText, value: 'u-ca' },
        { type: TokType.Equals },
        { type: TokType.Ident, value: 'hebrew' },
        { type: TokType.RBracket },
        { type: TokType.EOF },
      ]);
    });

    it('should lex date to duration range', () => {
      const input = '2025-01-01/P1M';
      const raw = lexTemporal(input);

      expect(raw).toMatchObject([
        { type: TokType.Number, value: '2025' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '01' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '01' },
        { type: TokType.Slash, value: '/' },
        { type: TokType.Ident, value: 'P' },
        { type: TokType.Number, value: '1' },
        { type: TokType.Ident, value: 'M' },
        { type: TokType.EOF },
      ]);
    });

    it('should lex date range', () => {
      const input = '2025-01-01/2025-01-31';
      const raw = lexTemporal(input);

      expect(raw).toMatchObject([
        { type: TokType.Number, value: '2025' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '01' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '01' },
        { type: TokType.Slash, value: '/' },
        { type: TokType.Number, value: '2025' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '01' },
        { type: TokType.Dash },
        { type: TokType.Number, value: '31' },
        { type: TokType.EOF },
      ]);
    });
  });
});
