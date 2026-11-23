const MONTHS_SHORT_PL = [
  'sty',
  'lut',
  'mar',
  'kwi',
  'maj',
  'cze',
  'lip',
  'sie',
  'wrz',
  'paź',
  'lis',
  'gru',
];

const MONTHS_GENITIVE_PL = [
  'stycznia',
  'lutego',
  'marca',
  'kwietnia',
  'maja',
  'czerwca',
  'lipca',
  'sierpnia',
  'września',
  'października',
  'listopada',
  'grudnia',
];

const WEEKDAYS_FULL_PL = [
  'niedziela',
  'poniedziałek',
  'wtorek',
  'środa',
  'czwartek',
  'piątek',
  'sobota',
];

const WEEKDAYS_SHORT_PL = ['ndz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.'];

export function parseIsoDate(isoDate: string): Date {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  }
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDefaultStartDateIso(daysAhead = 14): string {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead, 12, 0, 0);
  return toIsoDate(target);
}

export function addCalendarDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12, 0, 0);
}

function getEasterSunday(year: number): Date {
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
  return new Date(year, month - 1, day, 12, 0, 0);
}

function isPolishPublicHoliday(date: Date): boolean {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  const fixed = [
    [1, 1],
    [1, 6],
    [5, 1],
    [5, 3],
    [8, 15],
    [11, 1],
    [11, 11],
    [12, 24],
    [12, 25],
    [12, 26],
  ];
  if (fixed.some(([fm, fd]) => fm === m && fd === d)) {
    return true;
  }

  const easter = getEasterSunday(y);
  const easterMonday = addCalendarDays(easter, 1);
  const pentecost = addCalendarDays(easter, 49);
  const corpusChristi = addCalendarDays(easter, 60);

  const iso = toIsoDate(date);
  return (
    iso === toIsoDate(easter) ||
    iso === toIsoDate(easterMonday) ||
    iso === toIsoDate(pentecost) ||
    iso === toIsoDate(corpusChristi)
  );
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isWorkingDay(date: Date): boolean {
  return !isWeekend(date) && !isPolishPublicHoliday(date);
}

export function addWorkingDays(date: Date, workingDays: number): Date {
  let cursor = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  if (workingDays === 0) {
    return cursor;
  }
  const step = workingDays > 0 ? 1 : -1;
  let remaining = Math.abs(workingDays);
  while (remaining > 0) {
    cursor = addCalendarDays(cursor, step);
    if (isWorkingDay(cursor)) {
      remaining -= 1;
    }
  }
  return cursor;
}

export function getNextWorkingDays(startDate: Date, count: number): Date[] {
  const result: Date[] = [];
  let cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 12, 0, 0);
  while (result.length < count) {
    if (isWorkingDay(cursor) || result.length === 0) {
      result.push(cursor);
    }
    cursor = addCalendarDays(cursor, 1);
  }
  return result;
}

export function formatDateShortPl(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

export function formatDateFullPl(date: Date): string {
  const weekday = WEEKDAYS_FULL_PL[date.getDay()];
  const day = date.getDate();
  const month = MONTHS_GENITIVE_PL[date.getMonth()];
  const year = date.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
}

export function formatDayLabelPl(date: Date): string {
  const weekday = WEEKDAYS_SHORT_PL[date.getDay()];
  const day = date.getDate();
  const month = MONTHS_SHORT_PL[date.getMonth()];
  return `${weekday}, ${day} ${month} ${date.getFullYear()}`;
}

export interface OnboardingTimeline {
  startDateIso: string;
  startDateFormatted: string;
  startDateFull: string;
  isStartWeekend: boolean;
  preboarding10WorkDaysBefore: string;
  preboarding5WorkDaysBefore: string;
  preboarding3WorkDaysBefore: string;
  preboarding1WorkDayBefore: string;
  plus7CalendarDays: string;
  plus30CalendarDays: string;
  plus60CalendarDays: string;
  plus90CalendarDays: string;
  weekOneDates: string[];
}

export function calculateOnboardingTimeline(startDateIso: string): OnboardingTimeline {
  const start = parseIsoDate(startDateIso);
  const weekDays = getNextWorkingDays(start, 5);

  return {
    startDateIso: toIsoDate(start),
    startDateFormatted: formatDateShortPl(start),
    startDateFull: formatDateFullPl(start),
    isStartWeekend: isWeekend(start),
    preboarding10WorkDaysBefore: formatDateShortPl(addWorkingDays(start, -10)),
    preboarding5WorkDaysBefore: formatDateShortPl(addWorkingDays(start, -5)),
    preboarding3WorkDaysBefore: formatDateShortPl(addWorkingDays(start, -3)),
    preboarding1WorkDayBefore: formatDateShortPl(addWorkingDays(start, -1)),
    plus7CalendarDays: formatDateShortPl(addCalendarDays(start, 7)),
    plus30CalendarDays: formatDateShortPl(addCalendarDays(start, 30)),
    plus60CalendarDays: formatDateShortPl(addCalendarDays(start, 60)),
    plus90CalendarDays: formatDateShortPl(addCalendarDays(start, 90)),
    weekOneDates: weekDays.map(formatDayLabelPl),
  };
}
