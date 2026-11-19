"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import type { Id } from "@/convex/_generated/dataModel";
import {
  addDays,
  diffDays,
  type PeriodRange,
  predict,
  suggestedPeriodLength,
  toIsoDate,
  toLocalDate,
} from "@/lib/cycle";
import { vi } from "date-fns/locale/vi";
import { formatShort } from "@/lib/format";

// Overrides the default (primary-colored) range look with individual red days.
const RANGE_RED =
  "[&_button]:rounded-(--cell-radius)! [&_button]:border-0! [&_button]:bg-red-500! [&_button]:text-white!";

export type LoggedPeriod = PeriodRange & { _id: Id<"periods"> };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periods: readonly LoggedPeriod[];
  /** When set, the dialog edits (and can delete) this period. */
  editing?: LoggedPeriod;
  today: string;
  /** End of the latest pregnancy; earlier periods are ignored for prediction. */
  since?: string;
};

export function LogPeriodDialog(props: Props) {
  // Remount on open so state resets for each period being edited.
  const key = `${props.open}-${props.editing?._id ?? "new"}`;
  return <LogPeriodForm key={key} {...props} />;
}

function LogPeriodForm({
  open,
  onOpenChange,
  periods,
  editing,
  today,
  since,
}: Props) {
  const log = useMutation(api.periods.log);
  const update = useMutation(api.periods.update);
  const remove = useMutation(api.periods.remove);
  const length = suggestedPeriodLength(
    periods.filter((p) => p._id !== editing?._id),
  );
  const prediction = predict(periods, since);

  const [start, setStart] = useState(editing?.startDate ?? null);
  const [end, setEnd] = useState(editing?.endDate ?? null);
  // True right after a start date was picked: the next click on a later day
  // adjusts the (auto-filled) end date instead of starting a new range.
  const [adjustingEnd, setAdjustingEnd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const suggested =
    !editing && prediction
      ? Array.from({ length: prediction.periodLength }, (_, i) =>
          toLocalDate(addDays(prediction.nextStart, i)),
        )
      : [];
  const defaultMonth = toLocalDate(
    start ?? prediction?.nextStart ?? today,
  );

  function pick(day: Date) {
    const iso = toIsoDate(day);
    setError(null);
    if (adjustingEnd && start && iso >= start) {
      setEnd(iso);
      setAdjustingEnd(false);
    } else {
      setStart(iso);
      setEnd(addDays(iso, length - 1));
      setAdjustingEnd(true);
    }
  }

  async function run(action: () => Promise<unknown>) {
    setSaving(true);
    setError(null);
    try {
      await action();
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
            {editing ? "Sửa kỳ kinh" : "Ghi nhận kỳ kinh"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Chọn ngày bắt đầu mới, rồi chọn ngày kết thúc nếu cần."
              : "Chọn ngày bắt đầu, ngày kết thúc được gợi ý tự động. Chọn thêm một ngày sau đó để đổi ngày kết thúc."}
          </DialogDescription>
        </DialogHeader>
        <Calendar
          mode="range"
          resetOnSelect
          locale={vi}
          defaultMonth={defaultMonth}
          selected={
            start
              ? {
                  from: toLocalDate(start),
                  to: end ? toLocalDate(end) : undefined,
                }
              : undefined
          }
          // The range argument is ignored: the clicked day drives our state
          // so the end date can be auto-filled.
          onSelect={(_, day) => pick(day)}
          className="w-full [--cell-size:--spacing(10)]"
          classNames={{
            root: "w-full",
            range_start: RANGE_RED,
            range_middle: RANGE_RED,
            range_end: RANGE_RED,
          }}
          modifiers={{ suggested: start ? [] : suggested }}
          modifiersClassNames={{
            suggested:
              "[&_button]:border! [&_button]:border-dashed! [&_button]:border-red-300! [&_button]:bg-transparent! [&_button]:text-foreground!",
          }}
        />
        {start && end && (
          <p className="text-sm text-muted-foreground">
            {formatShort(start)} – {formatShort(end)} ({diffDays(start, end) + 1}{" "}
            ngày)
          </p>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          {editing && (
            <DeleteButton
              disabled={saving}
              onConfirm={() => run(() => remove({ id: editing._id }))}
            />
          )}
          <Button
            disabled={!start || !end || saving}
            onClick={() =>
              start &&
              end &&
              run(() =>
                editing
                  ? update({ id: editing._id, startDate: start, endDate: end })
                  : log({ startDate: start, endDate: end }),
              )
            }
          >
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteButton({
  onConfirm,
  disabled,
}: {
  onConfirm: () => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="destructive"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        Xóa
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa kỳ kinh này?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác và sẽ ảnh hưởng đến dự đoán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onConfirm}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** Maps backend errors to Vietnamese messages. */
export function errorText(e: unknown): string {
  const msg = e instanceof Error ? e.message : "";
  if (msg.includes("overlaps")) return "Kỳ kinh này trùng với một kỳ đã ghi.";
  if (msg.includes("before start"))
    return "Ngày kết thúc phải sau ngày bắt đầu.";
  if (msg.includes("too long")) return "Kỳ kinh quá dài.";
  if (msg.includes("not found")) return "Không tìm thấy kỳ kinh.";
  if (msg.includes("while pregnant"))
    return "Không thể ghi nhận kỳ kinh khi đang mang thai.";
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}
