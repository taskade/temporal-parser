// parseOffset.test.ts
import { describe, expect, it } from 'vitest';

import { ParseError } from './errors.js';
import { parseOffset } from './parseOffset.js';

describe('parseOffset', () => {
  describe('standard format +HH:MM', () => {
    it('should parse +00:00', () => {
      const result = parseOffset('+00:00');
      expect(result).toEqual({
        kind: 'NumericOffset',
        sign: '+',
        hours: 0,
        minutes: 0,
        raw: '+00:00',
      });
    });

    it('should parse +08:00', () => {
      const result = parseOffset('+08:00');
      expect(result).toEqual({
        kind: 'NumericOffset',
        sign: '+',
        hours: 8,
        minutes: 0,
        raw: '+08:00',
      });
    });

    it('should parse -05:30', () => {
      const result = parseOffset('-05:30');
      expect(result).toEqual({
        kind: 'NumericOffset',
        sign: '-',
        hours: 5,
        minutes: 30,
        raw: '-05:30',
      });
    });

    it('should parse +12:45', () => {
      const result = parseOffset('+12:45');
      expect(result).toEqual({
        kind: 'NumericOffset',
        sign: '+',
        hours: 12,
        minutes: 45,
        raw: '+12:45',
      });
    });

    it('should parse -11:30', () => {
      const result = parseOffset('-11:30');
      expect(result).toEqual({
        kind: 'NumericOffset',
        sign: '-',
        hours: 11,
        minutes: 30,
        raw: '-11:30',
      });
    });

    it('should parse +14:00 (max valid positive)', () => {
      const result = parseOffset('+14:00');
      expect(result).toEqual({
        kind: 'NumericOffset',
        sign: '+',
        hours: 14,
        minutes: 0,
        raw: '+14:00',
      });
    });

    it('should parse -00:00 (negative zero)', () => {
      const result = parseOffset('-00:00');
      expect(result).toEqual({
        kind: 'NumericOffset',
        sign: '-',
        hours: 0,
        minutes: 0,
        raw: '-00:00',
      });
    });
  });

  describe('compact format +HHMM', () => {
    it('should parse +0000', () => {
      const result = parseOffset('+0000');
      expect(result).toEqual({
        kind: 'NumericOffset',
        sign: '+',
        hours: 0,
        minutes: 0,
        raw: '+0000',
      });
    });

    it('should parse +0800', () => {
      const result = parseOffset('+0800');
      expect(result).toEqual({
        kind: 'NumericOffset',
        sign: '+',
        hours: 8,
        minutes: 0,
        raw: '+0800',
      });
    });

    it('should parse -0530', () => {
      const result = parseOffset('-0530');
      expect(result).toEqual({
        kind: 'NumericOffset',
        sign: '-',
        hours: 5,
        minutes: 30,
        raw: '-0530',
      });
    });

    it('should parse +1245', () => {
      const result = parseOffset('+1245');
      expect(result).toEqual({
        kind: 'NumericOffset',
        sign: '+',
        hours: 12,
        minutes: 45,
        raw: '+1245',
      });
    });

    it('should parse +1400 (max valid positive)', () => {
      const result = parseOffset('+1400');
      expect(result).toEqual({
        kind: 'NumericOffset',
        sign: '+',
        hours: 14,
        minutes: 0,
        raw: '+1400',
      });
    });
  });

  describe('short format +HH', () => {
    it('should parse +00', () => {
      const result = parseOffset('+00');
      expect(result).toEqual({
        kind: 'NumericOffset',
        sign: '+',
        hours: 0,
        minutes: 0,
        raw: '+00',
      });
    });

    it('should parse +08', () => {
      const result = parseOffset('+08');
      expect(result).toEqual({
        kind: 'NumericOffset',
        sign: '+',
        hours: 8,
        minutes: 0,
        raw: '+08',
      });
    });

    it('should parse -05', () => {
      const result = parseOffset('-05');
      expect(result).toEqual({
        kind: 'NumericOffset',
        sign: '-',
        hours: 5,
        minutes: 0,
        raw: '-05',
      });
    });

    it('should parse +12', () => {
      const result = parseOffset('+12');
      expect(result).toEqual({
        kind: 'NumericOffset',
        sign: '+',
        hours: 12,
        minutes: 0,
        raw: '+12',
      });
    });

    it('should parse -11', () => {
      const result = parseOffset('-11');
      expect(result).toEqual({
        kind: 'NumericOffset',
        sign: '-',
        hours: 11,
        minutes: 0,
        raw: '-11',
      });
    });

    it('should parse +14 (max valid positive)', () => {
      const result = parseOffset('+14');
      expect(result).toEqual({
        kind: 'NumericOffset',
        sign: '+',
        hours: 14,
        minutes: 0,
        raw: '+14',
      });
    });
  });

  describe('error handling', () => {
    it('should throw on missing sign', () => {
      expect(() => parseOffset('08:00')).toThrow(ParseError);
      expect(() => parseOffset('08:00')).toThrow('must start with + or -');
    });

    it('should throw on invalid sign', () => {
      expect(() => parseOffset('*08:00')).toThrow(ParseError);
      expect(() => parseOffset('=08:00')).toThrow(ParseError);
    });

    it('should throw on empty offset after sign', () => {
      expect(() => parseOffset('+')).toThrow(ParseError);
      expect(() => parseOffset('-')).toThrow(ParseError);
    });

    it('should throw on invalid format (single digit)', () => {
      expect(() => parseOffset('+8')).toThrow(ParseError);
      expect(() => parseOffset('+8')).toThrow('Invalid offset format');
    });

    it('should throw on invalid format (three digits)', () => {
      expect(() => parseOffset('+080')).toThrow(ParseError);
    });

    it('should throw on invalid format (five digits)', () => {
      expect(() => parseOffset('+08000')).toThrow(ParseError);
    });

    it('should throw on hours out of range (too high)', () => {
      expect(() => parseOffset('+24:00')).toThrow(ParseError);
      expect(() => parseOffset('+24:00')).toThrow('hours must be 0-14');
    });

    it('should throw on hours out of range (negative)', () => {
      expect(() => parseOffset('+-1:00')).toThrow(ParseError);
    });

    it('should throw on minutes out of range (too high)', () => {
      expect(() => parseOffset('+08:60')).toThrow(ParseError);
      expect(() => parseOffset('+08:60')).toThrow('minutes must be 0-59');
    });

    it('should throw on minutes out of range (negative)', () => {
      expect(() => parseOffset('+08:-1')).toThrow(ParseError);
    });

    it('should throw on invalid colon format', () => {
      expect(() => parseOffset('+08:00:00')).toThrow(ParseError);
      expect(() => parseOffset('+08:00:00')).toThrow('expected HH:MM');
    });

    it('should throw on non-numeric hours', () => {
      expect(() => parseOffset('+XX:00')).toThrow(ParseError);
    });

    it('should throw on non-numeric minutes', () => {
      expect(() => parseOffset('+08:XX')).toThrow(ParseError);
    });

    it('should include position in error', () => {
      try {
        parseOffset('+99:00', 42);
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        expect((e as ParseError).position).toBe(42);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle leading zeros', () => {
      const result = parseOffset('+01:05');
      expect(result.hours).toBe(1);
      expect(result.minutes).toBe(5);
    });

    it('should handle +00:00 (UTC equivalent)', () => {
      const result = parseOffset('+00:00');
      expect(result).toEqual({
        kind: 'NumericOffset',
        sign: '+',
        hours: 0,
        minutes: 0,
        raw: '+00:00',
      });
    });

    it('should handle -00:00 (negative zero for unknown local offset)', () => {
      // RFC 3339: -00:00 indicates time is local but offset is unknown
      const result = parseOffset('-00:00');
      expect(result).toEqual({
        kind: 'NumericOffset',
        sign: '-',
        hours: 0,
        minutes: 0,
        raw: '-00:00',
      });
    });

    it('should preserve exact raw string', () => {
      expect(parseOffset('+08:00').raw).toBe('+08:00');
      expect(parseOffset('+0800').raw).toBe('+0800');
      expect(parseOffset('+08').raw).toBe('+08');
    });
  });

  describe('real-world timezones', () => {
    it('should parse Asia/Singapore offset (+08:00)', () => {
      const result = parseOffset('+08:00');
      expect(result.hours).toBe(8);
      expect(result.minutes).toBe(0);
    });

    it('should parse America/New_York EDT (-04:00)', () => {
      const result = parseOffset('-04:00');
      expect(result.hours).toBe(4);
      expect(result.minutes).toBe(0);
    });

    it('should parse America/New_York EST (-05:00)', () => {
      const result = parseOffset('-05:00');
      expect(result.hours).toBe(5);
      expect(result.minutes).toBe(0);
    });

    it('should parse Australia/Adelaide (+09:30)', () => {
      const result = parseOffset('+09:30');
      expect(result.hours).toBe(9);
      expect(result.minutes).toBe(30);
    });

    it('should parse Asia/Kathmandu (+05:45)', () => {
      const result = parseOffset('+05:45');
      expect(result.hours).toBe(5);
      expect(result.minutes).toBe(45);
    });

    it('should parse Pacific/Kiritimati (+14:00, easternmost)', () => {
      const result = parseOffset('+14:00');
      expect(result.hours).toBe(14);
      expect(result.minutes).toBe(0);
    });

    it('should parse America/Baker_Island (-12:00, westernmost)', () => {
      const result = parseOffset('-12:00');
      expect(result.hours).toBe(12);
      expect(result.minutes).toBe(0);
    });
  });

  describe('validation', () => {
    it('should validate hour range 0-14', () => {
      expect(() => parseOffset('+15:00')).toThrow('hours must be 0-14');
      expect(() => parseOffset('+16:00')).toThrow('hours must be 0-14');
      expect(() => parseOffset('+24:00')).toThrow('hours must be 0-14');
      expect(() => parseOffset('+25:00')).toThrow('hours must be 0-14');
      expect(() => parseOffset('+99:00')).toThrow('hours must be 0-14');
    });

    it('should validate hour range for negative offsets', () => {
      expect(() => parseOffset('-15:00')).toThrow('hours must be 0-14');
      expect(() => parseOffset('-20:00')).toThrow('hours must be 0-14');
    });

    it('should validate minute range 0-59', () => {
      expect(() => parseOffset('+08:60')).toThrow('minutes must be 0-59');
      expect(() => parseOffset('+08:61')).toThrow('minutes must be 0-59');
      expect(() => parseOffset('+08:99')).toThrow('minutes must be 0-59');
    });

    it('should accept all valid hours (0-14)', () => {
      for (let h = 0; h <= 14; h++) {
        const offset = `+${h.toString().padStart(2, '0')}:00`;
        const result = parseOffset(offset);
        expect(result.hours).toBe(h);
      }
    });

    it('should accept all valid minutes (0-59)', () => {
      for (let m = 0; m <= 59; m++) {
        const offset = `+08:${m.toString().padStart(2, '0')}`;
        const result = parseOffset(offset);
        expect(result.minutes).toBe(m);
      }
    });

    it('should accept maximum valid positive offset (+14:00)', () => {
      const result = parseOffset('+14:00');
      expect(result.hours).toBe(14);
      expect(result.minutes).toBe(0);
    });

    it('should accept maximum valid negative offset (-12:00)', () => {
      const result = parseOffset('-12:00');
      expect(result.hours).toBe(12);
      expect(result.minutes).toBe(0);
    });
  });
});
