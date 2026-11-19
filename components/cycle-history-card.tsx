"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { formatShort } from "@/lib/format";
import { buildHistory, type HistoryDay, selectableYears } from "@/lib/history";
import { cn } from "@/lib/utils";

const DOT_CLASS: Record<HistoryDay, string> = {
  period: "bg-chart-2",
  fertile: "bg-yellow-300",
  ovulation: "bg-amber-500",
  none: "bg-muted",
};

const LEGEND: { kind: HistoryDay; label: string }[] = [
  { kind: "period", label: "Kỳ kinh" },
  { kind: "fertile", label: "Cửa sổ thụ thai" },
  { kind: "ovulation", label: "Rụng trứng" },
];

export function CycleHistoryCard({ today }: { today: string }) {
  const currentYear = Number(today.slice(0, 4));
  const [year, setYear] = useState(currentYear);
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const firstYear = useQuery(api.periods.firstYear);
  const periods = useQuery(api.periods.listByYear, { year });

  const years = selectableYears(firstYear ?? null, currentYear);
  const cycles = periods ? buildHistory(periods, year, today) : null;
  const shown = cycles && order === "desc" ? [...cycles].reverse() : cycles;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử chu kỳ</CardTitle>
        <CardDescription>
          {cycles ? `${cycles.length} chu kỳ trong năm ${year}` : "Đang tải…"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {LEGEND.map(({ kind, label }) => (
            <Badge
              key={kind}
              variant="secondary"
              className="h-6 gap-1.5 px-2.5"
            >
              <span className={cn("size-2.5 rounded-full", DOT_CLASS[kind])} />
              {label}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          <NativeSelect
            aria-label="Chọn năm"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <NativeSelectOption key={y} value={y}>
                {y}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label="Sắp xếp"
            value={order}
            onChange={(e) => setOrder(e.target.value as "desc" | "asc")}
          >
            <NativeSelectOption value="desc">Mới nhất trước</NativeSelectOption>
            <NativeSelectOption value="asc">Cũ nhất trước</NativeSelectOption>
          </NativeSelect>
        </div>
        {shown === null ? (
          <Skeleton className="h-40 w-full" />
        ) : shown.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Chưa có chu kỳ nào trong năm {year}.
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {shown.map((c) => (
              <li key={c.startDate} className="flex flex-col gap-2 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-medium">
                    {formatShort(c.startDate)} –{" "}
                    {c.endDate ? formatShort(c.endDate) : "Nay"}
                  </p>
                  <p className="font-semibold">{c.length} ngày</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {c.periodDays} ngày kinh
                </p>
                <div className="flex flex-wrap gap-1" aria-hidden="true">
                  {c.days.map((kind, i) => (
                    <span
                      key={i}
                      className={cn("size-2.5 rounded-full", DOT_CLASS[kind])}
                    />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
