// parser-types.ts
// AST types for the parser

export type TemporalAst = RangeAst | ValueAst;

export type RangeAst = {
  kind: 'Range';
  start: ValueAst | null; // null => open start
  end: ValueAst | null; // null => open end
};

export type ValueAst = DateTimeAst | DurationAst | TimeAst;

export type DateTimeAst = {
  kind: 'DateTime';
  date: DateAst;
  time?: TimeAst;
  offset?: OffsetAst;
  timeZone?: TimeZoneAst;
  annotations: AnnotationAst[]; // bracket extensions like u-ca, u-tz, etc.
};

export type DateAst = {
  kind: 'Date';
  /**
   * Components are receivable by Temporal.PlainDate.from().
   * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainDate/from
   */
  year: number;
  month?: number;
  day?: number;
};

export type TimeAst = {
  kind: 'Time';
  /**
   * Components are receivable by Temporal.PlainTime.from().
   * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainTime/from
   */
  hour: number;
  minute: number;
  second?: number;
  fraction?: string; // fractional seconds (e.g., .123 for milliseconds)
};

export type OffsetAst =
  | { kind: 'UtcOffset' } // Z (UTC time, equivalent to +00:00)
  | {
      kind: 'NumericOffset';
      sign: '+' | '-'; // Direction of offset from UTC
      hours: number; // 0-23
      minutes: number; // 0-59
      raw: string; // Original string: +08:00, -0530, +09
    };

export type TimeZoneAst = {
  kind: 'IanaTimeZone'; // IANA timezone identifier
  id: string; // Asia/Singapore, America/New_York, Etc/UTC, etc.
  critical: boolean; // true if marked with ! (rare for timezones)
};

export type AnnotationAst = {
  kind: 'Annotation';
  // store raw tokens and a best-effort key/value parse:
  raw: string; // e.g. "u-ca=gregory" or "!u-ca=gregory"
  critical: boolean; // true if annotation starts with ! (IXDTF critical flag)
  pairs: Record<string, string | true>; // e.g. { "u-ca": "gregory" } or { "flag": true }
};

export type DurationAst = {
  kind: 'Duration';
  // ISO 8601 duration components (P1Y2M3DT4H5M6S)
  // Note: 'M' is disambiguated by position - months in date part, minutes in time part
  // Components are compatible with Temporal.Duration.from()
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/Duration/from
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  // fractional seconds (e.g., PT1.5S)
  secondsFraction?: string;
  raw: string;
  annotations: AnnotationAst[];
};
