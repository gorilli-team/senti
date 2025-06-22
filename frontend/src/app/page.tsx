import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <h1 className="text-3xl font-bold">Market Signals Dashboard</h1>
          <p>Components will go here...</p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
