import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { MarketSignals } from "@/components/market-signals";
import { LiveFeed } from "@/components/live-feed";
import { FearGreedIndicators } from "@/components/fear-greed-indicators";
import { SentimentChart } from "@/components/sentiment-chart";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Fear & Greed Indicators */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <FearGreedIndicators />
            </div>
            <div className="lg:col-span-1">
              <SentimentChart />
            </div>
          </div>

          {/* Market Signals and Live Feed */}
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
