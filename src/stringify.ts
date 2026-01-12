// stringify.ts
// Convert AST back to temporal string representation

import type {
  AnnotationAst,
  DateAst,
  DateTimeAst,
  DurationAst,
  OffsetAst,
  RangeAst,
  TemporalAst,
  TimeAst,
  TimeZoneAst,
} from './parser-types.js';

/**
 * Convert a temporal AST back to its string representation.
 *
 * @param ast - The AST to stringify
 * @returns ISO 8601 / IXDTF formatted string
 *
 * @example
 * ```typescript
 * const ast = parseTemporal('2025-01-12T10:00:00+08:00');
 * const str = stringifyTemporal(ast);
 * // '2025-01-12T10:00:00+08:00'
 * ```
 */
export function stringifyTemporal(ast: TemporalAst): string {
  if (ast.kind === 'Range') {
    return stringifyRange(ast);
  }
  if (ast.kind === 'Duration') {
    return stringifyDuration(ast);
  }
  return stringifyDateTime(ast);
}

/**
 * Stringify a date AST to ISO 8601 format.
 *
 * @param date - The date AST
 * @returns Date string (YYYY, YYYY-MM, or YYYY-MM-DD)
 */
export function stringifyDate(date: DateAst): string {
  const parts: string[] = [date.year.toString().padStart(4, '0')];

  if (date.month != null) {
    parts.push(date.month.toString().padStart(2, '0'));

    if (date.day != null) {
      parts.push(date.day.toString().padStart(2, '0'));
    }
  }

  return parts.join('-');
}

/**
 * Stringify a time AST to ISO 8601 format.
 *
 * @param time - The time AST
 * @returns Time string (HH:MM, HH:MM:SS, or HH:MM:SS.fff)
 */
export function stringifyTime(time: TimeAst): string {
  const parts: string[] = [
    time.hour.toString().padStart(2, '0'),
    time.minute.toString().padStart(2, '0'),
  ];

  if (time.second != null) {
    let secondStr = time.second.toString().padStart(2, '0');
    if (time.fraction != null) {
      secondStr += `.${time.fraction}`;
    }
    parts.push(secondStr);
  }

  return parts.join(':');
}

/**
 * Stringify a timezone offset AST to canonical format.
 *
 * @param offset - The offset AST
 * @returns Offset string in canonical format (Z or ±HH:MM)
 */
export function stringifyOffset(offset: OffsetAst): string {
  if (offset.kind === 'UtcOffset') {
    return 'Z';
  }
  // Return canonical format: +HH:MM or -HH:MM
  const hours = offset.hours.toString().padStart(2, '0');
  const minutes = offset.minutes.toString().padStart(2, '0');
  return `${offset.sign}${hours}:${minutes}`;
}

/**
 * Stringify a timezone AST.
 *
 * @param timeZone - The timezone AST
 * @returns Timezone string [Asia/Singapore] or [!Asia/Singapore]
 */
export function stringifyTimeZone(timeZone: TimeZoneAst): string {
  const id = timeZone.critical ? `!${timeZone.id}` : timeZone.id;
  return `[${id}]`;
}

/**
 * Stringify an annotation AST.
 *
 * @param annotation - The annotation AST
 * @returns Annotation string [u-ca=gregory] or [!u-ca=gregory]
 */
export function stringifyAnnotation(annotation: AnnotationAst): string {
  return `[${annotation.raw}]`;
}

/**
 * Stringify a datetime AST to ISO 8601 / IXDTF format.
 *
 * @param dateTime - The datetime AST
 * @returns DateTime string with optional time, offset, timezone, and annotations
 */
export function stringifyDateTime(dateTime: DateTimeAst): string {
  let result = stringifyDate(dateTime.date);

  if (dateTime.time) {
    result += `T${stringifyTime(dateTime.time)}`;
  }

  if (dateTime.offset) {
    result += stringifyOffset(dateTime.offset);
  }

  if (dateTime.timeZone) {
    result += stringifyTimeZone(dateTime.timeZone);
  }

  for (const annotation of dateTime.annotations) {
    result += stringifyAnnotation(annotation);
  }

  return result;
}

/**
 * Stringify a duration AST to ISO 8601 format.
 *
 * @param duration - The duration AST
 * @returns Duration string (P1Y2M3DT4H5M6S)
 */
export function stringifyDuration(duration: DurationAst): string {
  // Always reconstruct from components to ensure normalization
  let result = 'P';

  // Date part - include component if defined (even if zero)
  if (duration.years != null) {
    result += `${duration.years}Y`;
  }
  if (duration.months != null) {
    result += `${duration.months}M`;
  }
  if (duration.weeks != null) {
    result += `${duration.weeks}W`;
  }
  if (duration.days != null) {
    result += `${duration.days}D`;
  }

  // Time part - add T separator if any time component is defined
  const hasTimePart =
    duration.hours != null || duration.minutes != null || duration.seconds != null;
  if (hasTimePart) {
    result += 'T';
    if (duration.hours != null) {
      result += `${duration.hours}H`;
    }
    if (duration.minutes != null) {
      result += `${duration.minutes}M`;
    }
    if (duration.seconds != null) {
      result += `${duration.seconds}`;
      if (duration.secondsFraction != null && duration.secondsFraction.length > 0) {
        result += `.${duration.secondsFraction}`;
      }
      result += 'S';
    }
  }

  // Annotations
  for (const annotation of duration.annotations) {
    result += stringifyAnnotation(annotation);
  }

  return result;
}

/**
 * Stringify a range AST to ISO 8601 format.
 *
 * @param range - The range AST
 * @returns Range string (start/end, /end, or start/)
 */
export function stringifyRange(range: RangeAst): string {
  const start = range.start
    ? range.start.kind === 'Duration'
      ? stringifyDuration(range.start)
      : stringifyDateTime(range.start)
    : '';

  const end = range.end
    ? range.end.kind === 'Duration'
      ? stringifyDuration(range.end)
      : stringifyDateTime(range.end)
    : '';

  return `${start}/${end}`;
}
