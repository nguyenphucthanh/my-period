"use client";

import { StarIcon } from "lucide-react";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { type Bar, type DayKind } from "@/lib/cycle";
import { formatShort } from "@/lib/format";

export const KIND_COLOR: Record<DayKind, string> = {
  period: "bg-red-500",
  predicted: "bg-pink-200",
  fertile: "bg-amber-400",
  peak: "bg-amber-400",
  none: "bg-muted",
};

export function CycleBar({ bar }: { bar: Bar }) {
  const last = bar.days.length - 1;
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(bar.todayIndex, 0), last),
  );
  const count = bar.days.length;
  // Place the slider so its thumb centers line up with segment centers.
  const inset = `calc(100% / ${count * 2} - 6px)`;
  const width = `calc(100% - 100% / ${count} + 12px)`;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-lg font-bold">{formatShort(bar.days[index].date)}</p>
      <div>
        <div className="relative">
          <div className="flex h-8 overflow-hidden rounded-md">
            {bar.days.map((d) => (
              <div
                key={d.date}
                className={`flex flex-1 items-center justify-center ${KIND_COLOR[d.kind]}`}
              >
                {d.kind === "peak" && (
                  <StarIcon className="size-4 fill-white text-white" />
                )}
              </div>
            ))}
          </div>
          {/* Fixed line on today, shown only when today falls inside the bar. */}
          {bar.todayIndex >= 0 && bar.todayIndex < count && (
            <div
              className="pointer-events-none absolute -top-1 -bottom-1 w-1 -translate-x-1/2 rounded-full bg-sky-500 ring-2 ring-background"
              style={{ left: `${((bar.todayIndex + 0.5) / count) * 100}%` }}
            />
          )}
        </div>
        {/* Slider row below the bar; thumb centers line up with segments. */}
        <div className="mt-2 flex h-5 items-center" style={{ marginLeft: inset, width }}>
          <Slider
            min={0}
            max={last}
            step={1}
            value={[index]}
            onValueChange={(v) => setIndex(Array.isArray(v) ? v[0] : v)}
            aria-label="Chọn ngày"
          />
        </div>
      </div>
      <Legend />
    </div>
  );
}

function Legend() {
  const items: [string, string][] = [
    ["bg-red-500", "Kỳ kinh"],
    ["bg-amber-400", "Dễ thụ thai (★ cao nhất)"],
    ["bg-pink-200", "Kỳ kinh dự đoán"],
    ["bg-sky-500", "Hôm nay"],
  ];
  return (
    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
      {items.map(([color, label]) => (
        <span key={label} className="flex items-center gap-2">
          <span className={`size-3 rounded-full ${color}`} />
          {label}
        </span>
      ))}
    </div>
  );
}
