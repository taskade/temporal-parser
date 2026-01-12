// parser.test.ts
import { describe, expect, it } from 'vitest';

import { ParseError } from './errors.js';
import { parseTemporal } from './parser.js';

describe('parseTemporal', () => {
  describe('date parsing', () => {
    it('should parse year only', () => {
      const ast = parseTemporal('2025');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        date: { year: 2025 },
        annotations: [],
      });
    });

    it('should parse year-month', () => {
      const ast = parseTemporal('2025-01');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        date: { year: 2025, month: 1 },
        annotations: [],
      });
    });

    it('should parse full date', () => {
      const ast = parseTemporal('2025-01-07');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        date: { year: 2025, month: 1, day: 7 },
        annotations: [],
      });
    });

    it('should parse BC date (negative year)', () => {
      const ast = parseTemporal('-0044-03-15');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        date: { kind: 'Date', year: -44, month: 3, day: 15 },
        annotations: [],
      });
    });

    it('should parse BC year only', () => {
      const ast = parseTemporal('-0100');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        date: { kind: 'Date', year: -100 },
        annotations: [],
      });
    });

    it('should parse BC year-month', () => {
      const ast = parseTemporal('-0753-04');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        date: { kind: 'Date', year: -753, month: 4 },
        annotations: [],
      });
    });

    it('should parse year 0 (1 BC in ISO 8601)', () => {
      const ast = parseTemporal('0000-01-01');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        date: { kind: 'Date', year: 0, month: 1, day: 1 },
        annotations: [],
      });
    });

    it('should parse BC datetime with time', () => {
      const ast = parseTemporal('-0044-03-15T12:00:00');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        date: { kind: 'Date', year: -44, month: 3, day: 15 },
        time: { kind: 'Time', hour: 12, minute: 0, second: 0 },
        annotations: [],
      });
    });

    it('should parse BC datetime with timezone', () => {
      const ast = parseTemporal('-0044-03-15T12:00:00Z');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        date: { kind: 'Date', year: -44, month: 3, day: 15 },
        time: { kind: 'Time', hour: 12, minute: 0, second: 0 },
        offset: { kind: 'UtcOffset' },
        annotations: [],
      });
    });
  });

  describe('time parsing', () => {
    it('should parse date with time HH:MM', () => {
      const ast = parseTemporal('2025-01-07T10:30');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        date: { year: 2025, month: 1, day: 7 },
        time: { hour: 10, minute: 30 },
        annotations: [],
      });
    });

    it('should parse date with time HH:MM:SS', () => {
      const ast = parseTemporal('2025-01-07T10:30:45');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        date: { year: 2025, month: 1, day: 7 },
        time: { hour: 10, minute: 30, second: 45 },
        annotations: [],
      });
    });

    it('should parse fractional seconds', () => {
      const ast = parseTemporal('2025-01-07T10:30:45.123');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        date: { year: 2025, month: 1, day: 7 },
        time: { hour: 10, minute: 30, second: 45, fraction: '123' },
        annotations: [],
      });
    });

    it('should parse fractional seconds with different precision', () => {
      const ast = parseTemporal('2025-01-07T10:30:45.123456789');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        time: { fraction: '123456789' },
      });
    });

    it('should parse fractional seconds with comma (European format)', () => {
      const ast = parseTemporal('2025-01-07T10:30:45,123');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        date: { year: 2025, month: 1, day: 7 },
        time: { hour: 10, minute: 30, second: 45, fraction: '123' },
        annotations: [],
      });
    });

    it('should parse fractional seconds with comma and high precision', () => {
      const ast = parseTemporal('2025-01-07T10:30:45,123456789');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        time: { fraction: '123456789' },
      });
    });
  });

  describe('timezone parsing', () => {
    it('should parse Z timezone', () => {
      const ast = parseTemporal('2025-01-07T10:00:00Z');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        offset: { kind: 'UtcOffset' },
      });
    });

    it('should parse positive offset +HH:MM', () => {
      const ast = parseTemporal('2025-01-07T10:00:00+08:00');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        offset: { kind: 'NumericOffset', sign: '+', hours: 8, minutes: 0, raw: '+08:00' },
      });
    });

    it('should parse negative offset -HH:MM', () => {
      const ast = parseTemporal('2025-01-07T10:00:00-05:30');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        offset: { kind: 'NumericOffset', sign: '-', hours: 5, minutes: 30, raw: '-05:30' },
      });
    });

    it('should parse compact offset +HHMM', () => {
      const ast = parseTemporal('2025-01-07T10:00:00+0530');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        offset: { kind: 'NumericOffset', sign: '+', hours: 5, minutes: 30, raw: '+0530' },
      });
    });

    it('should parse short offset +HH', () => {
      const ast = parseTemporal('2025-01-07T10:00:00+09');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        offset: { kind: 'NumericOffset', sign: '+', hours: 9, minutes: 0, raw: '+09' },
      });
    });

    it('should parse named timezone in brackets', () => {
      // When no offset is present, first bracketed IANA name becomes the timeZone
      const ast = parseTemporal('2025-01-07T10:00:00[Asia/Singapore]');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        timeZone: { kind: 'IanaTimeZone', id: 'Asia/Singapore', critical: false },
      });
    });

    it('should parse offset with named timezone in brackets (IXDTF format)', () => {
      // IXDTF format: offset field + timeZone field both populated
      // This is cleaner and more consistent than the old approach
      const ast = parseTemporal('2025-01-07T10:00:00+08:00[Asia/Singapore]');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        date: { year: 2025, month: 1, day: 7 },
        time: { hour: 10, minute: 0, second: 0 },
        offset: { kind: 'NumericOffset', sign: '+', hours: 8, minutes: 0, raw: '+08:00' },
        timeZone: { kind: 'IanaTimeZone', id: 'Asia/Singapore', critical: false },
      });
    });

    it('should parse Etc/ timezone', () => {
      const ast = parseTemporal('2025-01-07T10:00:00[Etc/UTC]');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        timeZone: { kind: 'IanaTimeZone', id: 'Etc/UTC', critical: false },
      });
    });
  });

  describe('annotation parsing', () => {
    it('should parse single annotation', () => {
      const ast = parseTemporal('2025-01-07T10:00:00Z[u-ca=gregory]');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        offset: { kind: 'UtcOffset' },
        annotations: [
          {
            kind: 'Annotation',
            raw: 'u-ca=gregory',
            critical: false,
            pairs: { 'u-ca': 'gregory' },
          },
        ],
      });
    });

    it('should parse multiple annotations', () => {
      const ast = parseTemporal('2025-01-07T10:00:00Z[u-ca=iso8601][u-tz=UTC]');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        annotations: [
          {
            kind: 'Annotation',
            raw: 'u-ca=iso8601',
            critical: false,
            pairs: { 'u-ca': 'iso8601' },
          },
          {
            kind: 'Annotation',
            raw: 'u-tz=UTC',
            critical: false,
            pairs: { 'u-tz': 'UTC' },
          },
        ],
      });
    });

    it('should parse annotation with multiple key-value pairs', () => {
      const ast = parseTemporal('2025-01-07[key1=val1,key2=val2]');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        annotations: [
          {
            critical: false,
            pairs: { key1: 'val1', key2: 'val2' },
          },
        ],
      });
    });

    it('should parse annotation with flag (no value)', () => {
      const ast = parseTemporal('2025-01-07[critical]');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        annotations: [
          {
            critical: false,
            pairs: { critical: true },
          },
        ],
      });
    });

    it('should prefer named timezone over annotation for slash-containing brackets', () => {
      const ast = parseTemporal('2025-01-07T10:00:00[Asia/Singapore]');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        timeZone: { kind: 'IanaTimeZone', id: 'Asia/Singapore', critical: false },
        annotations: [],
      });
    });

    it('should treat bracket as annotation if timezone already set', () => {
      // Second timezone-like bracket becomes annotation (only first one becomes timeZone)
      const ast = parseTemporal('2025-01-07T10:00:00[Asia/Singapore][America/New_York]');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        timeZone: { kind: 'IanaTimeZone', id: 'Asia/Singapore', critical: false },
        annotations: [
          {
            raw: 'America/New_York',
            critical: false,
          },
        ],
      });
    });

    it('should parse critical flag in annotation', () => {
      const ast = parseTemporal('2025-01-07T10:00:00Z[!u-ca=gregory]');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        offset: { kind: 'UtcOffset' },
        annotations: [
          {
            kind: 'Annotation',
            raw: '!u-ca=gregory',
            critical: true,
            pairs: { 'u-ca': 'gregory' },
          },
        ],
      });
    });

    it('should parse multiple annotations with mixed critical flags', () => {
      const ast = parseTemporal('2025-01-07T10:00:00Z[!u-ca=gregory][u-tz=UTC]');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        annotations: [
          {
            raw: '!u-ca=gregory',
            critical: true,
            pairs: { 'u-ca': 'gregory' },
          },
          {
            raw: 'u-tz=UTC',
            critical: false,
            pairs: { 'u-tz': 'UTC' },
          },
        ],
      });
    });

    it('should preserve critical flag for timezones', () => {
      // Critical timezones are rare but we preserve the flag
      const ast = parseTemporal('2025-01-07T10:00:00[!Asia/Singapore]');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        timeZone: {
          id: 'Asia/Singapore',
          critical: true,
        },
        annotations: [],
      });
    });
  });

  describe('duration parsing', () => {
    it('should parse years', () => {
      const ast = parseTemporal('P1Y');
      expect(ast).toMatchObject({
        kind: 'Duration',
        years: 1,
        raw: 'P1Y',
        annotations: [],
      });
    });

    it('should parse months', () => {
      const ast = parseTemporal('P2M');
      expect(ast).toMatchObject({
        kind: 'Duration',
        months: 2,
        raw: 'P2M',
      });
    });

    it('should parse weeks', () => {
      const ast = parseTemporal('P3W');
      expect(ast).toMatchObject({
        kind: 'Duration',
        weeks: 3,
        raw: 'P3W',
      });
    });

    it('should parse days', () => {
      const ast = parseTemporal('P10D');
      expect(ast).toMatchObject({
        kind: 'Duration',
        days: 10,
        raw: 'P10D',
      });
    });

    it('should parse combined date parts', () => {
      const ast = parseTemporal('P1Y2M3D');
      expect(ast).toMatchObject({
        kind: 'Duration',
        years: 1,
        months: 2,
        days: 3,
        raw: 'P1Y2M3D',
      });
    });

    it('should parse hours', () => {
      const ast = parseTemporal('PT2H');
      expect(ast).toMatchObject({
        kind: 'Duration',
        hours: 2,
        raw: 'PT2H',
      });
    });

    it('should parse minutes in time part', () => {
      const ast = parseTemporal('PT30M');
      expect(ast).toMatchObject({
        kind: 'Duration',
        minutes: 30,
        raw: 'PT30M',
      });
    });

    it('should parse seconds', () => {
      const ast = parseTemporal('PT45S');
      expect(ast).toMatchObject({
        kind: 'Duration',
        seconds: 45,
        raw: 'PT45S',
      });
    });

    it('should parse fractional seconds', () => {
      const ast = parseTemporal('PT1.5S');
      expect(ast).toMatchObject({
        kind: 'Duration',
        seconds: 1,
        secondsFraction: '5',
        raw: 'PT1.5S',
      });
    });

    it('should parse fractional seconds with comma (European format)', () => {
      const ast = parseTemporal('PT1,5S');
      expect(ast).toMatchObject({
        kind: 'Duration',
        seconds: 1,
        secondsFraction: '5',
        raw: 'PT1,5S',
      });
    });

    it('should parse combined time parts', () => {
      const ast = parseTemporal('PT2H30M45S');
      expect(ast).toMatchObject({
        kind: 'Duration',
        hours: 2,
        minutes: 30,
        seconds: 45,
        raw: 'PT2H30M45S',
      });
    });

    it('should parse date and time parts', () => {
      const ast = parseTemporal('P10DT2H30M');
      expect(ast).toMatchObject({
        kind: 'Duration',
        days: 10,
        hours: 2,
        minutes: 30,
        raw: 'P10DT2H30M',
      });
    });

    it('should parse full duration', () => {
      const ast = parseTemporal('P1Y2M3DT4H5M6S');
      expect(ast).toMatchObject({
        kind: 'Duration',
        years: 1,
        months: 2,
        days: 3,
        hours: 4,
        minutes: 5,
        seconds: 6,
        raw: 'P1Y2M3DT4H5M6S',
      });
    });

    it('should accumulate duplicate units', () => {
      const ast = parseTemporal('P1Y2Y');
      expect(ast).toMatchObject({
        kind: 'Duration',
        years: 3, // 1 + 2
      });
    });

    it('should parse duration with annotations', () => {
      const ast = parseTemporal('P1Y[critical]');
      expect(ast).toMatchObject({
        kind: 'Duration',
        years: 1,
        annotations: [
          {
            critical: false,
            pairs: { critical: true },
          },
        ],
      });
    });

    it('should parse duration with critical annotation', () => {
      const ast = parseTemporal('P1Y[!important]');
      expect(ast).toMatchObject({
        kind: 'Duration',
        years: 1,
        annotations: [
          {
            raw: '!important',
            critical: true,
            pairs: { important: true },
          },
        ],
      });
    });
  });

  describe('range parsing', () => {
    it('should parse date range', () => {
      const ast = parseTemporal('2025-01-01/2025-01-31');
      expect(ast).toMatchObject({
        kind: 'Range',
        start: {
          kind: 'DateTime',
          date: { year: 2025, month: 1, day: 1 },
        },
        end: {
          kind: 'DateTime',
          date: { year: 2025, month: 1, day: 31 },
        },
      });
    });

    it('should parse open-start range', () => {
      const ast = parseTemporal('/2025-12-31');
      expect(ast).toMatchObject({
        kind: 'Range',
        start: null,
        end: {
          kind: 'DateTime',
          date: { year: 2025, month: 12, day: 31 },
        },
      });
    });

    it('should parse open-end range', () => {
      const ast = parseTemporal('2025-01-01/');
      expect(ast).toMatchObject({
        kind: 'Range',
        start: {
          kind: 'DateTime',
          date: { year: 2025, month: 1, day: 1 },
        },
        end: null,
      });
    });

    it('should parse date to duration range', () => {
      const ast = parseTemporal('2025-01-01/P1M');
      expect(ast).toMatchObject({
        kind: 'Range',
        start: { kind: 'DateTime' },
        end: { kind: 'Duration', months: 1 },
      });
    });

    it('should parse duration to date range', () => {
      const ast = parseTemporal('P1M/2025-01-31');
      expect(ast).toMatchObject({
        kind: 'Range',
        start: { kind: 'Duration', months: 1 },
        end: { kind: 'DateTime' },
      });
    });

    it('should parse datetime range with timezones', () => {
      const ast = parseTemporal('2025-01-01T00:00:00Z/2025-01-31T23:59:59Z');
      expect(ast).toMatchObject({
        kind: 'Range',
        start: {
          kind: 'DateTime',
          offset: { kind: 'UtcOffset' },
        },
        end: {
          kind: 'DateTime',
          offset: { kind: 'UtcOffset' },
        },
      });
    });
  });

  describe('error handling', () => {
    it('should throw on empty input', () => {
      expect(() => parseTemporal('')).toThrow(ParseError);
    });

    it('should throw on invalid duration start', () => {
      expect(() => parseTemporal('X1Y')).toThrow(ParseError);
    });

    it('should throw on invalid duration unit in date part', () => {
      expect(() => parseTemporal('P1H')).toThrow(ParseError);
    });

    it('should throw on invalid duration unit in time part', () => {
      expect(() => parseTemporal('PT1Y')).toThrow(ParseError);
    });

    it('should throw on missing time separator colon', () => {
      expect(() => parseTemporal('2025-01-07T1000')).toThrow(ParseError);
    });

    it('should throw on incomplete time', () => {
      expect(() => parseTemporal('2025-01-07T10:')).toThrow(ParseError);
    });

    it('should throw on unterminated bracket', () => {
      // Lexer throws LexError for unterminated brackets
      expect(() => parseTemporal('2025-01-07[u-ca=gregory')).toThrow();
    });

    it('should throw on unexpected token', () => {
      expect(() => parseTemporal('2025-01-07 extra')).toThrow(ParseError);
    });

    it('should include position in error', () => {
      try {
        parseTemporal('2025-01-07T10:');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        expect((e as ParseError).position).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('complex examples', () => {
    it('should parse ISO 8601 datetime with offset and calendar', () => {
      const ast = parseTemporal('2025-01-07T10:00:00+08:00[u-ca=iso8601]');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        date: { year: 2025, month: 1, day: 7 },
        time: { hour: 10, minute: 0, second: 0 },
        offset: { kind: 'NumericOffset', sign: '+', hours: 8, minutes: 0, raw: '+08:00' },
        annotations: [
          {
            critical: false,
            pairs: { 'u-ca': 'iso8601' },
          },
        ],
      });
    });

    it('should parse datetime with named timezone and multiple annotations', () => {
      const ast = parseTemporal('2025-01-07T10:00:00[Asia/Singapore][u-ca=hebrew]');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        timeZone: { kind: 'IanaTimeZone', id: 'Asia/Singapore', critical: false },
        annotations: [
          {
            critical: false,
            pairs: { 'u-ca': 'hebrew' },
          },
        ],
      });
    });

    it('should parse datetime with Z and timezone annotation', () => {
      const ast = parseTemporal('2025-01-07T10:00:00Z[u-tz=Asia/Singapore]');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        offset: { kind: 'UtcOffset' },
        annotations: [
          {
            critical: false,
            pairs: { 'u-tz': 'Asia/Singapore' },
          },
        ],
      });
    });

    it('should parse complex duration', () => {
      const ast = parseTemporal('P1Y2M10DT2H30M15.5S');
      expect(ast).toMatchObject({
        kind: 'Duration',
        years: 1,
        months: 2,
        days: 10,
        hours: 2,
        minutes: 30,
        seconds: 15,
        secondsFraction: '5',
        raw: 'P1Y2M10DT2H30M15.5S',
      });
    });

    it('should parse range with different formats', () => {
      const ast = parseTemporal('2025-01-01T00:00:00Z/P1M');
      expect(ast).toMatchObject({
        kind: 'Range',
        start: {
          kind: 'DateTime',
          offset: { kind: 'UtcOffset' },
        },
        end: {
          kind: 'Duration',
          months: 1,
        },
      });
    });
  });

  describe('edge cases', () => {
    it('should parse year 0001', () => {
      const ast = parseTemporal('0001-01-01');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        date: { year: 1, month: 1, day: 1 },
      });
    });

    it('should parse large year', () => {
      const ast = parseTemporal('9999-12-31');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        date: { year: 9999, month: 12, day: 31 },
      });
    });

    it('should parse time with leading zeros', () => {
      const ast = parseTemporal('2025-01-07T00:00:00');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        time: { hour: 0, minute: 0, second: 0 },
      });
    });

    it('should parse minimal duration P', () => {
      // Note: P alone is technically invalid but parser is permissive
      const ast = parseTemporal('P0D');
      expect(ast).toMatchObject({
        kind: 'Duration',
        days: 0,
      });
    });

    it('should handle whitespace in input', () => {
      const ast = parseTemporal('2025 - 01 - 07');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        date: { year: 2025, month: 1, day: 7 },
      });
    });
  });

  describe('demo examples', () => {
    it('should parse date range', () => {
      const ast = parseTemporal('2025-01-01/2025-01-31');
      expect(ast).toMatchObject({
        kind: 'Range',
        start: { kind: 'DateTime', date: { year: 2025, month: 1, day: 1 } },
        end: { kind: 'DateTime', date: { year: 2025, month: 1, day: 31 } },
      });
    });

    it('should parse open-start range', () => {
      const ast = parseTemporal('/2025-12-31');
      expect(ast).toMatchObject({
        kind: 'Range',
        start: null,
        end: { kind: 'DateTime', date: { year: 2025, month: 12, day: 31 } },
      });
    });

    it('should parse datetime with Z and calendar', () => {
      const ast = parseTemporal('2025-01-07T10:00:00Z[u-ca=gregory]');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        offset: { kind: 'UtcOffset' },
        annotations: [{ pairs: { 'u-ca': 'gregory' } }],
      });
    });

    it('should parse datetime with offset and multiple annotations', () => {
      const ast = parseTemporal('2025-01-07T10:00:00+08:00[u-ca=iso8601][u-tz=Asia/Singapore]');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        offset: { kind: 'NumericOffset', sign: '+', hours: 8, minutes: 0, raw: '+08:00' },
        annotations: [{ pairs: { 'u-ca': 'iso8601' } }, { pairs: { 'u-tz': 'Asia/Singapore' } }],
      });
    });

    it('should parse datetime with named timezone and annotation', () => {
      const ast = parseTemporal('2025-01-07T10:00:00[Asia/Singapore][u-ca=hebrew]');
      expect(ast).toMatchObject({
        kind: 'DateTime',
        timeZone: { kind: 'IanaTimeZone', id: 'Asia/Singapore', critical: false },
        annotations: [{ pairs: { 'u-ca': 'hebrew' } }],
      });
    });

    it('should parse date to duration range', () => {
      const ast = parseTemporal('2025-01-01/P1M');
      expect(ast).toMatchObject({
        kind: 'Range',
        start: { kind: 'DateTime' },
        end: { kind: 'Duration', months: 1 },
      });
    });

    it('should parse complex duration', () => {
      const ast = parseTemporal('P10DT2H30M');
      expect(ast).toMatchObject({
        kind: 'Duration',
        days: 10,
        hours: 2,
        minutes: 30,
        raw: 'P10DT2H30M',
      });
    });
  });
});
