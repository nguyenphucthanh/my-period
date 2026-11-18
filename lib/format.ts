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

/** "Còn 5 ngày" / "Hôm nay" / "Trễ 3 ngày" for the next-period countdown. */
export function nextPeriodCountdown(days: number): string {
  if (days > 0) return `Còn ${days} ngày`;
  if (days === 0) return "Hôm nay";
  return `Trễ ${-days} ngày`;
}

export function ovulationText(days: number): string {
  if (days > 0) return `Rụng trứng: còn ${days} ngày`;
  if (days === 0) return "Rụng trứng: hôm nay";
  return "Rụng trứng: đã qua";
}
