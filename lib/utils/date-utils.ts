import { DateTime } from "luxon";

/**
 * Formats the current date and time in real-time for display purposes.
 * @param format Optional format string (defaults to 'dd/MM/yyyy HH:mm:ss')
 * @param timezone Optional timezone (defaults to 'America/Lima')
 * @returns The formatted current date and time string
 * @example
 * formatCurrentDateTime() // '24/07/2025 11:30:45'
 * formatCurrentDateTime('HH:mm:ss') // '11:30:45'
 */
export function formatCurrentDateTime(
  format = "dd/MM/yyyy HH:mm:ss z",
  timezone = "America/Lima",
): string {
  return DateTime.now().setZone(timezone).toFormat(format);
}

/**
 * Formats a UTC date string to a specific time zone and format.
 * @param params Object with utcDate, userTimezone, and format.
 * @returns The formatted date string.
 * @example
 * formatDateTime({ utcDate: '2023-01-01T12:00:00Z', userTimezone: 'America/Lima', format: 'HH:mm' })
 */
export function formatDateTime({
  utcDate,
  userTimezone = DateTime.local().zoneName,
  format = "HH:mm",
}: {
  utcDate?: string;
  userTimezone?: string;
  format?: string;
}): string {
  const timezone = userTimezone || DateTime.local().zoneName;
  let limaDateTime: DateTime;
  if (utcDate) {
    limaDateTime = DateTime.fromISO(utcDate, { zone: "America/Lima" });
  } else {
    limaDateTime = DateTime.now().setZone("America/Lima");
  }
  const userDateTime = limaDateTime.setZone(timezone);
  return userDateTime.toFormat(format || "HH:mm");
}

/**
 * Formats a UTC date string for use in input fields (e.g., date pickers).
 * Tries multiple date formats if the initial parse fails.
 * @param params Object with utcDate, userTimezone, and format.
 * @returns The formatted date string for input.
 * @example
 * formatDateForInput({ utcDate: '2023-01-01T12:00:00Z' })
 */
export function formatDateForInput({
  utcDate,
  userTimezone,
  format = "yyyy-MM-dd",
}: {
  utcDate: string;
  userTimezone?: string;
  format?: string;
}): string {
  let dateTime: DateTime;
  const timezone = userTimezone ?? DateTime.local().zoneName;

  dateTime = DateTime.fromISO(utcDate, { zone: "America/Lima" }).setZone(
    timezone,
  );
  if (!dateTime.isValid) {
    dateTime = DateTime.fromSQL(utcDate, { zone: "America/Lima" }).setZone(
      timezone,
    );
  }
  if (!dateTime.isValid) {
    dateTime = DateTime.fromRFC2822(utcDate, { zone: "America/Lima" }).setZone(
      timezone,
    );
  }

  if (!dateTime.isValid) {
    return "";
  }

  return dateTime.toFormat(format);
}

/**
 * Checks if the given date is the current day.
 * @param date Optional ISO date string.
 * @returns True if the date is today, false otherwise.
 * @example
 * isCurrentDay('2023-01-01') // true or false
 */
export function isCurrentDay(date?: string) {
  const dateTime = date ? DateTime.fromISO(date) : DateTime.local();
  return dateTime.hasSame(DateTime.now(), "day");
}

/**
 * Calculates the difference in days between the given ISO date and now, in the specified time zone.
 * @param isoDate ISO date string.
 * @param timezone Optional time zone string.
 * @returns Number of days difference (rounded up), or null if the date is invalid or empty.
 * @example
 * calculateDaysDifference('2023-01-10', 'America/Lima')
 */
export function calculateDaysDifference(
  isoDate: string,
  timezone: string = DateTime.local().zoneName,
): number | null {
  // Return null if the date string is empty or invalid
  if (!isoDate || isoDate.trim() === "") {
    return null;
  }

  const fechaObjetivo = DateTime.fromISO(isoDate).setZone(timezone);

  // Validate that the parsed date is valid
  if (!fechaObjetivo.isValid) {
    return null;
  }

  const fechaActual = DateTime.now().setZone(timezone);
  return Math.ceil(fechaObjetivo.diff(fechaActual, "days").days);
}

/**
 * Formats a SQL date string to a long date and time in Spanish locale.
 * @param utcDate SQL date string.
 * @param userTimezone Optional user time zone.
 * @returns Object with formatted fecha and hora strings.
 * @example
 * formatLongDateTime('2023-01-01 12:00:00', 'America/Lima')
 */
export function formatLongDateTime(
  utcDate: string,
  userTimezone?: string,
): { fecha: string; hora: string } {
  const timezone = userTimezone ?? DateTime.local().zoneName;
  const limaDateTime = DateTime.fromSQL(utcDate, { zone: "America/Lima" });
  const userDateTime = limaDateTime.setZone(timezone).setLocale("es");

  return {
    fecha: userDateTime.toFormat("dd 'de' MMMM 'de' yyyy"),
    hora: userDateTime.toFormat("HH:mm:ss 'hrs'"),
  };
}

/**
 * Determines if a date is in the past, present, or future relative to today in the given time zone.
 * @param params Object with date and optional timeZone.
 * @returns 'PAST', 'PRESENT', or 'FUTURE'.
 * @example
 * getTemporalStatus({ date: '01/01/2023', timeZone: 'America/Lima' })
 */
export function getTemporalStatus({
  date,
  timeZone = DateTime.local().zoneName,
}: {
  date: string;
  timeZone?: string;
}): "PAST" | "PRESENT" | "FUTURE" {
  const fechaObjetivo = DateTime.fromFormat(date, "dd/MM/yyyy")
    .setZone(timeZone)
    .startOf("day");
  const ahora = DateTime.now().setZone(timeZone).startOf("day");

  if (!fechaObjetivo.isValid) {
    console.error("Fecha inválida:", date);
    return "PAST";
  }

  const diffDays = fechaObjetivo.diff(ahora, "days").days;

  if (diffDays === 0) {
    return "PRESENT";
  }

  return diffDays < 0 ? "PAST" : "FUTURE";
}

/**
 * Checks if a date is within a given range (inclusive start, exclusive end).
 * @param params Object with date, startDate, endDate, and optional ignoreTime.
 * @returns True if date is in range, false otherwise.
 * @example
 * isDateInRange({ date: '2024-06-10', startDate: '2024-06-01', endDate: '2024-06-30' })
 */
export function isDateInRange({
  date,
  startDate,
  endDate,
  ignoreTime = false,
}: {
  date: string;
  startDate: string;
  endDate: string;
  ignoreTime?: boolean;
}): boolean {
  if (!date || !startDate || !endDate) return false;

  let dt = DateTime.fromISO(date);
  let start = DateTime.fromISO(startDate);
  let end = DateTime.fromISO(endDate);

  if (ignoreTime) {
    dt = dt.startOf("day");
    start = start.startOf("day");
    end = end.startOf("day");
  }

  if (!dt.isValid || !start.isValid || !end.isValid) return false;

  return dt >= start && dt < end;
}
