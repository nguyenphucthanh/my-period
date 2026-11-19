import { format } from "date-fns";
import { vi } from "date-fns/locale/vi";
import { type CycleAnomaly, diffDays, toLocalDate } from "./cycle";

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

/** Vietnamese note for an abnormal gap between periods. */
export function anomalyText(a: CycleAnomaly): string {
  const hint =
    "Có thể bạn quên ghi nhận kỳ kinh hoặc đang mang thai. Hãy cập nhật dữ liệu nếu cần; khoảng cách này không được dùng để dự đoán.";
  if (a.kind === "long-gap")
    return `Khoảng cách từ ${formatFull(a.from)} đến ${formatFull(a.to)} là ${a.days} ngày, dài hơn bình thường. ${hint}`;
  return `Đã ${a.days} ngày kể từ kỳ kinh gần nhất (${formatFull(a.from)}) mà chưa có kỳ mới. ${hint}`;
}

/** "Tuần 15, ngày 3" since the pregnancy start date. */
export function pregnancyProgressText(startDate: string, today: string): string {
  const days = Math.max(0, diffDays(startDate, today));
  return `Tuần ${Math.floor(days / 7)}, ngày ${days % 7}`;
}

/** "29–32" or "31" for a min/max range. */
export function rangeText(range: { min: number; max: number }): string {
  return range.min === range.max
    ? `${range.min}`
    : `${range.min}–${range.max}`;
}

/** "+1 ngày" / "-2 ngày" / "0 ngày" for the change between two cycles. */
export function variationText(days: number): string {
  const abs = Math.abs(days);
  if (days === 0) return "0 ngày";
  return `${days > 0 ? "+" : "-"}${abs} ngày`;
}

export function cycleSummaryText(count: number, average: number): string {
  return `Dựa trên ${count} chu kỳ gần nhất, độ dài chu kỳ trung bình của bạn là ${average} ngày.`;
}

export function periodSummaryText(
  count: number,
  average: number,
  normal: boolean,
): string {
  const base = `Kỳ kinh của bạn kéo dài trung bình ${average} ngày trong ${count} kỳ gần nhất.`;
  return normal
    ? base
    : `${base} Có kỳ nằm ngoài khoảng thông thường 2–7 ngày. Nếu tình trạng này tiếp diễn, hãy cân nhắc tham khảo ý kiến bác sĩ.`;
}

export function periodStatusText(
  s:
    | { kind: "upcoming"; days: number }
    | { kind: "on-time" }
    | { kind: "late"; days: number }
    | { kind: "unknown" },
): string {
  switch (s.kind) {
    case "upcoming":
      return `Còn ${s.days} ngày`;
    case "on-time":
      return "Đúng hạn";
    case "late":
      return `Trễ ${s.days} ngày`;
    case "unknown":
      return "Chưa có dữ liệu";
  }
}
