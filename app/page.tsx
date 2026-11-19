"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CycleBar } from "@/components/cycle-bar";
import { PregnancyDialog } from "@/components/pregnancy-dialog";
import {
  type LoggedPeriod,
  LogPeriodDialog,
} from "@/components/log-period-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import {
  buildBar,
  detectAnomalies,
  periodLength,
  toIsoDate,
} from "@/lib/cycle";
import {
  anomalyText,
  formatFull,
  nextPeriodCountdown,
  ovulationText,
  pregnancyProgressText,
} from "@/lib/format";

export default function Home() {
  const periods = useQuery(api.periods.list);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LoggedPeriod | undefined>();
  const [today] = useState(() => toIsoDate(new Date()));
  const pregnancy = useQuery(api.pregnancies.current);
  const [pregnancyMode, setPregnancyMode] = useState<"start" | "end" | null>(
    null,
  );
  const pregnant = !!pregnancy && pregnancy.endDate === undefined;
  // Periods before the end of the latest pregnancy no longer drive predictions.
  const since = pregnancy?.endDate;
  const bar =
    periods && !pregnant ? buildBar(periods, today, undefined, since) : null;
  const anomalies =
    periods && !pregnant ? detectAnomalies(periods, today, since) : [];

  function openDialog(period?: LoggedPeriod) {
    setEditing(period);
    setDialogOpen(true);
  }

  return (
    <>
      <header className="flex items-center justify-between p-4">
        <h1 className="text-lg font-semibold">Chu kỳ của tôi</h1>
        <SignOutButton />
      </header>
      <Separator />
      <main className="mx-auto flex max-w-2xl flex-col gap-6 p-4 md:p-8">
        {pregnant ? (
          <section className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="font-medium">Đang mang thai</p>
                <p className="text-4xl font-bold">
                  {pregnancyProgressText(pregnancy.startDate, today)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Bắt đầu từ {formatFull(pregnancy.startDate)}. Dự báo kỳ kinh
                  đang tạm dừng.
                </p>
                <RemovePregnancyButton />
              </div>
              <Button
                size="lg"
                variant="outline"
                className="shrink-0"
                onClick={() => setPregnancyMode("end")}
              >
                Kết thúc thai kỳ
              </Button>
            </div>
          </section>
        ) : (
          <div className="flex items-start justify-between gap-4">
            {bar && (
              <section className="flex flex-col gap-1">
                <p className="font-medium">Kỳ kinh tiếp theo</p>
                <p className="text-4xl font-bold">
                  {nextPeriodCountdown(bar.daysUntilNext)}
                </p>
                <p>{ovulationText(bar.daysUntilOvulation)}</p>
              </section>
            )}
            <div className="ml-auto flex flex-col shrink-0 gap-2">
              <Button
                size="lg"
                onClick={() => openDialog()}
                disabled={!periods}
              >
                Ghi nhận kỳ kinh
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setPregnancyMode("start")}
                disabled={pregnancy === undefined}
              >
                Đang mang thai
              </Button>
            </div>
          </div>
        )}
        {anomalies.map((a) => (
          <Alert key={`${a.kind}-${a.from}`}>
            <AlertTitle>Chu kỳ bất thường</AlertTitle>
            <AlertDescription>
              <p>{anomalyText(a)}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => setPregnancyMode("start")}
              >
                Tôi đang mang thai
              </Button>
            </AlertDescription>
          </Alert>
        ))}
        {pregnant ? null : periods === undefined || pregnancy === undefined ? (
          <Skeleton className="h-24 w-full" />
        ) : bar ? (
          // key resets the marker when the last period changes
          <CycleBar key={bar.startDate} bar={bar} />
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>
                {since ? "Chưa có kỳ kinh sau thai kỳ" : "Chưa có dữ liệu"}
              </EmptyTitle>
              <EmptyDescription>
                {since
                  ? "Ghi nhận kỳ kinh đầu tiên sau thai kỳ để tiếp tục dự báo."
                  : "Ghi nhận kỳ kinh đầu tiên để bắt đầu theo dõi chu kỳ."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        {periods && periods.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bắt đầu</TableHead>
                <TableHead>Kết thúc</TableHead>
                <TableHead>Số ngày</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map((p) => (
                <TableRow key={p._id}>
                  <TableCell>{formatFull(p.startDate)}</TableCell>
                  <TableCell>{formatFull(p.endDate)}</TableCell>
                  <TableCell>{periodLength(p)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDialog(p)}
                    >
                      Sửa
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </main>
      <LogPeriodDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        periods={periods ?? []}
        editing={editing}
        today={today}
        since={since}
      />
      <PregnancyDialog
        open={pregnancyMode !== null}
        onOpenChange={(open) => !open && setPregnancyMode(null)}
        mode={pregnancyMode ?? "start"}
        startDate={pregnancy?.startDate}
        today={today}
      />
    </>
  );
}

function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  if (!isAuthenticated) return null;
  return (
    <Button
      variant="outline"
      onClick={() => void signOut().then(() => router.push("/signin"))}
    >
      Đăng xuất
    </Button>
  );
}

function RemovePregnancyButton() {
  const remove = useMutation(api.pregnancies.remove);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="link"
        size="sm"
        className="h-auto self-start p-0"
        onClick={() => setOpen(true)}
      >
        Nhập nhầm? Xóa thai kỳ
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa thai kỳ này?</AlertDialogTitle>
            <AlertDialogDescription>
              Thai kỳ sẽ bị xóa và dự báo kỳ kinh hoạt động trở lại. Bạn có thể
              nhập lại với ngày bắt đầu đúng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void remove({})}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
