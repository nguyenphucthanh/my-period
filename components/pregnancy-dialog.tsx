"use client";

import { useMutation } from "convex/react";
import { vi } from "date-fns/locale/vi";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/convex/_generated/api";
import { toIsoDate, toLocalDate } from "@/lib/cycle";
import { formatFull } from "@/lib/format";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "start" records a new pregnancy, "end" closes the one in progress. */
  mode: "start" | "end";
  /** Start date of the pregnancy in progress; required when mode is "end". */
  startDate?: string;
  today: string;
};

export function PregnancyDialog(props: Props) {
  // Remount on open so the picked date resets to today each time.
  return <PregnancyForm key={`${props.open}-${props.mode}`} {...props} />;
}

function PregnancyForm({ open, onOpenChange, mode, startDate, today }: Props) {
  const start = useMutation(api.pregnancies.start);
  const end = useMutation(api.pregnancies.end);
  const [date, setDate] = useState(today);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isStart = mode === "start";

  async function save() {
    setSaving(true);
    setError(null);
    try {
      if (isStart) await start({ startDate: date });
      else await end({ endDate: date });
      onOpenChange(false);
    } catch (e) {
      setError(errorText(e));
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isStart ? "Đang mang thai" : "Kết thúc thai kỳ"}
          </DialogTitle>
          <DialogDescription>
            {isStart
              ? "Chọn ngày bắt đầu mang thai. Dự báo kỳ kinh sẽ tạm dừng cho đến khi bạn kết thúc thai kỳ."
              : "Chọn ngày kết thúc thai kỳ. Sau đó hãy ghi nhận kỳ kinh đầu tiên để tiếp tục dự báo."}
          </DialogDescription>
        </DialogHeader>
        <Calendar
          mode="single"
          locale={vi}
          required
          selected={toLocalDate(date)}
          defaultMonth={toLocalDate(date)}
          onSelect={(d) => {
            setError(null);
            setDate(toIsoDate(d));
          }}
          disabled={(d) => {
            const iso = toIsoDate(d);
            return iso > today || (!isStart && !!startDate && iso < startDate);
          }}
          className="w-full [--cell-size:--spacing(10)]"
          classNames={{ root: "w-full" }}
        />
        <p className="text-sm text-muted-foreground">{formatFull(date)}</p>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button disabled={saving} onClick={() => void save()}>
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Maps backend errors to Vietnamese messages. */
export function errorText(e: unknown): string {
  const msg = e instanceof Error ? e.message : "";
  if (msg.includes("already in progress")) return "Bạn đã ở trong thai kỳ.";
  if (msg.includes("No pregnancy")) return "Hiện không có thai kỳ nào đang diễn ra.";
  if (msg.includes("overlaps"))
    return "Ngày bắt đầu phải sau thai kỳ trước đó.";
  if (msg.includes("before start"))
    return "Ngày kết thúc phải sau ngày bắt đầu.";
  if (msg.includes("future")) return "Không thể chọn ngày trong tương lai.";
  if (msg.includes("Invalid date")) return "Ngày không hợp lệ.";
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}
