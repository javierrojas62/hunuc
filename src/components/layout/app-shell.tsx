import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Topbar } from "./topbar";
import type { Session } from "@/lib/auth/session";

export function AppShell({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  const { profile } = session;
  return (
    <SidebarProvider>
      <AppSidebar
        role={profile.role}
        fullName={profile.full_name}
        email={profile.email}
        branchName={profile.branch?.name ?? null}
      />
      <SidebarInset className="flex min-h-svh flex-col">
        <Topbar />
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
