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

export default function SentimentPage() {
  const [historicalData, setHistoricalData] = useState<SentimentDataPoint[]>(
    []
  );
  const [latestData, setLatestData] = useState<SentimentDataPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Market Sentiment Analysis</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              <img
                src="/coinmarketcap.png"
                alt="CoinMarketCap Logo"
                className="w-5 h-5 mr-1"
              />
              Data from CoinMarketCap APIs
            </div>
          </div>

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

          {/* Explanation Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>About the Fear and Greed Index</span>
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <span>{showExplanation ? "Show less" : "Learn more"}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      showExplanation ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-semibold text-base mb-1">
                  What is the Fear and Greed Index?
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  The Fear and Greed Index measures cryptocurrency market
                  sentiment on a 0-100 scale, where lower values indicate
                  extreme fear and higher values indicate extreme greed. This
                  helps investors understand market emotions and potential
                  buying/selling opportunities.
                </p>
              </div>

              {showExplanation && (
                <>
                  <div>
                    <h3 className="font-semibold text-base mb-1">
                      How to Use This Index
                    </h3>
                    <div className="space-y-1 text-muted-foreground text-sm">
                      <div className="flex items-start space-x-2">
                        <span className="text-blue-600 font-semibold">•</span>
                        <span>
                          <strong>Market Sentiment Analysis:</strong> High
                          values suggest overheated markets, low values may
                          indicate buying opportunities.
                        </span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-blue-600 font-semibold">•</span>
                        <span>
                          <strong>Contrarian Strategy:</strong> &ldquo;Be
                          fearful when others are greedy and greedy when others
                          are fearful.&rdquo;
                        </span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-blue-600 font-semibold">•</span>
                        <span>
                          <strong>Complementary Analysis:</strong> Use alongside
                          other tools, not in isolation.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-1">
                      How It&apos;s Calculated
                    </h3>
                    <p className="text-muted-foreground text-sm mb-2">
                      The index uses five components:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-semibold text-gray-900">
                          Price Momentum
                        </div>
                        <div className="text-muted-foreground">
                          Top 10 cryptocurrencies performance
                        </div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-semibold text-gray-900">
                          Volatility
                        </div>
                        <div className="text-muted-foreground">
                          BTC/ETH implied volatility indices
                        </div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-semibold text-gray-900">
                          Derivatives Market
                        </div>
                        <div className="text-muted-foreground">
                          BTC/ETH options Put/Call ratio
                        </div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-semibold text-gray-900">
                          Market Composition
                        </div>
                        <div className="text-muted-foreground">
                          Stablecoin Supply Ratio
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-600">ℹ️</span>
                      <div className="text-blue-800 text-xs">
                        <div className="font-semibold mb-1">Data Source</div>
                        <div>
                          Sourced from{" "}
                          <a
                            href="https://coinmarketcap.com/charts/fear-and-greed-index/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-600"
                          >
                            CoinMarketCap Fear and Greed Index
                          </a>
                          .
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

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
