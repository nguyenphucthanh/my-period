"use client";

import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  LabelList,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import type { Classification } from "@/lib/analysis";
import { rangeText, variationText } from "@/lib/format";

type Props = {
  title: string;
  /** Bar values, oldest first. */
  values: number[];
  average: number;
  classification: Classification;
  /** CSS color variable for the bars, e.g. "var(--chart-1)". */
  color: string;
  /** Series name used in the tooltip. */
  seriesLabel: string;
  summary: string;
  variation: number | null;
  variationLabel: string;
};

export function AnalysisChartCard({
  title,
  values,
  average,
  classification,
  color,
  seriesLabel,
  summary,
  variation,
  variationLabel,
}: Props) {
  const range = { min: Math.min(...values), max: Math.max(...values) };
  const config = { days: { label: seriesLabel, color } } satisfies ChartConfig;
  const data = values.map((days, i) => ({ index: i + 1, days }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">{rangeText(range)}</span>
          <span className="font-semibold">ngày</span>
        </div>
        {classification !== "unknown" && (
          <Badge
            variant={classification === "normal" ? "secondary" : "destructive"}
            className="w-fit"
          >
            {classification === "normal" ? (
              <CircleCheckIcon />
            ) : (
              <CircleAlertIcon />
            )}
            {classification === "normal" ? "Bình thường" : "Bất thường"}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ChartContainer config={config} className="h-48 w-full">
          <BarChart data={data} margin={{ top: 20 }}>
            <XAxis dataKey="index" hide />
            <YAxis hide domain={[0, "dataMax + 2"]} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="days" fill="var(--color-days)" radius={8}>
              <LabelList
                dataKey="days"
                position="top"
                className="fill-foreground text-sm font-semibold"
              />
            </Bar>
            <ReferenceLine
              y={average}
              stroke="var(--foreground)"
              strokeWidth={2}
              label={{
                value: "TB",
                position: "insideTopRight",
                className: "fill-foreground text-xs font-bold",
              }}
            />
          </BarChart>
        </ChartContainer>
        <CardDescription>{summary}</CardDescription>
        {variation !== null && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Biến động</p>
                <p className="text-sm text-muted-foreground">
                  {variationLabel}
                </p>
              </div>
              <p className="font-semibold">{variationText(variation)}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
