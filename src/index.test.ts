// index.test.ts
// Integration tests for the public API
import { describe, expect, it } from 'vitest';

import {
  CombinedTokType,
  combineTimezoneOffsets,
  LexError,
  lexTemporal,
  ParseError,
  parseTemporal,
  TokType,
} from './index.js';

describe('Public API exports', () => {
  it('should export lexTemporal function', () => {
    expect(typeof lexTemporal).toBe('function');
  });

  it('should export combineTimezoneOffsets function', () => {
    expect(typeof combineTimezoneOffsets).toBe('function');
  });

  it('should export parseTemporal function', () => {
    expect(typeof parseTemporal).toBe('function');
  });

  it('should export TokType enum', () => {
    expect(TokType).toBeDefined();
    expect(TokType.Number).toBe('Number');
    expect(TokType.EOF).toBe('EOF');
  });

  it('should export CombinedTokType enum', () => {
    expect(CombinedTokType).toBeDefined();
    expect(CombinedTokType.TZOffset).toBe('TZOffset');
  });

  it('should export LexError class', () => {
    expect(LexError).toBeDefined();
    const error = new LexError('test', 0);
    expect(error).toBeInstanceOf(Error);
  });

  it('should export ParseError class', () => {
    expect(ParseError).toBeDefined();
    const error = new ParseError('test', 0);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('End-to-end integration', () => {
  it('should lex and parse a simple date', () => {
    const tokens = lexTemporal('2025-01-07');
    expect(tokens).toMatchObject([
      { type: TokType.Number, value: '2025' },
      { type: TokType.Dash },
      { type: TokType.Number, value: '01' },
      { type: TokType.Dash },
      { type: TokType.Number, value: '07' },
      { type: TokType.EOF },
    ]);

    const ast = parseTemporal('2025-01-07');
    expect(ast).toMatchObject({
      kind: 'DateTime',
      date: { year: 2025, month: 1, day: 7 },
      annotations: [],
    });
  });

  it('should lex and parse a datetime with timezone', () => {
    const input = '2025-01-07T10:00:00+08:00';
    const tokens = lexTemporal(input);
    const combined = combineTimezoneOffsets(tokens);

    const offsetToken = combined.find((t) => t.type === CombinedTokType.TZOffset);
    expect(offsetToken).toMatchObject({
      type: CombinedTokType.TZOffset,
      value: '+08:00',
    });

    const ast = parseTemporal(input);
    expect(ast).toMatchObject({
      kind: 'DateTime',
      date: { year: 2025, month: 1, day: 7 },
      time: { hour: 10, minute: 0, second: 0 },
      offset: { kind: 'NumericOffset', sign: '+', hours: 8, minutes: 0, raw: '+08:00' },
      annotations: [],
    });
  });

  it('should lex and parse a duration', () => {
    const input = 'P1Y2M3D';
    const tokens = lexTemporal(input);
    expect(tokens[0]).toMatchObject({
      type: TokType.Ident,
      value: 'P',
    });

    const ast = parseTemporal(input);
    expect(ast).toMatchObject({
      kind: 'Duration',
      years: 1,
      months: 2,
      days: 3,
      raw: 'P1Y2M3D',
      annotations: [],
    });
  });

  it('should lex and parse a range', () => {
    const input = '2025-01-01/2025-12-31';
    const tokens = lexTemporal(input);
    const slashToken = tokens.find((t) => t.type === TokType.Slash);
    expect(slashToken).toMatchObject({
      type: TokType.Slash,
      value: '/',
    });

    const ast = parseTemporal(input);
    expect(ast).toMatchObject({
      kind: 'Range',
      start: {
        kind: 'DateTime',
        date: { year: 2025, month: 1, day: 1 },
      },
      end: {
        kind: 'DateTime',
        date: { year: 2025, month: 12, day: 31 },
      },
    });
  });

  it('should handle errors consistently', () => {
    expect(() => lexTemporal('2025@01')).toThrow(LexError);
    expect(() => parseTemporal('X1Y')).toThrow(ParseError);
  });
});

describe('Real-world examples', () => {
  it('should parse TC39 Temporal examples', () => {
    const examples = [
      '2025-01-07T10:00:00Z',
      '2025-01-07T10:00:00+08:00',
      '2025-01-07T10:00:00[Asia/Singapore]',
      '2025-01-07T10:00:00Z[u-ca=gregory]',
      'P1Y2M3DT4H5M6S',
      '2025-01-01/2025-12-31',
    ];

    for (const example of examples) {
      expect(() => parseTemporal(example)).not.toThrow();
      const ast = parseTemporal(example);
      expect(ast).toBeDefined();
    }
  });

  it('should parse IXDTF examples', () => {
    const examples = [
      '2025-01-07T10:00:00+08:00[u-ca=iso8601][u-tz=Asia/Singapore]',
      '2025-01-07T10:00:00[Asia/Singapore][u-ca=hebrew]',
      '2025-01-07T10:00:00.123456789Z',
    ];

    for (const example of examples) {
      expect(() => parseTemporal(example)).not.toThrow();
      const ast = parseTemporal(example);
      expect(ast).toBeDefined();
    }
  });

  it('should parse duration examples', () => {
    const examples = [
      'P1Y',
      'P1M',
      'P1W',
      'P1D',
      'PT1H',
      'PT1M',
      'PT1S',
      'PT1.5S',
      'P1Y2M3DT4H5M6.789S',
    ];

    for (const example of examples) {
      const ast = parseTemporal(example);
      expect(ast).toMatchObject({
        kind: 'Duration',
      });
    }
  });

  it('should parse range examples', () => {
    const examples = [
      '2025-01-01/2025-01-31',
      '/2025-12-31',
      '2025-01-01/',
      '2025-01-01/P1M',
      'P1Y/2025-12-31',
    ];

    for (const example of examples) {
      const ast = parseTemporal(example);
      expect(ast).toMatchObject({
        kind: 'Range',
      });
    }
  });
});

describe('Type safety', () => {
  it('should provide proper type discrimination for AST', () => {
    const ast = parseTemporal('2025-01-07');
    expect(ast).toMatchObject({
      kind: 'DateTime',
      date: { year: 2025 },
    });
  });

  it('should provide proper type discrimination for timezone', () => {
    const ast = parseTemporal('2025-01-07T10:00:00+08:00[Asia/Singapore]');
    expect(ast).toMatchObject({
      kind: 'DateTime',
      offset: { kind: 'NumericOffset', sign: '+', hours: 8, minutes: 0, raw: '+08:00' },
      timeZone: { kind: 'IanaTimeZone', id: 'Asia/Singapore', critical: false },
    });
    // Type discrimination works
    if (ast.kind === 'DateTime') {
      expect(ast.offset?.kind).toBe('NumericOffset');
      if (ast.offset?.kind === 'NumericOffset') {
        expect(ast.offset.sign).toBe('+');
        expect(ast.offset.hours).toBe(8);
        expect(ast.offset.minutes).toBe(0);
        expect(ast.offset.raw).toBe('+08:00');
      }
      expect(ast.timeZone?.kind).toBe('IanaTimeZone');
      expect(ast.timeZone?.id).toBe('Asia/Singapore');
      expect(ast.timeZone?.critical).toBe(false);
    }
  });
});
