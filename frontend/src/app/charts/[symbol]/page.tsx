"use client";

import { useEffect, useState, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchAPI, API_ENDPOINTS } from "@/lib/api";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import LightweightChart from "@/components/LightweightChart";

interface PriceData {
  _id: string;
  symbol: string;
  price: number;
  sentiment: number;
  fearGreedIndex: number;
  technicalIndicators: {
    rsi: number;
  };
  rsi_signal?: number;
  timestamp: string;
  metadata: {
    source: string;
    confidence: number;
    tags: string[];
  };
}

interface ChartData {
  time: number;
  price: number;
}

const formatPrice = (price: number): string => {
  if (price >= 1000) {
    return `$${price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `$${price.toFixed(4)}`;
};

const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString();
};

const getSignalType = (
  sentiment: number,
  rsi: number,
  rsiSignal?: number
): "buy" | "sell" | "hold" => {
  if (rsiSignal !== undefined) {
    switch (rsiSignal) {
      case 1:
        return "buy";
      case 2:
        return "sell";
      case 0:
      default:
        return "hold";
    }
  }

  if (sentiment > 0.1 && rsi < 70) return "buy";
  if (sentiment < -0.1 || rsi > 70) return "sell";
  return "hold";
};

const getSignalText = (signalType: "buy" | "sell" | "hold"): string => {
  switch (signalType) {
    case "buy":
      return "Strong Buy";
    case "sell":
      return "Sell";
    case "hold":
      return "Hold";
  }
};

const getFearGreedText = (index: number): string => {
  if (index <= 25) return "Extreme Fear";
  if (index <= 45) return "Fear";
  if (index <= 55) return "Neutral";
  if (index <= 75) return "Greed";
  return "Extreme Greed";
};

export default function ChartPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const router = useRouter();
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  // Unwrap the params Promise
  const { symbol } = use(params);
  const decodedSymbol = decodeURIComponent(symbol);

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Fetching data for symbol:", decodedSymbol);

        // Fetch price data for the specific symbol
        const data = await fetchAPI(
          `${API_ENDPOINTS.data}?symbol=${decodedSymbol}&limit=100`
        );

        console.log("API response:", data);

        setPriceData(data.data || []);

        // Convert price data to chart format
        const chartDataPoints =
          data.data?.map((item: PriceData) => {
            return {
              time: new Date(item.timestamp).getTime(),
              price: item.price,
            };
          }) || [];

        console.log("Chart data points:", chartDataPoints);
        setChartData(chartDataPoints);
      } catch (err) {
        console.error("Error fetching price data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPriceData();
  }, [decodedSymbol]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <div className="grid gap-6">
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-64 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => router.back()}>Go Back</Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    const latestData = priceData[0];
    if (!latestData) {
      return (
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">
                No data available for {decodedSymbol}
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    const signalType = getSignalType(
      latestData.sentiment,
      latestData.technicalIndicators.rsi,
      latestData.rsi_signal
    );
    const signalText = getSignalText(signalType);
    const priceChange = latestData.sentiment * 100;

    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">{decodedSymbol}</h1>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(latestData.price)}
              </p>
              <div className="flex items-center">
                {priceChange > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span
                  className={
                    priceChange > 0 ? "text-green-500" : "text-red-500"
                  }
                >
                  {Math.abs(priceChange).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          <Badge
            className={
              signalType === "buy"
                ? "bg-green-100 text-green-800"
                : signalType === "sell"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }
          >
            {signalText}
          </Badge>
        </div>

        <div className="grid gap-6">
          {/* Chart */}
          <Card>
            <CardContent className="p-4">
              {chartData && chartData.length > 0 ? (
                <LightweightChart
                  data={chartData}
                  height={200}
                  symbol={decodedSymbol}
                />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-500">
                  Loading chart data...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technical Indicators */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    RSI
                  </p>
                  <p className="text-xl font-bold">
                    {latestData.technicalIndicators.rsi.toFixed(1)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Sentiment</p>
                  <p
                    className={`text-xl font-bold ${
                      latestData.sentiment > 0
                        ? "text-green-600"
                        : latestData.sentiment < 0
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {(latestData.sentiment * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Fear/Greed</p>
                  <p className="text-xl font-bold">
                    {latestData.fearGreedIndex}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getFearGreedText(latestData.fearGreedIndex)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Confidence
                  </p>
                  <p className="text-xl font-bold">
                    {Math.round(latestData.metadata.confidence * 100)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Data */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Price Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {priceData.slice(0, 10).map((data) => (
                  <div
                    key={data._id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div>
                      <p className="font-medium">{formatPrice(data.price)}</p>
                      <p className="text-sm text-gray-500">
                        {formatTimestamp(data.timestamp)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        RSI: {data.technicalIndicators.rsi.toFixed(1)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Sentiment: {(data.sentiment * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        {renderContent()}
      </SidebarInset>
    </SidebarProvider>
  );
}
