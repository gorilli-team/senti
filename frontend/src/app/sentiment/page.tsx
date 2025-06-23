"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { API_ENDPOINTS, fetchAPI } from "@/lib/api";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

interface SentimentDataPoint {
  timestamp: string;
  value: number;
  value_classification: string;
}

interface HistoricalSentimentData {
  data: SentimentDataPoint[];
}

export default function SentimentPage() {
  const [historicalData, setHistoricalData] = useState<SentimentDataPoint[]>(
    []
  );
  const [latestData, setLatestData] = useState<SentimentDataPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSentimentData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both latest and historical data
        const [latestResponse, historicalResponse] = await Promise.all([
          fetchAPI(`${API_ENDPOINTS.fearGreed}/latest`),
          fetchAPI(`${API_ENDPOINTS.fearGreed}/historical`),
        ]);

        setLatestData(latestResponse);
        setHistoricalData(historicalResponse);
      } catch (err) {
        console.error("Failed to fetch sentiment data:", err);
        setError("Failed to load sentiment data");
      } finally {
        setLoading(false);
      }
    };

    fetchSentimentData();
  }, []);

  const getSentimentInfo = (value: number) => {
    if (value >= 80)
      return {
        label: "Extreme Greed",
        color: "text-red-600",
        bgColor: "bg-red-100",
        borderColor: "border-red-200",
        emoji: "🤑",
      };
    if (value >= 60)
      return {
        label: "Greed",
        color: "text-orange-600",
        bgColor: "bg-orange-100",
        borderColor: "border-orange-200",
        emoji: "😏",
      };
    if (value >= 40)
      return {
        label: "Neutral",
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        borderColor: "border-yellow-200",
        emoji: "😐",
      };
    if (value >= 20)
      return {
        label: "Fear",
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        borderColor: "border-blue-200",
        emoji: "😨",
      };
    return {
      label: "Extreme Fear",
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-green-200",
      emoji: "😱",
    };
  };

  const calculateStats = (data: SentimentDataPoint[]) => {
    if (data.length === 0) return null;

    const values = data.map((d) => d.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Count classifications
    const classifications = data.reduce((acc, item) => {
      acc[item.value_classification] =
        (acc[item.value_classification] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { avg, min, max, classifications };
  };

  const stats = calculateStats(historicalData);

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader />
          <div className="flex flex-1 flex-col gap-6 p-6">
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-bold">Market Sentiment Analysis</h1>
              <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader />
          <div className="flex flex-1 flex-col gap-6 p-6">
            <h1 className="text-3xl font-bold mb-6">
              Market Sentiment Analysis
            </h1>
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-xl font-semibold text-red-600 mb-2">
                  Error Loading Data
                </h2>
                <p className="text-muted-foreground">{error}</p>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <h1 className="text-3xl font-bold">Market Sentiment Analysis</h1>

          {/* Current Sentiment */}
          {latestData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Current Market Sentiment</span>
                  <Badge
                    className={`${getSentimentInfo(latestData.value).bgColor} ${
                      getSentimentInfo(latestData.value).color
                    } ${getSentimentInfo(latestData.value).borderColor}`}
                  >
                    {getSentimentInfo(latestData.value).label}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-5xl">
                      {getSentimentInfo(latestData.value).emoji}
                    </span>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {latestData.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last updated:{" "}
                      {new Date(
                        parseInt(latestData.timestamp) * 1000
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sentiment Distribution */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.classifications).map(
                    ([classification, count]) => {
                      const percentage = (
                        (count / historicalData.length) *
                        100
                      ).toFixed(1);
                      return (
                        <div
                          key={classification}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm font-medium">
                            {classification}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Average Sentiment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.avg.toFixed(1)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Highest Sentiment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.max}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Lowest Sentiment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.min}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Data Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {historicalData.length}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Historical Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Historical Sentiment Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                      <th className="text-left py-3 px-4 font-medium">Value</th>
                      <th className="text-left py-3 px-4 font-medium">
                        Classification
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicalData.slice(0, 20).map((item, index) => {
                      const sentimentInfo = getSentimentInfo(item.value);
                      return (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            {new Date(
                              parseInt(item.timestamp) * 1000
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-3 px-4 font-medium">
                            {item.value}
                          </td>
                          <td className="py-3 px-4">
                            {item.value_classification}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              className={`${sentimentInfo.bgColor} ${sentimentInfo.color} ${sentimentInfo.borderColor} text-xs`}
                            >
                              {sentimentInfo.label}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {historicalData.length > 20 && (
                <div className="text-center mt-4 text-sm text-muted-foreground">
                  Showing first 20 entries of {historicalData.length} total
                  records
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
