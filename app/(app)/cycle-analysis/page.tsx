"use client";

import { useQuery } from "convex/react";
import { DropletsIcon, RefreshCwIcon, TimerIcon } from "lucide-react";
import { useState } from "react";
import { AnalysisChartCard } from "@/components/analysis-chart-card";
import { CycleHistoryCard } from "@/components/cycle-history-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import {
  average,
  classifyCycleLength,
  classifyPeriodLength,
  currentPeriodStatus,
  cycleLengths,
  periodLengths,
  variation,
} from "@/lib/analysis";
import { toIsoDate } from "@/lib/cycle";
import { cn } from "@/lib/utils";
import {
  cycleSummaryText,
  periodStatusText,
  periodSummaryText,
} from "@/lib/format";

export default function CycleAnalysisPage() {
  const periods = useQuery(api.periods.listForAnalysis);
  const pregnancy = useQuery(api.pregnancies.current);
  const [today] = useState(() => toIsoDate(new Date()));

  if (periods === undefined || pregnancy === undefined) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4 md:p-8">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </main>
    );
  }

  const pregnant = pregnancy !== null && pregnancy.endDate === undefined;
  // While pregnant, show past statistics; afterwards only post-pregnancy cycles.
  const since = pregnancy?.endDate;
  const cycles = cycleLengths(periods, since);
  const bleeding = periodLengths(periods, since);

  if (bleeding.length === 0) {
    return (
      <main className="mx-auto max-w-2xl p-4 md:p-8">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Chưa có dữ liệu</EmptyTitle>
            <EmptyDescription>
              Ghi nhận kỳ kinh để xem phân tích chu kỳ.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </main>
    );
  }

  const status = pregnant
    ? ({ kind: "unknown" } as const)
    : currentPeriodStatus(periods, today, since);
  const lastCycle = cycles.at(-1);
  const lastPeriod = bleeding.at(-1);
  const cycleAvg = average(cycles);
  const periodAvg = average(bleeding);
  const periodClass = classifyPeriodLength(bleeding);

  return (
    <main className="mx-auto flex min-w-0 max-w-2xl flex-col gap-4 p-4 md:p-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SummaryCard
          title="Chu kỳ gần nhất"
          icon={<RefreshCwIcon className="size-4 text-chart-1" />}
          value={lastCycle !== undefined ? `${lastCycle} ngày` : "—"}
        />
        <SummaryCard
          title="Kỳ kinh gần nhất"
          icon={<DropletsIcon className="size-4 text-chart-2" />}
          value={lastPeriod !== undefined ? `${lastPeriod} ngày` : "—"}
        />
        <SummaryCard
          className="col-span-2 sm:col-span-1"
          title="Kỳ này"
          icon={<TimerIcon className="size-4 text-muted-foreground" />}
          value={pregnant ? "Đang mang thai" : periodStatusText(status)}
        />
      </div>
      {cycleAvg !== null ? (
        <AnalysisChartCard
          title="Độ dài chu kỳ"
          values={cycles}
          average={cycleAvg}
          classification={classifyCycleLength(cycles)}
          color="var(--chart-1)"
          seriesLabel="Chu kỳ (ngày)"
          summary={cycleSummaryText(cycles.length, cycleAvg)}
          variation={variation(cycles)}
          variationLabel="So với 2 chu kỳ gần nhất"
        />
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Chưa đủ dữ liệu chu kỳ</EmptyTitle>
            <EmptyDescription>
              Cần ít nhất 2 kỳ kinh liên tiếp để tính độ dài chu kỳ.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {periodAvg !== null && (
        <AnalysisChartCard
          title="Độ dài kỳ kinh"
          values={bleeding}
          average={periodAvg}
          classification={periodClass}
          color="var(--chart-2)"
          seriesLabel="Kỳ kinh (ngày)"
          summary={periodSummaryText(
            bleeding.length,
            periodAvg,
            periodClass === "normal",
          )}
          variation={variation(bleeding)}
          variationLabel="So với 2 kỳ gần nhất"
        />
      )}
      <CycleHistoryCard today={today} />
    </main>
  );
}

function SummaryCard({
  title,
  icon,
  value,
  className,
}: {
  className?: string;
  title: string;
  icon: React.ReactNode;
  value: string;
}) {
  return (
    <Card size="sm" className={cn("min-w-0", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-sm font-normal text-muted-foreground">
          {title}
          {icon}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
