// errors.test.ts
import { describe, expect, it } from 'vitest';

import { LexError, ParseError } from './errors';

describe('LexError', () => {
  it('should create error with message and position', () => {
    const error = new LexError('Unexpected character', 10);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(LexError);
    expect(error.position).toBe(10);
    expect(error.name).toBe('LexError');
  });

  it('should include position in message', () => {
    const error = new LexError('Invalid token', 5);
    expect(error.message).toContain('at position 5');
    expect(error.message).toContain('Invalid token');
  });

  it('should be throwable and catchable', () => {
    expect(() => {
      throw new LexError('Test error', 0);
    }).toThrow(LexError);
  });

  it('should preserve position property', () => {
    try {
      throw new LexError('Test', 42);
    } catch (e) {
      expect(e).toBeInstanceOf(LexError);
      if (e instanceof LexError) {
        expect(e.position).toBe(42);
      }
    }
  });
});

describe('ParseError', () => {
  it('should create error with message and position', () => {
    const error = new ParseError('Expected token', 3);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ParseError);
    expect(error.position).toBe(3);
    expect(error.name).toBe('ParseError');
  });

  it('should include position in message', () => {
    const error = new ParseError('Unexpected end', 7);
    expect(error.message).toContain('at token index 7');
    expect(error.message).toContain('Unexpected end');
  });

  it('should be throwable and catchable', () => {
    expect(() => {
      throw new ParseError('Test error', 0);
    }).toThrow(ParseError);
  });

  it('should preserve position property', () => {
    try {
      throw new ParseError('Test', 99);
    } catch (e) {
      expect(e).toBeInstanceOf(ParseError);
      if (e instanceof ParseError) {
        expect(e.position).toBe(99);
      }
    }
  });
});

describe('Error distinction', () => {
  it('should distinguish LexError from ParseError', () => {
    const lexError = new LexError('Lex', 0);
    const parseError = new ParseError('Parse', 0);

    expect(lexError).toBeInstanceOf(LexError);
    expect(lexError).not.toBeInstanceOf(ParseError);
    expect(parseError).toBeInstanceOf(ParseError);
    expect(parseError).not.toBeInstanceOf(LexError);
  });

  it('should both be instances of Error', () => {
    const lexError = new LexError('Lex', 0);
    const parseError = new ParseError('Parse', 0);

    expect(lexError).toBeInstanceOf(Error);
    expect(parseError).toBeInstanceOf(Error);
  });
});
