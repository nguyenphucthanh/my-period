import { format } from "date-fns";
import { vi } from "date-fns/locale/vi";
import { toLocalDate } from "./cycle";

/** "10 thg 11" style label for a "YYYY-MM-DD" date. */
export function formatShort(date: string): string {
  return format(toLocalDate(date), "d MMM", { locale: vi });
}

export function formatFull(date: string): string {
  return format(toLocalDate(date), "d MMM yyyy", { locale: vi });
}
