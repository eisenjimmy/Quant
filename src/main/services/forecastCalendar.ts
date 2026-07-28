import type { ForecastErrorCode } from '../../shared/forecast';

export const US_MARKET_TIMEZONE = 'America/New_York';
export const US_MARKET_CALENDAR = 'US-equities-v1';
export const US_REGULAR_SESSION = '09:30-16:00';

const SESSION_BAR_START_MINUTES = [
  9 * 60 + 30,
  10 * 60 + 30,
  11 * 60 + 30,
  12 * 60 + 30,
  13 * 60 + 30,
  14 * 60 + 30,
] as const;
const EARLY_CLOSE_BAR_START_MINUTES = [
  9 * 60 + 30,
  10 * 60 + 30,
  11 * 60 + 30,
] as const;

interface LocalDate {
  year: number;
  month: number;
  day: number;
}

export interface ForecastCalendarRequest {
  afterTimestamp: string;
  count: number;
  exchange?: string;
  timezone?: string;
}

export interface ForecastCalendarResult {
  timestamps: string[];
  assumptions: {
    exchange: string;
    timezone: typeof US_MARKET_TIMEZONE;
    calendar: typeof US_MARKET_CALENDAR;
    regularSession: typeof US_REGULAR_SESSION;
  };
}

export class ForecastCalendarFailure extends Error {
  readonly code: ForecastErrorCode = 'MARKET_CALENDAR_FAILED';

  constructor(message: string) {
    super(message);
    this.name = 'ForecastCalendarFailure';
  }
}

function dateKey(date: LocalDate): string {
  return [
    String(date.year).padStart(4, '0'),
    String(date.month).padStart(2, '0'),
    String(date.day).padStart(2, '0'),
  ].join('-');
}

function fromUtcDate(date: Date): LocalDate {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function addDays(date: LocalDate, days: number): LocalDate {
  return fromUtcDate(
    new Date(Date.UTC(date.year, date.month - 1, date.day + days)),
  );
}

function dayOfWeek(date: LocalDate): number {
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

function nthWeekday(
  year: number,
  month: number,
  weekday: number,
  occurrence: number,
): LocalDate {
  const first: LocalDate = { year, month, day: 1 };
  const offset = (weekday - dayOfWeek(first) + 7) % 7;
  return { year, month, day: 1 + offset + (occurrence - 1) * 7 };
}

function lastWeekday(year: number, month: number, weekday: number): LocalDate {
  const firstNextMonth =
    month === 12
      ? { year: year + 1, month: 1, day: 1 }
      : { year, month: month + 1, day: 1 };
  const last = addDays(firstNextMonth, -1);
  const offset = (dayOfWeek(last) - weekday + 7) % 7;
  return addDays(last, -offset);
}

function observedFixedHoliday(
  year: number,
  month: number,
  day: number,
): LocalDate {
  const holiday = { year, month, day };
  const weekday = dayOfWeek(holiday);
  if (weekday === 6) return addDays(holiday, -1);
  if (weekday === 0) return addDays(holiday, 1);
  return holiday;
}

function newYearsHoliday(year: number): LocalDate {
  const holiday = { year, month: 1, day: 1 };
  const weekday = dayOfWeek(holiday);
  // NYSE does not observe New Year's Day on the prior Friday when Jan 1
  // falls on Saturday.
  if (weekday === 0) return addDays(holiday, 1);
  return holiday;
}

function easterSunday(year: number): LocalDate {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { year, month, day };
}

function marketHolidaysForYear(year: number): Set<string> {
  const dates = [
    newYearsHoliday(year),
    nthWeekday(year, 1, 1, 3),
    nthWeekday(year, 2, 1, 3),
    addDays(easterSunday(year), -2),
    lastWeekday(year, 5, 1),
    ...(year >= 2022 ? [observedFixedHoliday(year, 6, 19)] : []),
    observedFixedHoliday(year, 7, 4),
    nthWeekday(year, 9, 1, 1),
    nthWeekday(year, 11, 4, 4),
    observedFixedHoliday(year, 12, 25),
  ];
  return new Set(dates.map(dateKey));
}

function isMarketHoliday(date: LocalDate): boolean {
  const key = dateKey(date);
  return [date.year - 1, date.year, date.year + 1].some((year) =>
    marketHolidaysForYear(year).has(key),
  );
}

function isTradingDay(date: LocalDate): boolean {
  const weekday = dayOfWeek(date);
  return weekday !== 0 && weekday !== 6 && !isMarketHoliday(date);
}

function easternPartsFromTimestamp(timestampMs: number): LocalDate & {
  hour: number;
  minute: number;
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: US_MARKET_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(new Date(timestampMs));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);
  const hour = Number(values.hour);
  const minute = Number(values.minute);
  if (![year, month, day, hour, minute].every(Number.isInteger)) {
    throw new ForecastCalendarFailure(
      'Could not resolve the exchange-local forecast date.',
    );
  }
  return { year, month, day, hour, minute };
}

function easternDateFromTimestamp(timestampMs: number): LocalDate {
  const { year, month, day } = easternPartsFromTimestamp(timestampMs);
  return { year, month, day };
}

function isEasternDaylightTime(date: LocalDate): boolean {
  const starts = nthWeekday(date.year, 3, 0, 2);
  const ends = nthWeekday(date.year, 11, 0, 1);
  const key = dateKey(date);
  return key >= dateKey(starts) && key < dateKey(ends);
}

function easternWallTimeToUtc(
  date: LocalDate,
  hour: number,
  minute: number,
): number {
  const utcOffsetHours = isEasternDaylightTime(date) ? 4 : 5;
  return Date.UTC(
    date.year,
    date.month - 1,
    date.day,
    hour + utcOffsetHours,
    minute,
  );
}

function normalizeTimezone(timezone: string | undefined): typeof US_MARKET_TIMEZONE {
  if (
    timezone === undefined ||
    timezone === US_MARKET_TIMEZONE ||
    timezone === 'US/Eastern'
  ) {
    return US_MARKET_TIMEZONE;
  }
  throw new ForecastCalendarFailure(
    `Unsupported U.S. forecast exchange time zone: ${timezone}.`,
  );
}

function earlyCloseDatesForYear(year: number): Set<string> {
  const thanksgiving = nthWeekday(year, 11, 4, 4);
  const dates: LocalDate[] = [addDays(thanksgiving, 1)];
  const christmasEve = { year, month: 12, day: 24 };
  if (dayOfWeek(christmasEve) !== 0 && dayOfWeek(christmasEve) !== 6) {
    dates.push(christmasEve);
  }

  const independenceDay = { year, month: 7, day: 4 };
  const independenceWeekday = dayOfWeek(independenceDay);
  let independenceEarlyClose: LocalDate | null = null;
  if (independenceWeekday >= 2 && independenceWeekday <= 5) {
    independenceEarlyClose = addDays(independenceDay, -1);
  } else if (independenceWeekday === 1) {
    independenceEarlyClose = addDays(independenceDay, -3);
  } else if (independenceWeekday === 0) {
    independenceEarlyClose = addDays(independenceDay, -2);
  }
  if (independenceEarlyClose) dates.push(independenceEarlyClose);

  return new Set(
    dates
      .filter((date) => isTradingDay(date))
      .map(dateKey),
  );
}

function isEarlyClose(date: LocalDate): boolean {
  return earlyCloseDatesForYear(date.year).has(dateKey(date));
}

function barStartsForDate(
  date: LocalDate,
): readonly number[] {
  return isEarlyClose(date)
    ? EARLY_CLOSE_BAR_START_MINUTES
    : SESSION_BAR_START_MINUTES;
}

export function validateUsMarketBarTimestamps(
  timestamps: readonly string[],
  timezone: string,
): boolean {
  if (timezone !== US_MARKET_TIMEZONE || timestamps.length === 0) return false;
  let previous = -Infinity;
  for (const timestamp of timestamps) {
    const timestampMs = Date.parse(timestamp);
    if (
      !Number.isFinite(timestampMs) ||
      timestampMs <= previous ||
      timestampMs % 60_000 !== 0
    ) {
      return false;
    }
    previous = timestampMs;
    let parts: ReturnType<typeof easternPartsFromTimestamp>;
    try {
      parts = easternPartsFromTimestamp(timestampMs);
    } catch {
      return false;
    }
    const date = {
      year: parts.year,
      month: parts.month,
      day: parts.day,
    };
    const minuteOfDay = parts.hour * 60 + parts.minute;
    if (
      !isTradingDay(date) ||
      !barStartsForDate(date).some((slot) => slot === minuteOfDay)
    ) {
      return false;
    }
  }
  return true;
}

export function nextUsMarketBarTimestamps(
  request: ForecastCalendarRequest,
): ForecastCalendarResult {
  const afterMs = Date.parse(request.afterTimestamp);
  if (!Number.isFinite(afterMs)) {
    throw new ForecastCalendarFailure(
      'A valid latest completed candle timestamp is required.',
    );
  }
  if (
    !Number.isInteger(request.count) ||
    request.count < 1 ||
    request.count > 10_000
  ) {
    throw new ForecastCalendarFailure(
      'A valid forecast market-bar count is required.',
    );
  }

  const timezone = normalizeTimezone(request.timezone);
  const timestamps: string[] = [];
  let date = easternDateFromTimestamp(afterMs);
  for (let daysChecked = 0; daysChecked < 370; daysChecked += 1) {
    if (isTradingDay(date)) {
      for (const minuteOfDay of barStartsForDate(date)) {
        const timestampMs = easternWallTimeToUtc(
          date,
          Math.floor(minuteOfDay / 60),
          minuteOfDay % 60,
        );
        if (timestampMs <= afterMs) continue;
        timestamps.push(new Date(timestampMs).toISOString());
        if (timestamps.length === request.count) {
          return {
            timestamps,
            assumptions: {
              exchange: request.exchange?.trim() || 'US',
              timezone,
              calendar: US_MARKET_CALENDAR,
              regularSession: US_REGULAR_SESSION,
            },
          };
        }
      }
    }
    date = addDays(date, 1);
  }

  throw new ForecastCalendarFailure(
    `Could not produce ${request.count} valid U.S. market-bar timestamps.`,
  );
}
