import { describe, expect, it } from 'vitest';

import { isAlpha } from './isAlpha.js';

describe('isAlpha', () => {
  it('should return true for uppercase letters A-Z', () => {
    expect(isAlpha('A')).toBe(true);
    expect(isAlpha('B')).toBe(true);
    expect(isAlpha('M')).toBe(true);
    expect(isAlpha('Z')).toBe(true);
  });

  it('should return true for lowercase letters a-z', () => {
    expect(isAlpha('a')).toBe(true);
    expect(isAlpha('b')).toBe(true);
    expect(isAlpha('m')).toBe(true);
    expect(isAlpha('z')).toBe(true);
  });

  it('should return false for digits', () => {
    expect(isAlpha('0')).toBe(false);
    expect(isAlpha('5')).toBe(false);
    expect(isAlpha('9')).toBe(false);
  });

  it('should return false for special characters', () => {
    expect(isAlpha('!')).toBe(false);
    expect(isAlpha('@')).toBe(false);
    expect(isAlpha(' ')).toBe(false);
    expect(isAlpha('-')).toBe(false);
    expect(isAlpha('_')).toBe(false);
    expect(isAlpha('.')).toBe(false);
    expect(isAlpha('/')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isAlpha('')).toBe(false);
  });

  it('should check single character', () => {
    // Function is designed for single character checks
    expect(isAlpha('a')).toBe(true);
    expect(isAlpha('Z')).toBe(true);
    expect(isAlpha('1')).toBe(false);
  });

  it('should return false for accented characters', () => {
    expect(isAlpha('é')).toBe(false);
    expect(isAlpha('ñ')).toBe(false);
    expect(isAlpha('ü')).toBe(false);
  });

  it('should return false for non-ASCII alphabetic characters', () => {
    expect(isAlpha('α')).toBe(false); // Greek alpha
    expect(isAlpha('א')).toBe(false); // Hebrew aleph
    expect(isAlpha('あ')).toBe(false); // Japanese hiragana
  });
});
