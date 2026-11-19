import { AppSidebar } from "@/components/app-sidebar";
import { SignOutButton } from "@/components/sign-out-button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex items-center gap-2 p-4">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Chu kỳ của tôi</h1>
          <div className="ml-auto">
            <SignOutButton />
          </div>
        </header>
        <Separator />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
