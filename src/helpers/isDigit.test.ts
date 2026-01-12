import { describe, expect, it } from 'vitest';

import { isDigit } from './isDigit.js';

describe('isDigit', () => {
  it('should return true for digit characters 0-9', () => {
    expect(isDigit('0')).toBe(true);
    expect(isDigit('1')).toBe(true);
    expect(isDigit('2')).toBe(true);
    expect(isDigit('3')).toBe(true);
    expect(isDigit('4')).toBe(true);
    expect(isDigit('5')).toBe(true);
    expect(isDigit('6')).toBe(true);
    expect(isDigit('7')).toBe(true);
    expect(isDigit('8')).toBe(true);
    expect(isDigit('9')).toBe(true);
  });

  it('should return false for non-digit characters', () => {
    expect(isDigit('a')).toBe(false);
    expect(isDigit('Z')).toBe(false);
    expect(isDigit('!')).toBe(false);
    expect(isDigit(' ')).toBe(false);
    expect(isDigit('-')).toBe(false);
    expect(isDigit('+')).toBe(false);
    expect(isDigit('.')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isDigit('')).toBe(false);
  });

  it('should check single character', () => {
    // Function is designed for single character checks
    expect(isDigit('1')).toBe(true);
    expect(isDigit('9')).toBe(true);
    expect(isDigit('a')).toBe(false);
  });

  it('should return false for special digit characters', () => {
    // Unicode digits
    expect(isDigit('٠')).toBe(false); // Arabic-Indic digit zero
    expect(isDigit('①')).toBe(false); // Circled digit one
  });
});
