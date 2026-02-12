// parseTimeString.test.ts
import { describe, expect, it } from 'vitest';

import { ParseError } from './errors.js';
import { parseTimeString } from './parseTimeString.js';

describe('parseTimeString', () => {
  describe('24-hour format', () => {
    it('should parse basic 24-hour time', () => {
      const result = parseTimeString('14:30');
      expect(result).toEqual({
        kind: 'Time',
        hour: 14,
        minute: 30,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse midnight (00:00)', () => {
      const result = parseTimeString('00:00');
      expect(result).toEqual({
        kind: 'Time',
        hour: 0,
        minute: 0,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse noon (12:00)', () => {
      const result = parseTimeString('12:00');
      expect(result).toEqual({
        kind: 'Time',
        hour: 12,
        minute: 0,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse end of day (23:59)', () => {
      const result = parseTimeString('23:59');
      expect(result).toEqual({
        kind: 'Time',
        hour: 23,
        minute: 59,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse with leading zeros', () => {
      const result = parseTimeString('02:05');
      expect(result).toEqual({
        kind: 'Time',
        hour: 2,
        minute: 5,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse with seconds', () => {
      const result = parseTimeString('14:30:45');
      expect(result).toEqual({
        kind: 'Time',
        hour: 14,
        minute: 30,
        second: 45,
        fraction: undefined,
      });
    });

    it('should parse with fractional seconds (dot separator)', () => {
      const result = parseTimeString('14:30:45.123');
      expect(result).toEqual({
        kind: 'Time',
        hour: 14,
        minute: 30,
        second: 45,
        fraction: '123',
      });
    });

    it('should parse with fractional seconds (comma separator)', () => {
      const result = parseTimeString('14:30:45,123');
      expect(result).toEqual({
        kind: 'Time',
        hour: 14,
        minute: 30,
        second: 45,
        fraction: '123',
      });
    });

    it('should parse with high precision fractional seconds', () => {
      const result = parseTimeString('14:30:45.123456789');
      expect(result).toEqual({
        kind: 'Time',
        hour: 14,
        minute: 30,
        second: 45,
        fraction: '123456789',
      });
    });
  });

  describe('12-hour format with AM/PM', () => {
    it('should parse AM time', () => {
      const result = parseTimeString('2:30 AM');
      expect(result).toEqual({
        kind: 'Time',
        hour: 2,
        minute: 30,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse PM time', () => {
      const result = parseTimeString('2:30 PM');
      expect(result).toEqual({
        kind: 'Time',
        hour: 14,
        minute: 30,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse midnight (12:00 AM)', () => {
      const result = parseTimeString('12:00 AM');
      expect(result).toEqual({
        kind: 'Time',
        hour: 0,
        minute: 0,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse noon (12:00 PM)', () => {
      const result = parseTimeString('12:00 PM');
      expect(result).toEqual({
        kind: 'Time',
        hour: 12,
        minute: 0,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse 12:30 AM (after midnight)', () => {
      const result = parseTimeString('12:30 AM');
      expect(result).toEqual({
        kind: 'Time',
        hour: 0,
        minute: 30,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse 12:30 PM (after noon)', () => {
      const result = parseTimeString('12:30 PM');
      expect(result).toEqual({
        kind: 'Time',
        hour: 12,
        minute: 30,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse 11:59 PM (end of day)', () => {
      const result = parseTimeString('11:59 PM');
      expect(result).toEqual({
        kind: 'Time',
        hour: 23,
        minute: 59,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse lowercase am/pm', () => {
      const result = parseTimeString('2:30 pm');
      expect(result).toEqual({
        kind: 'Time',
        hour: 14,
        minute: 30,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse without space before AM/PM', () => {
      const result = parseTimeString('2:30PM');
      expect(result).toEqual({
        kind: 'Time',
        hour: 14,
        minute: 30,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse with periods (a.m./p.m.)', () => {
      const result = parseTimeString('2:30 p.m.');
      expect(result).toEqual({
        kind: 'Time',
        hour: 14,
        minute: 30,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse with seconds and AM/PM', () => {
      const result = parseTimeString('2:30:45 PM');
      expect(result).toEqual({
        kind: 'Time',
        hour: 14,
        minute: 30,
        second: 45,
        fraction: undefined,
      });
    });

    it('should parse with fractional seconds and AM/PM', () => {
      const result = parseTimeString('2:30:45.123 PM');
      expect(result).toEqual({
        kind: 'Time',
        hour: 14,
        minute: 30,
        second: 45,
        fraction: '123',
      });
    });

    it('should parse single digit hour', () => {
      const result = parseTimeString('9:00 AM');
      expect(result).toEqual({
        kind: 'Time',
        hour: 9,
        minute: 0,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse double digit hour', () => {
      const result = parseTimeString('10:00 AM');
      expect(result).toEqual({
        kind: 'Time',
        hour: 10,
        minute: 0,
        second: undefined,
        fraction: undefined,
      });
    });
  });

  describe('whitespace handling', () => {
    it('should handle leading whitespace', () => {
      const result = parseTimeString('  14:30');
      expect(result).toEqual({
        kind: 'Time',
        hour: 14,
        minute: 30,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should handle trailing whitespace', () => {
      const result = parseTimeString('14:30  ');
      expect(result).toEqual({
        kind: 'Time',
        hour: 14,
        minute: 30,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should handle whitespace around AM/PM', () => {
      const result = parseTimeString('2:30   PM');
      expect(result).toEqual({
        kind: 'Time',
        hour: 14,
        minute: 30,
        second: undefined,
        fraction: undefined,
      });
    });
  });

  describe('error handling with LLM-friendly messages', () => {
    it('should throw on empty string with helpful message', () => {
      try {
        parseTimeString('');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        const message = (e as ParseError).message;
        expect(message).toBe(
          'Empty time string. Expected format: "9:07 AM", "09:00", or "14:30" at token index 0',
        );
        console.log('Empty string error:', message);
      }
    });

    it('should throw on whitespace only with helpful message', () => {
      try {
        parseTimeString('   ');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        const message = (e as ParseError).message;
        expect(message).toBe(
          'Empty time string. Expected format: "9:07 AM", "09:00", or "14:30" at token index 0',
        );
        console.log('Whitespace error:', message);
      }
    });

    it('should throw on invalid format with examples', () => {
      try {
        parseTimeString('not a time');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        const message = (e as ParseError).message;
        expect(message).toBe(
          'Invalid time format: "not a time". Expected format: "HH:MM" (e.g., "09:00", "14:30") or "H:MM AM/PM" (e.g., "9:07 AM") at token index 0',
        );
        console.log('Invalid format error:', message);
      }
    });

    it('should parse ISO 8601 basic format: "1430"', () => {
      const result = parseTimeString('1430');
      expect(result).toEqual({
        kind: 'Time',
        hour: 14,
        minute: 30,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should throw on invalid hour in 24-hour format with helpful message', () => {
      try {
        parseTimeString('24:00');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        const message = (e as ParseError).message;
        expect(message).toBe(
          'Invalid hour for 24-hour format: 24. Hours must be between 0-23 (e.g., "09:00", "14:30"). For hours > 12, use 24-hour format or add AM/PM at token index 4',
        );
        console.log('Invalid 24h hour error:', message);
      }
    });

    it('should throw on negative hour with helpful message', () => {
      try {
        parseTimeString('-1:00');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        const message = (e as ParseError).message;
        expect(message).toBe(
          'Invalid time format: "-1:00". Expected format: "HH:MM" (e.g., "09:00", "14:30") or "H:MM AM/PM" (e.g., "9:07 AM") at token index 0',
        );
        console.log('Negative hour error:', message);
      }
    });

    it('should throw on invalid hour in 12-hour format (0) with examples', () => {
      try {
        parseTimeString('0:00 AM');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        const message = (e as ParseError).message;
        expect(message).toBe(
          'Invalid hour for 12-hour format: 0. Hours with AM/PM must be between 1-12 (e.g., "9:07 AM", not "0:07 AM" or "13:07 AM") at token index 5',
        );
        console.log('Invalid 12h hour (0) error:', message);
      }
    });

    it('should throw on hour > 12 in 12-hour format with helpful message', () => {
      try {
        parseTimeString('13:00 AM');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        const message = (e as ParseError).message;
        expect(message).toBe(
          'Invalid hour for 12-hour format: 13. Hours with AM/PM must be between 1-12 (e.g., "9:07 AM", not "0:07 AM" or "13:07 AM") at token index 5',
        );
        console.log('Invalid 12h hour (13) error:', message);
      }
    });

    it('should throw on invalid minute with range', () => {
      try {
        parseTimeString('12:60');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        const message = (e as ParseError).message;
        expect(message).toBe('Invalid minute: 60. Minutes must be between 00-59 at token index 3');
        console.log('Invalid minute error:', message);
      }
    });

    it('should throw on negative minute with helpful message', () => {
      try {
        parseTimeString('12:-1');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        const message = (e as ParseError).message;
        expect(message).toBe(
          'Invalid time format: "12:-1". Expected format: "HH:MM" (e.g., "09:00", "14:30") or "H:MM AM/PM" (e.g., "9:07 AM") at token index 2',
        );
        console.log('Negative minute error:', message);
      }
    });

    it('should throw on invalid second with range', () => {
      try {
        parseTimeString('12:00:60');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        const message = (e as ParseError).message;
        expect(message).toBe('Invalid second: 60. Seconds must be between 00-59 at token index 5');
        console.log('Invalid second error:', message);
      }
    });

    it('should throw on single digit minute with format hint', () => {
      try {
        parseTimeString('12:5');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        const message = (e as ParseError).message;
        expect(message).toBe(
          'Invalid time format: "12:5". Minutes must be 2 digits (e.g., "9:07" not "9:7") at token index 3',
        );
        console.log('Single digit minute error:', message);
      }
    });

    it('should throw on three digit hour with helpful message', () => {
      try {
        parseTimeString('123:00');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        const message = (e as ParseError).message;
        expect(message).toBe(
          'Invalid hour for 24-hour format: 123. Hours must be between 0-23 (e.g., "09:00", "14:30"). For hours > 12, use 24-hour format or add AM/PM at token index 4',
        );
        console.log('Three digit hour error:', message);
      }
    });

    it('should throw on invalid AM/PM marker with helpful message', () => {
      try {
        parseTimeString('9:00 XM');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        const message = (e as ParseError).message;
        expect(message).toBe(
          'Invalid time format: unexpected "XM". Use AM/PM for 12-hour format or omit for 24-hour format at token index 4',
        );
        console.log('Invalid AM/PM marker error:', message);
      }
    });
  });

  describe('edge cases', () => {
    it('should parse 1:00 AM (first hour after midnight)', () => {
      const result = parseTimeString('1:00 AM');
      expect(result).toEqual({
        kind: 'Time',
        hour: 1,
        minute: 0,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse 1:00 PM (first hour after noon)', () => {
      const result = parseTimeString('1:00 PM');
      expect(result).toEqual({
        kind: 'Time',
        hour: 13,
        minute: 0,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse 11:59 AM (last minute before noon)', () => {
      const result = parseTimeString('11:59 AM');
      expect(result).toEqual({
        kind: 'Time',
        hour: 11,
        minute: 59,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse 00:00:00 with seconds', () => {
      const result = parseTimeString('00:00:00');
      expect(result).toEqual({
        kind: 'Time',
        hour: 0,
        minute: 0,
        second: 0,
        fraction: undefined,
      });
    });

    it('should parse 23:59:59 with seconds', () => {
      const result = parseTimeString('23:59:59');
      expect(result).toEqual({
        kind: 'Time',
        hour: 23,
        minute: 59,
        second: 59,
        fraction: undefined,
      });
    });
  });

  describe('international formats', () => {
    it('should parse European format (comma separator)', () => {
      const result = parseTimeString('14:30:45,500');
      expect(result).toEqual({
        kind: 'Time',
        hour: 14,
        minute: 30,
        second: 45,
        fraction: '500',
      });
    });

    it('should parse 24-hour format common in Asia/Europe', () => {
      const result = parseTimeString('18:45');
      expect(result).toEqual({
        kind: 'Time',
        hour: 18,
        minute: 45,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse early morning time', () => {
      const result = parseTimeString('06:30');
      expect(result).toEqual({
        kind: 'Time',
        hour: 6,
        minute: 30,
        second: undefined,
        fraction: undefined,
      });
    });
  });

  describe('formats mentioned in JSDoc', () => {
    it('should parse locale time format: "9:07 AM"', () => {
      const result = parseTimeString('9:07 AM');
      expect(result).toEqual({
        kind: 'Time',
        hour: 9,
        minute: 7,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse 24h format with leading zero: "09:00"', () => {
      const result = parseTimeString('09:00');
      expect(result).toEqual({
        kind: 'Time',
        hour: 9,
        minute: 0,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse 24h format: "14:30"', () => {
      const result = parseTimeString('14:30');
      expect(result).toEqual({
        kind: 'Time',
        hour: 14,
        minute: 30,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse short 24h format (single digit hour): "9:00"', () => {
      const result = parseTimeString('9:00');
      expect(result).toEqual({
        kind: 'Time',
        hour: 9,
        minute: 0,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse 12h with lowercase period: "9:07 am"', () => {
      const result = parseTimeString('9:07 am');
      expect(result).toEqual({
        kind: 'Time',
        hour: 9,
        minute: 7,
        second: undefined,
        fraction: undefined,
      });
    });
  });

  describe('real-world examples', () => {
    it('should parse typical meeting time', () => {
      const result = parseTimeString('9:30 AM');
      expect(result).toEqual({
        kind: 'Time',
        hour: 9,
        minute: 30,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse lunch time', () => {
      const result = parseTimeString('12:30 PM');
      expect(result).toEqual({
        kind: 'Time',
        hour: 12,
        minute: 30,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse evening time', () => {
      const result = parseTimeString('7:45 PM');
      expect(result).toEqual({
        kind: 'Time',
        hour: 19,
        minute: 45,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse military time', () => {
      const result = parseTimeString('13:45');
      expect(result).toEqual({
        kind: 'Time',
        hour: 13,
        minute: 45,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse precise timestamp', () => {
      const result = parseTimeString('10:23:47.891');
      expect(result).toEqual({
        kind: 'Time',
        hour: 10,
        minute: 23,
        second: 47,
        fraction: '891',
      });
    });
  });

  describe('bare single-digit hours', () => {
    it('should parse single digit "0" as 00:00', () => {
      const result = parseTimeString('0');
      expect(result).toEqual({
        kind: 'Time',
        hour: 0,
        minute: 0,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse single digit "7" as 07:00', () => {
      const result = parseTimeString('7');
      expect(result).toEqual({
        kind: 'Time',
        hour: 7,
        minute: 0,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse single digit "9" as 09:00', () => {
      const result = parseTimeString('9');
      expect(result).toEqual({
        kind: 'Time',
        hour: 9,
        minute: 0,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse double digit "23" as 23:00', () => {
      const result = parseTimeString('23');
      expect(result).toEqual({
        kind: 'Time',
        hour: 23,
        minute: 0,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse "7 AM" as 7:00 AM', () => {
      const result = parseTimeString('7 AM');
      expect(result).toEqual({
        kind: 'Time',
        hour: 7,
        minute: 0,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse "12 PM" as 12:00 PM (noon)', () => {
      const result = parseTimeString('12 PM');
      expect(result).toEqual({
        kind: 'Time',
        hour: 12,
        minute: 0,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse "12 AM" as 12:00 AM (midnight)', () => {
      const result = parseTimeString('12 AM');
      expect(result).toEqual({
        kind: 'Time',
        hour: 0,
        minute: 0,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse "3 pm" (lowercase) as 15:00', () => {
      const result = parseTimeString('3 pm');
      expect(result).toEqual({
        kind: 'Time',
        hour: 15,
        minute: 0,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should throw on "0 AM" (invalid 12-hour format)', () => {
      try {
        parseTimeString('0 AM');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
      }
    });

    it('should throw on "24" (invalid 24-hour format)', () => {
      try {
        parseTimeString('24');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        const message = (e as ParseError).message;
        expect(message).toContain('Invalid hour for 24-hour format: 24');
      }
    });

    it('should throw on "13 AM" (invalid 12-hour format)', () => {
      try {
        parseTimeString('13 AM');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        const message = (e as ParseError).message;
        expect(message).toContain('Invalid hour for 12-hour format: 13');
      }
    });
  });

  describe('ISO 8601 basic format (compact, no colons)', () => {
    it('should parse "1430" as 14:30', () => {
      const result = parseTimeString('1430');
      expect(result).toEqual({
        kind: 'Time',
        hour: 14,
        minute: 30,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse "0900" as 09:00', () => {
      const result = parseTimeString('0900');
      expect(result).toEqual({
        kind: 'Time',
        hour: 9,
        minute: 0,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse "0000" as 00:00 (midnight)', () => {
      const result = parseTimeString('0000');
      expect(result).toEqual({
        kind: 'Time',
        hour: 0,
        minute: 0,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse "2359" as 23:59', () => {
      const result = parseTimeString('2359');
      expect(result).toEqual({
        kind: 'Time',
        hour: 23,
        minute: 59,
        second: undefined,
        fraction: undefined,
      });
    });

    it('should parse "143045" as 14:30:45 (with seconds)', () => {
      const result = parseTimeString('143045');
      expect(result).toEqual({
        kind: 'Time',
        hour: 14,
        minute: 30,
        second: 45,
        fraction: undefined,
      });
    });

    it('should parse "090000" as 09:00:00', () => {
      const result = parseTimeString('090000');
      expect(result).toEqual({
        kind: 'Time',
        hour: 9,
        minute: 0,
        second: 0,
        fraction: undefined,
      });
    });

    it('should parse "235959" as 23:59:59', () => {
      const result = parseTimeString('235959');
      expect(result).toEqual({
        kind: 'Time',
        hour: 23,
        minute: 59,
        second: 59,
        fraction: undefined,
      });
    });

    it('should parse "143045.123" with fractional seconds', () => {
      const result = parseTimeString('143045.123');
      expect(result).toEqual({
        kind: 'Time',
        hour: 14,
        minute: 30,
        second: 45,
        fraction: '123',
      });
    });

    it('should parse "143045,123" with comma separator', () => {
      const result = parseTimeString('143045,123');
      expect(result).toEqual({
        kind: 'Time',
        hour: 14,
        minute: 30,
        second: 45,
        fraction: '123',
      });
    });

    it('should throw on invalid basic format hour "2430"', () => {
      try {
        parseTimeString('2430');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        const message = (e as ParseError).message;
        expect(message).toContain('Invalid hour for 24-hour format: 24');
      }
    });

    it('should throw on invalid basic format minute "1460"', () => {
      try {
        parseTimeString('1460');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        const message = (e as ParseError).message;
        expect(message).toContain('Invalid minute: 60');
      }
    });

    it('should throw on invalid basic format second "143060"', () => {
      try {
        parseTimeString('143060');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        const message = (e as ParseError).message;
        expect(message).toContain('Invalid second: 60');
      }
    });

    it('should not confuse 3-digit number "123" with basic format', () => {
      // "123" should be treated as bare hour 123, which will fail validation
      try {
        parseTimeString('123');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        const message = (e as ParseError).message;
        expect(message).toContain('Invalid hour for 24-hour format: 123');
      }
    });

    it('should not confuse 5-digit number "12345" with basic format', () => {
      // "12345" should be treated as bare hour 12345, which will fail validation
      try {
        parseTimeString('12345');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        const message = (e as ParseError).message;
        expect(message).toContain('Invalid hour for 24-hour format: 12345');
      }
    });
  });
});
