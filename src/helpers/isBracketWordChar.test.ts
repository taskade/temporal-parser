import { describe, expect, it } from 'vitest';

import { isBracketWordChar } from './isBracketWordChar.js';

describe('isBracketWordChar', () => {
  describe('should return true for alphabetic characters', () => {
    it('uppercase letters', () => {
      expect(isBracketWordChar('A')).toBe(true);
      expect(isBracketWordChar('Z')).toBe(true);
      expect(isBracketWordChar('M')).toBe(true);
    });

    it('lowercase letters', () => {
      expect(isBracketWordChar('a')).toBe(true);
      expect(isBracketWordChar('z')).toBe(true);
      expect(isBracketWordChar('m')).toBe(true);
    });
  });

  describe('should return true for digits', () => {
    it('all digits 0-9', () => {
      expect(isBracketWordChar('0')).toBe(true);
      expect(isBracketWordChar('5')).toBe(true);
      expect(isBracketWordChar('9')).toBe(true);
    });
  });

  describe('should return true for special bracket characters', () => {
    it('dash (for annotations like u-ca)', () => {
      expect(isBracketWordChar('-')).toBe(true);
    });

    it('slash (for timezone IDs like Asia/Singapore)', () => {
      expect(isBracketWordChar('/')).toBe(true);
    });

    it('plus (for timezones like Etc/GMT+8)', () => {
      expect(isBracketWordChar('+')).toBe(true);
    });

    it('dot (for some TZ-ish values)', () => {
      expect(isBracketWordChar('.')).toBe(true);
    });
  });

  describe('should return false for other special characters', () => {
    it('punctuation not allowed in bracket words', () => {
      expect(isBracketWordChar('!')).toBe(false);
      expect(isBracketWordChar('@')).toBe(false);
      expect(isBracketWordChar('#')).toBe(false);
      expect(isBracketWordChar('$')).toBe(false);
      expect(isBracketWordChar('%')).toBe(false);
      expect(isBracketWordChar('^')).toBe(false);
      expect(isBracketWordChar('&')).toBe(false);
      expect(isBracketWordChar('*')).toBe(false);
      expect(isBracketWordChar('(')).toBe(false);
      expect(isBracketWordChar(')')).toBe(false);
    });

    it('brackets themselves', () => {
      expect(isBracketWordChar('[')).toBe(false);
      expect(isBracketWordChar(']')).toBe(false);
    });

    it('equals sign', () => {
      expect(isBracketWordChar('=')).toBe(false);
    });

    it('comma', () => {
      expect(isBracketWordChar(',')).toBe(false);
    });

    it('colon', () => {
      expect(isBracketWordChar(':')).toBe(false);
    });

    it('underscore', () => {
      expect(isBracketWordChar('_')).toBe(false);
    });

    it('whitespace', () => {
      expect(isBracketWordChar(' ')).toBe(false);
      expect(isBracketWordChar('\t')).toBe(false);
      expect(isBracketWordChar('\n')).toBe(false);
    });
  });

  describe('should return false for empty string', () => {
    it('empty string', () => {
      expect(isBracketWordChar('')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should check single character', () => {
      // Function is designed for single character checks
      expect(isBracketWordChar('A')).toBe(true);
      expect(isBracketWordChar('u')).toBe(true);
      expect(isBracketWordChar('i')).toBe(true);
      expect(isBracketWordChar('=')).toBe(false);
    });

    it('should handle all valid bracket word characters', () => {
      expect(isBracketWordChar('u')).toBe(true); // start of u-ca
      expect(isBracketWordChar('A')).toBe(true); // start of Asia/Singapore
      expect(isBracketWordChar('i')).toBe(true); // start of iso8601
      expect(isBracketWordChar('G')).toBe(true); // start of GMT+8
      expect(isBracketWordChar('-')).toBe(true); // dash in u-ca
      expect(isBracketWordChar('/')).toBe(true); // slash in Asia/Singapore
      expect(isBracketWordChar('8')).toBe(true); // digit in iso8601
      expect(isBracketWordChar('+')).toBe(true); // plus in GMT+8
    });
  });
});
