// parser.ts
// A practical recursive-descent parser that works with the lexer we wrote.
// It builds an AST for a useful Temporal subset:
// - date/time (with optional fractional seconds)
// - timezone: Z | numeric offset (+08:00, -0530, +09) | bracket TZ id [Asia/Singapore]
// - duration: P... with optional T part
// - range: <expr> "/" <expr> where each side can be dateTime/date/duration, and either side may be empty (open range)
// - bracket extensions like [u-ca=gregory], [u-tz=Asia/Singapore], etc. (stored as key/value pairs)

import { combineTimezoneOffsets } from './combineTimezoneOffsets.js';
import { ParseError } from './errors.js';
import { toInt } from './helpers/toInt.js';
import { lexTemporal } from './lexer.js';
import { type AnyToken, CombinedTokType, TokType } from './lexer-types.js';
import { parseOffset } from './parseOffset.js';
import type {
  AnnotationAst,
  DateAst,
  DateTimeAst,
  DurationAst,
  OffsetAst,
  TemporalAst,
  TimeAst,
  TimeZoneAst,
  ValueAst,
} from './parser-types.js';

// ---------- Parser ----------

class Parser {
  private i = 0;
  constructor(private toks: AnyToken[]) {}

  private peek(k = 0): AnyToken {
    return this.toks[Math.min(this.i + k, this.toks.length - 1)]!;
  }
  private at(type: TokType | CombinedTokType): boolean {
    return this.peek().type === type;
  }
  private eat(type: TokType | CombinedTokType): AnyToken {
    const t = this.peek();
    if (t.type !== type) {
      throw new ParseError(`Expected ${type} but got ${t.type}`, this.i);
    }
    this.i++;
    return t;
  }
  private tryEat(type: TokType | CombinedTokType): AnyToken | null {
    if (this.at(type)) {
      return this.eat(type);
    }
    return null;
  }
  private eof(): boolean {
    return this.at(TokType.EOF);
  }

  // Top-level: parse a range if we see '/', otherwise a single value.
  parseTemporal(): TemporalAst {
    // Open-start range: "/..."
    if (this.tryEat(TokType.Slash)) {
      const end = this.parseValueOrNull(); // allow empty end too
      this.eat(TokType.EOF);
      return { kind: 'Range', start: null, end };
    }

    const first = this.parseValueOrNull();
    // If first is null, only valid if it's "/" (handled above). So error:
    if (!first) {
      throw new ParseError('Expected a value', this.i);
    }

    if (this.tryEat(TokType.Slash)) {
      const second = this.parseValueOrNull(); // open-ended allowed
      this.eat(TokType.EOF);
      return { kind: 'Range', start: first, end: second };
    }

    this.eat(TokType.EOF);
    return first;
  }

  private parseValueOrNull(): ValueAst | null {
    // Empty side for open range:
    if (this.at(TokType.EOF) || this.at(TokType.Slash) || this.at(TokType.RBracket)) {
      return null;
    }

    // Duration starts with IDENT "P" (as produced by lexer)
    if (this.at(TokType.Ident) && String(this.peek().value) === 'P') {
      return this.parseDuration();
    }

    // Otherwise parse a date/datetime (common case)
    return this.parseDateTime();
  }

  // -------- DateTime parsing --------
  // Supports:
  //  - YYYY
  //  - YYYY-MM
  //  - YYYY-MM-DD
  //  - + time part with T: YYYY-MM-DDTHH:MM[:SS[.fff]]
  //  - offset: Z | +08:00 | -0530
  //  - timezone: [Asia/Singapore] (first bracketed IANA timezone)
  //  - annotations: [u-ca=...][u-tz=...] (other bracketed content)
  private parseDateTime(): DateTimeAst {
    const date = this.parseDate();

    let time: DateTimeAst['time'] | undefined;

    // time separator is TokType.T (from lexer special-casing "T")
    if (this.tryEat(TokType.T)) {
      time = this.parseTime();
    }

    // Parse numeric offset (Z or +HH:MM)
    const offset = this.parseOffsetIfPresent();

    // Parse bracket groups: first IANA timezone becomes timeZone, rest are annotations
    const annotations: AnnotationAst[] = [];
    let timeZone: TimeZoneAst | undefined;

    while (this.at(TokType.LBracket)) {
      const { raw, critical, isLikelyTzId, pairs } = this.parseBracketGroup();

      // First timezone-like bracket becomes the timeZone field
      // Note: Even though IXDTF doesn't typically use critical flags for timezones,
      // we preserve it in case the input has it
      if (timeZone === undefined && isLikelyTzId) {
        // Strip leading ! from id (it's stored in the critical flag)
        const id = critical ? raw.slice(1) : raw;
        timeZone = { kind: 'IanaTimeZone', id, critical };
      } else {
        annotations.push({ kind: 'Annotation', raw, critical, pairs });
      }
    }

    return { kind: 'DateTime', date, time, offset, timeZone, annotations };
  }

  private parseDate(): DateAst {
    const yTok = this.eat(TokType.Number);
    const year = toInt(yTok.value, 'year', this.i);

    // Optional -MM
    if (!this.tryEat(TokType.Dash)) {
      return { kind: 'Date', year };
    }
    const mTok = this.eat(TokType.Number);
    const month = toInt(mTok.value, 'month', this.i);

    // Optional -DD
    if (!this.tryEat(TokType.Dash)) {
      return { kind: 'Date', year, month };
    }
    const dTok = this.eat(TokType.Number);
    const day = toInt(dTok.value, 'day', this.i);

    return { kind: 'Date', year, month, day };
  }

  private parseTime(): TimeAst {
    const hTok = this.eat(TokType.Number);
    const hour = toInt(hTok.value, 'hour', this.i);

    this.eat(TokType.Colon);
    const minTok = this.eat(TokType.Number);
    const minute = toInt(minTok.value, 'minute', this.i);

    let second: number | undefined;
    let fraction: string | undefined;

    if (this.tryEat(TokType.Colon)) {
      const sTok = this.eat(TokType.Number);
      second = toInt(sTok.value, 'second', this.i);

      if (this.tryEat(TokType.Dot)) {
        const fracTok = this.eat(TokType.Number);
        fraction = fracTok.value; // keep raw digits
      }
    }

    return { kind: 'Time', hour, minute, second, fraction };
  }

  /**
   * Parse timezone offset: Z | +HH:MM | -HH:MM
   *
   * Important semantic distinction per RFC 3339 and ISO 8601:
   *
   * - Z (Zulu time):
   *   Explicitly indicates UTC. Used when the time is known to be in UTC.
   *   Has no sign ambiguity - it's always UTC, never local time.
   *
   * - +00:00 (zero positive offset):
   *   Indicates local time at the prime meridian (UTC+0 timezone).
   *   Semantically different from Z - this is a local time that happens to match UTC.
   *
   * - -00:00 (zero negative offset):
   *   Per RFC 3339 section 4.3: indicates local time with unknown UTC offset.
   *   Used when the time is known to be local but the offset is not known.
   *   This is semantically very different from both Z and +00:00.
   *   https://www.rfc-editor.org/rfc/rfc3339.html#section-4.3
   *
   * We preserve this distinction by treating Z as UtcOffset (no sign, no components)
   * while +00:00 and -00:00 are NumericOffset (with sign and parsed components).
   */
  private parseOffsetIfPresent(): OffsetAst | undefined {
    if (this.tryEat(TokType.Z)) {
      return { kind: 'UtcOffset' };
    }

    // combined numeric offset token if you used combineTimezoneOffsets()
    if (this.at(CombinedTokType.TZOffset)) {
      const t = this.eat(CombinedTokType.TZOffset);
      return parseOffset(t.value, this.i);
    }

    return undefined;
  }

  // -------- Bracket group parsing --------
  // Consumes: [ ... ]
  // Returns:
  //  - raw inner text (reconstructed)
  //  - critical flag (true if starts with !)
  //  - pairs if it looks like key=value (or flags)
  //  - isLikelyTzId for things like [Asia/Singapore]
  private parseBracketGroup(): {
    raw: string;
    critical: boolean;
    pairs: Record<string, string | true>;
    isLikelyTzId: boolean;
  } {
    this.eat(TokType.LBracket);

    const parts: string[] = [];
    const pairs: Record<string, string | true> = {};

    // Check for critical flag (IXDTF: [!u-ca=gregory])
    const critical = this.tryEat(TokType.Exclamation) != null;
    if (critical) {
      parts.push('!');
    }

    // Gather tokens until RBracket
    while (!this.at(TokType.RBracket)) {
      if (this.eof()) {
        throw new ParseError('Unterminated bracket group', this.i);
      }

      const t = this.peek();
      this.i++;

      parts.push(String(t.value));
    }

    this.eat(TokType.RBracket);

    const raw = parts.join('');

    // Best-effort parse into key/value pairs:
    // Support "key=value" and "flag" and "k=v,k2=v2"
    // Strip leading ! if present for parsing
    const contentToParse = critical ? raw.slice(1) : raw;
    const segments = contentToParse
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const seg of segments) {
      const eq = seg.indexOf('=');
      if (eq === -1) {
        pairs[seg] = true;
      } else {
        const k = seg.slice(0, eq).trim();
        const v = seg.slice(eq + 1).trim();
        if (k) {
          pairs[k] = v || true;
        }
      }
    }

    // Heuristic: likely TZ ID if no '=' present and contains '/' (e.g. Asia/Singapore) or starts with Etc/
    // We now preserve critical flag even for timezones, so don't exclude them
    const isLikelyTzId =
      contentToParse.indexOf('=') === -1 &&
      (contentToParse.includes('/') || contentToParse.startsWith('Etc/'));

    // Note: If you want STRICTLY separate tz-id brackets vs extension brackets, do it here.

    return { raw, critical, pairs, isLikelyTzId };
  }

  // -------- Duration parsing --------
  // Grammar (subset):
  //   P (Y M W D)* (T (H M S)*)?
  // Examples:
  //   P1Y2M
  //   P3W
  //   P10DT2H30M
  //   PT1.5S
  private parseDuration(): DurationAst {
    // Collect raw string as we parse
    const rawParts: string[] = [];
    const annotations: AnnotationAst[] = [];

    const pTok = this.eat(TokType.Ident);
    if (String(pTok.value) !== 'P') {
      throw new ParseError("Duration must start with 'P'", this.i);
    }
    rawParts.push('P');

    let inTime = false;

    const dur: Omit<DurationAst, 'kind' | 'raw' | 'annotations'> = {};

    // Parse designators until we hit bracket annotations, slash, or EOF
    while (!this.eof() && !this.at(TokType.Slash) && !this.at(TokType.LBracket)) {
      // Time marker T
      if (this.tryEat(TokType.T)) {
        rawParts.push('T');
        inTime = true;
        continue;
      }

      // Expect a number (possibly with fraction for seconds)
      const numTok = this.tryEat(TokType.Number);
      if (!numTok) {
        break;
      } // be permissive; let parser user decide if this is error-worthy
      rawParts.push(numTok.value);

      let fraction: string | undefined;
      if (this.tryEat(TokType.Dot)) {
        rawParts.push('.');
        const fracTok = this.eat(TokType.Number);
        rawParts.push(fracTok.value);
        fraction = fracTok.value;
      }

      // Unit is IDENT (Y,M,W,D,H,M,S). Note M is months if !inTime else minutes.
      const unitTok = this.eat(TokType.Ident);
      const unit = String(unitTok.value);
      rawParts.push(unit);

      const n = toInt(numTok.value, 'duration number', this.i);

      if (!inTime) {
        if (unit === 'Y') {
          dur.years = (dur.years ?? 0) + n;
        } else if (unit === 'M') {
          dur.months = (dur.months ?? 0) + n;
        } else if (unit === 'W') {
          dur.weeks = (dur.weeks ?? 0) + n;
        } else if (unit === 'D') {
          dur.days = (dur.days ?? 0) + n;
        } else {
          throw new ParseError(`Invalid duration unit '${unit}' in date part`, this.i);
        }
      } else {
        if (unit === 'H') {
          dur.hours = (dur.hours ?? 0) + n;
        } else if (unit === 'M') {
          dur.minutes = (dur.minutes ?? 0) + n;
        } else if (unit === 'S') {
          dur.seconds = (dur.seconds ?? 0) + n;
          if (fraction !== undefined && fraction.length > 0) {
            dur.secondsFraction = fraction;
          }
        } else {
          throw new ParseError(`Invalid duration unit '${unit}' in time part`, this.i);
        }
      }
    }

    // bracket annotations after duration
    while (this.at(TokType.LBracket)) {
      const { raw, critical, pairs } = this.parseBracketGroup();
      annotations.push({ kind: 'Annotation', raw, critical, pairs });
    }

    return { kind: 'Duration', ...dur, raw: rawParts.join(''), annotations };
  }
}

// ---------- Public API ----------
export function parseTemporal(src: string): TemporalAst {
  const raw = lexTemporal(src);
  const toks = combineTimezoneOffsets(raw);
  const p = new Parser(toks);
  return p.parseTemporal();
}
