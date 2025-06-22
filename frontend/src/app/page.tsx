import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { MarketSignals } from "@/components/market-signals";
import { LiveFeed } from "@/components/live-feed";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Market Signals - Takes up 2/3 of the width */}
            <div className="lg:col-span-2">
              <MarketSignals />
            </div>

            {/* Live Feed - Takes up 1/3 of the width */}
            <div className="lg:col-span-1">
              <LiveFeed />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
