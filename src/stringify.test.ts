// stringify.test.ts
import { describe, expect, it } from 'vitest';

import { parseTemporal } from './parser.js';
import {
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

describe('stringifyDate', () => {
  it('should stringify year only', () => {
    const result = stringifyDate({ kind: 'Date', year: 2025 });
    expect(result).toBe('2025');
  });

  it('should stringify year-month', () => {
    const result = stringifyDate({ kind: 'Date', year: 2025, month: 1 });
    expect(result).toBe('2025-01');
  });

  it('should stringify full date', () => {
    const result = stringifyDate({ kind: 'Date', year: 2025, month: 1, day: 12 });
    expect(result).toBe('2025-01-12');
  });

  it('should pad single digits with zeros', () => {
    const result = stringifyDate({ kind: 'Date', year: 2025, month: 3, day: 7 });
    expect(result).toBe('2025-03-07');
  });

  it('should pad year to 4 digits', () => {
    const result = stringifyDate({ kind: 'Date', year: 999, month: 12, day: 31 });
    expect(result).toBe('0999-12-31');
  });
});

describe('stringifyTime', () => {
  it('should stringify hour and minute', () => {
    const result = stringifyTime({ kind: 'Time', hour: 10, minute: 30 });
    expect(result).toBe('10:30');
  });

  it('should stringify with seconds', () => {
    const result = stringifyTime({ kind: 'Time', hour: 10, minute: 30, second: 45 });
    expect(result).toBe('10:30:45');
  });

  it('should stringify with fractional seconds', () => {
    const result = stringifyTime({
      kind: 'Time',
      hour: 10,
      minute: 30,
      second: 45,
      fraction: '123',
    });
    expect(result).toBe('10:30:45.123');
  });

  it('should pad single digits with zeros', () => {
    const result = stringifyTime({ kind: 'Time', hour: 9, minute: 5, second: 3 });
    expect(result).toBe('09:05:03');
  });
});

describe('stringifyOffset', () => {
  it('should stringify UTC offset', () => {
    const result = stringifyOffset({ kind: 'UtcOffset' });
    expect(result).toBe('Z');
  });

  it('should stringify numeric offset in canonical format', () => {
    const result = stringifyOffset({
      kind: 'NumericOffset',
      sign: '+',
      hours: 8,
      minutes: 0,
      raw: '+08:00',
    });
    expect(result).toBe('+08:00');
  });

  it('should normalize compact format to canonical', () => {
    const result = stringifyOffset({
      kind: 'NumericOffset',
      sign: '+',
      hours: 5,
      minutes: 30,
      raw: '+0530',
    });
    expect(result).toBe('+05:30'); // Normalized to canonical
  });

  it('should normalize short format to canonical', () => {
    const result = stringifyOffset({
      kind: 'NumericOffset',
      sign: '+',
      hours: 9,
      minutes: 0,
      raw: '+09',
    });
    expect(result).toBe('+09:00'); // Normalized to canonical
  });

  it('should pad single digit hours and minutes', () => {
    const result = stringifyOffset({
      kind: 'NumericOffset',
      sign: '-',
      hours: 5,
      minutes: 30,
      raw: '-05:30',
    });
    expect(result).toBe('-05:30');
  });
});

describe('stringifyTimeZone', () => {
  it('should stringify IANA timezone', () => {
    const result = stringifyTimeZone({
      kind: 'IanaTimeZone',
      id: 'Asia/Singapore',
      critical: false,
    });
    expect(result).toBe('[Asia/Singapore]');
  });

  it('should stringify critical timezone', () => {
    const result = stringifyTimeZone({
      kind: 'IanaTimeZone',
      id: 'America/New_York',
      critical: true,
    });
    expect(result).toBe('[!America/New_York]');
  });
});

describe('stringifyAnnotation', () => {
  it('should stringify annotation', () => {
    const result = stringifyAnnotation({
      kind: 'Annotation',
      raw: 'u-ca=gregory',
      critical: false,
      pairs: { 'u-ca': 'gregory' },
    });
    expect(result).toBe('[u-ca=gregory]');
  });

  it('should stringify critical annotation', () => {
    const result = stringifyAnnotation({
      kind: 'Annotation',
      raw: '!u-ca=iso8601',
      critical: true,
      pairs: { 'u-ca': 'iso8601' },
    });
    expect(result).toBe('[!u-ca=iso8601]');
  });
});

describe('stringifyDateTime', () => {
  it('should stringify date only', () => {
    const result = stringifyDateTime({
      kind: 'DateTime',
      date: { kind: 'Date', year: 2025, month: 1, day: 12 },
      annotations: [],
    });
    expect(result).toBe('2025-01-12');
  });

  it('should stringify date with time', () => {
    const result = stringifyDateTime({
      kind: 'DateTime',
      date: { kind: 'Date', year: 2025, month: 1, day: 12 },
      time: { kind: 'Time', hour: 10, minute: 30, second: 45 },
      annotations: [],
    });
    expect(result).toBe('2025-01-12T10:30:45');
  });

  it('should stringify with UTC offset', () => {
    const result = stringifyDateTime({
      kind: 'DateTime',
      date: { kind: 'Date', year: 2025, month: 1, day: 12 },
      time: { kind: 'Time', hour: 10, minute: 0, second: 0 },
      offset: { kind: 'UtcOffset' },
      annotations: [],
    });
    expect(result).toBe('2025-01-12T10:00:00Z');
  });

  it('should stringify with numeric offset', () => {
    const result = stringifyDateTime({
      kind: 'DateTime',
      date: { kind: 'Date', year: 2025, month: 1, day: 12 },
      time: { kind: 'Time', hour: 10, minute: 0, second: 0 },
      offset: { kind: 'NumericOffset', sign: '+', hours: 8, minutes: 0, raw: '+08:00' },
      annotations: [],
    });
    expect(result).toBe('2025-01-12T10:00:00+08:00');
  });

  it('should stringify with timezone', () => {
    const result = stringifyDateTime({
      kind: 'DateTime',
      date: { kind: 'Date', year: 2025, month: 1, day: 12 },
      time: { kind: 'Time', hour: 10, minute: 0, second: 0 },
      offset: { kind: 'NumericOffset', sign: '+', hours: 8, minutes: 0, raw: '+08:00' },
      timeZone: { kind: 'IanaTimeZone', id: 'Asia/Singapore', critical: false },
      annotations: [],
    });
    expect(result).toBe('2025-01-12T10:00:00+08:00[Asia/Singapore]');
  });

  it('should stringify with annotations', () => {
    const result = stringifyDateTime({
      kind: 'DateTime',
      date: { kind: 'Date', year: 2025, month: 1, day: 12 },
      time: { kind: 'Time', hour: 10, minute: 0, second: 0 },
      offset: { kind: 'UtcOffset' },
      annotations: [
        { kind: 'Annotation', raw: 'u-ca=gregory', critical: false, pairs: {} },
        { kind: 'Annotation', raw: 'u-tz=UTC', critical: false, pairs: {} },
      ],
    });
    expect(result).toBe('2025-01-12T10:00:00Z[u-ca=gregory][u-tz=UTC]');
  });

  it('should stringify with fractional seconds', () => {
    const result = stringifyDateTime({
      kind: 'DateTime',
      date: { kind: 'Date', year: 2025, month: 1, day: 12 },
      time: { kind: 'Time', hour: 10, minute: 30, second: 45, fraction: '123456' },
      annotations: [],
    });
    expect(result).toBe('2025-01-12T10:30:45.123456');
  });
});

describe('stringifyDuration', () => {
  it('should stringify duration with date parts', () => {
    const result = stringifyDuration({
      kind: 'Duration',
      years: 1,
      months: 2,
      days: 3,
      raw: 'P1Y2M3D',
      annotations: [],
    });
    expect(result).toBe('P1Y2M3D');
  });

  it('should stringify duration with time parts', () => {
    const result = stringifyDuration({
      kind: 'Duration',
      hours: 4,
      minutes: 5,
      seconds: 6,
      raw: 'PT4H5M6S',
      annotations: [],
    });
    expect(result).toBe('PT4H5M6S');
  });

  it('should stringify combined duration', () => {
    const result = stringifyDuration({
      kind: 'Duration',
      years: 1,
      months: 2,
      days: 3,
      hours: 4,
      minutes: 5,
      seconds: 6,
      raw: 'P1Y2M3DT4H5M6S',
      annotations: [],
    });
    expect(result).toBe('P1Y2M3DT4H5M6S');
  });

  it('should stringify duration with fractional seconds', () => {
    const result = stringifyDuration({
      kind: 'Duration',
      seconds: 1,
      secondsFraction: '5',
      raw: 'PT1.5S',
      annotations: [],
    });
    expect(result).toBe('PT1.5S');
  });

  it('should stringify duration with weeks', () => {
    const result = stringifyDuration({
      kind: 'Duration',
      weeks: 3,
      raw: 'P3W',
      annotations: [],
    });
    expect(result).toBe('P3W');
  });

  it('should stringify duration with annotations', () => {
    const result = stringifyDuration({
      kind: 'Duration',
      days: 1,
      raw: 'P1D',
      annotations: [{ kind: 'Annotation', raw: 'u-ca=gregory', critical: false, pairs: {} }],
    });
    expect(result).toBe('P1D[u-ca=gregory]');
  });

  it('should reconstruct duration without raw', () => {
    const result = stringifyDuration({
      kind: 'Duration',
      years: 1,
      months: 2,
      annotations: [],
      raw: 'P1Y2M',
    });
    expect(result).toBe('P1Y2M');
  });

  it('should handle duration with only time parts', () => {
    const result = stringifyDuration({
      kind: 'Duration',
      hours: 2,
      minutes: 30,
      annotations: [],
      raw: 'PT2H30M',
    });
    expect(result).toBe('PT2H30M');
  });

  it('should include zero values if defined', () => {
    const result = stringifyDuration({
      kind: 'Duration',
      years: 0,
      months: 0,
      days: 1,
      annotations: [],
      raw: 'P0Y0M1D',
    });
    expect(result).toBe('P0Y0M1D');
  });

  it('should include PT0H (zero hours)', () => {
    const result = stringifyDuration({
      kind: 'Duration',
      hours: 0,
      annotations: [],
      raw: 'PT0H',
    });
    expect(result).toBe('PT0H');
  });

  it('should include PT0S (zero seconds)', () => {
    const result = stringifyDuration({
      kind: 'Duration',
      seconds: 0,
      annotations: [],
      raw: 'PT0S',
    });
    expect(result).toBe('PT0S');
  });
});

describe('stringifyRange', () => {
  it('should stringify closed range', () => {
    const result = stringifyRange({
      kind: 'Range',
      start: {
        kind: 'DateTime',
        date: { kind: 'Date', year: 2025, month: 1, day: 1 },
        annotations: [],
      },
      end: {
        kind: 'DateTime',
        date: { kind: 'Date', year: 2025, month: 12, day: 31 },
        annotations: [],
      },
    });
    expect(result).toBe('2025-01-01/2025-12-31');
  });

  it('should stringify open start range', () => {
    const result = stringifyRange({
      kind: 'Range',
      start: null,
      end: {
        kind: 'DateTime',
        date: { kind: 'Date', year: 2025, month: 12, day: 31 },
        annotations: [],
      },
    });
    expect(result).toBe('/2025-12-31');
  });

  it('should stringify open end range', () => {
    const result = stringifyRange({
      kind: 'Range',
      start: {
        kind: 'DateTime',
        date: { kind: 'Date', year: 2025, month: 1, day: 1 },
        annotations: [],
      },
      end: null,
    });
    expect(result).toBe('2025-01-01/');
  });

  it('should stringify range with duration', () => {
    const result = stringifyRange({
      kind: 'Range',
      start: {
        kind: 'DateTime',
        date: { kind: 'Date', year: 2025, month: 1, day: 1 },
        annotations: [],
      },
      end: {
        kind: 'Duration',
        years: 1,
        raw: 'P1Y',
        annotations: [],
      },
    });
    expect(result).toBe('2025-01-01/P1Y');
  });

  it('should stringify duration to duration range', () => {
    const result = stringifyRange({
      kind: 'Range',
      start: {
        kind: 'Duration',
        days: 1,
        raw: 'P1D',
        annotations: [],
      },
      end: {
        kind: 'Duration',
        days: 7,
        raw: 'P7D',
        annotations: [],
      },
    });
    expect(result).toBe('P1D/P7D');
  });
});

describe('stringifyTemporal', () => {
  it('should stringify datetime', () => {
    const ast = parseTemporal('2025-01-12T10:00:00+08:00');
    const result = stringifyTemporal(ast);
    expect(result).toBe('2025-01-12T10:00:00+08:00');
  });

  it('should stringify duration', () => {
    const ast = parseTemporal('P1Y2M3DT4H5M6S');
    const result = stringifyTemporal(ast);
    expect(result).toBe('P1Y2M3DT4H5M6S');
  });

  it('should stringify range', () => {
    const ast = parseTemporal('2025-01-01/2025-12-31');
    const result = stringifyTemporal(ast);
    expect(result).toBe('2025-01-01/2025-12-31');
  });
});

describe('round-trip parsing', () => {
  const testCases = [
    '2025',
    '2025-01',
    '2025-01-12',
    '2025-01-12T10:30',
    '2025-01-12T10:30:45',
    '2025-01-12T10:30:45.123',
    '2025-01-12T10:00:00Z',
    '2025-01-12T10:00:00+08:00',
    '2025-01-12T10:00:00-05:30',
    '2025-01-12T10:00:00+08:00[Asia/Singapore]',
    '2025-01-12T10:00:00Z[u-ca=gregory]',
    '2025-01-12T10:00:00+08:00[Asia/Singapore][u-ca=gregory]',
    'P1Y',
    'P1Y2M',
    'P1Y2M3D',
    'PT1H',
    'PT1H30M',
    'PT1H30M45S',
    'P1Y2M3DT4H5M6S',
    'PT1.5S',
    'P3W',
    '2025-01-01/2025-12-31',
    '/2025-12-31',
    '2025-01-01/',
    '2025-01-01/P1Y',
    'P1D/P7D',
  ];

  testCases.forEach((input) => {
    it(`should round-trip: ${input}`, () => {
      const ast = parseTemporal(input);
      const output = stringifyTemporal(ast);
      expect(output).toBe(input);
    });
  });
});

describe('format normalization', () => {
  it('should normalize compact offset to canonical', () => {
    const ast = parseTemporal('2025-01-12T10:00:00+0530');
    const result = stringifyTemporal(ast);
    expect(result).toBe('2025-01-12T10:00:00+05:30');
  });

  it('should normalize short offset to canonical', () => {
    const ast = parseTemporal('2025-01-12T10:00:00+09');
    const result = stringifyTemporal(ast);
    expect(result).toBe('2025-01-12T10:00:00+09:00');
  });

  it('should normalize negative compact offset', () => {
    const ast = parseTemporal('2025-01-12T10:00:00-0800');
    const result = stringifyTemporal(ast);
    expect(result).toBe('2025-01-12T10:00:00-08:00');
  });
});

describe('edge cases', () => {
  it('should handle year 0001', () => {
    const result = stringifyDate({ kind: 'Date', year: 1, month: 1, day: 1 });
    expect(result).toBe('0001-01-01');
  });

  it('should handle midnight', () => {
    const result = stringifyTime({ kind: 'Time', hour: 0, minute: 0, second: 0 });
    expect(result).toBe('00:00:00');
  });

  it('should handle empty duration (P only)', () => {
    const result = stringifyDuration({
      kind: 'Duration',
      raw: 'P',
      annotations: [],
    });
    expect(result).toBe('P');
  });

  it('should handle open-open range', () => {
    const result = stringifyRange({
      kind: 'Range',
      start: null,
      end: null,
    });
    expect(result).toBe('/');
  });

  it('should handle negative zero offset', () => {
    const ast = parseTemporal('2025-01-12T10:00:00-00:00');
    const result = stringifyTemporal(ast);
    expect(result).toBe('2025-01-12T10:00:00-00:00');
  });

  it('should handle very long fractional seconds', () => {
    const ast = parseTemporal('2025-01-12T10:30:45.123456789');
    const result = stringifyTemporal(ast);
    expect(result).toBe('2025-01-12T10:30:45.123456789');
  });
});

describe('RFC 9557 format', () => {
  it('should stringify date with calendar annotation', () => {
    const ast = parseTemporal('2025-01-12[u-ca=gregory]');
    const result = stringifyTemporal(ast);
    expect(result).toBe('2025-01-12[u-ca=gregory]');
  });

  it('should stringify date with different calendar systems', () => {
    const testCases = [
      '2025-01-12[u-ca=iso8601]',
      '2025-01-12[u-ca=hebrew]',
      '2025-01-12[u-ca=islamic]',
      '2025-01-12[u-ca=japanese]',
      '2025-01-12[u-ca=chinese]',
    ];

    testCases.forEach((input) => {
      const ast = parseTemporal(input);
      const result = stringifyTemporal(ast);
      expect(result).toBe(input);
    });
  });

  it('should stringify date with critical calendar annotation', () => {
    const ast = parseTemporal('2025-01-12[!u-ca=gregory]');
    const result = stringifyTemporal(ast);
    expect(result).toBe('2025-01-12[!u-ca=gregory]');
  });

  it('should stringify datetime with calendar annotation', () => {
    const ast = parseTemporal('2025-01-12T10:30:45[u-ca=gregory]');
    const result = stringifyTemporal(ast);
    expect(result).toBe('2025-01-12T10:30:45[u-ca=gregory]');
  });

  it('should stringify datetime with timezone and calendar annotation', () => {
    const ast = parseTemporal('2025-01-12T10:00:00+08:00[Asia/Singapore][u-ca=gregory]');
    const result = stringifyTemporal(ast);
    expect(result).toBe('2025-01-12T10:00:00+08:00[Asia/Singapore][u-ca=gregory]');
  });

  it('should stringify with multiple annotations', () => {
    const ast = parseTemporal('2025-01-12T10:00:00Z[u-ca=gregory][u-tz=UTC]');
    const result = stringifyTemporal(ast);
    expect(result).toBe('2025-01-12T10:00:00Z[u-ca=gregory][u-tz=UTC]');
  });

  it('should stringify year-month with calendar annotation', () => {
    const ast = parseTemporal('2025-01[u-ca=gregory]');
    const result = stringifyTemporal(ast);
    expect(result).toBe('2025-01[u-ca=gregory]');
  });

  it('should stringify year only with calendar annotation', () => {
    const ast = parseTemporal('2025[u-ca=gregory]');
    const result = stringifyTemporal(ast);
    expect(result).toBe('2025[u-ca=gregory]');
  });
});
