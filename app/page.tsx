"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CycleBar } from "@/components/cycle-bar";
import {
  type LoggedPeriod,
  LogPeriodDialog,
} from "@/components/log-period-dialog";
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
import { buildBar, periodLength, toIsoDate } from "@/lib/cycle";
import { formatFull } from "@/lib/format";

export default function Home() {
  const periods = useQuery(api.periods.list);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LoggedPeriod | undefined>();
  const [today] = useState(() => toIsoDate(new Date()));
  const bar = periods ? buildBar(periods, today) : null;

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
        <Button onClick={() => openDialog()} disabled={!periods}>
          Ghi nhận kỳ kinh
        </Button>
        {periods === undefined ? (
          <Skeleton className="h-24 w-full" />
        ) : bar ? (
          // key resets the marker when the last period changes
          <CycleBar key={bar.startDate} bar={bar} today={today} />
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Chưa có dữ liệu</EmptyTitle>
              <EmptyDescription>
                Ghi nhận kỳ kinh đầu tiên để bắt đầu theo dõi chu kỳ.
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
