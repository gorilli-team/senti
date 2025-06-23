"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { fetchAPI, API_ENDPOINTS } from "@/lib/api";

interface MarketSignal {
  _id: string;
  symbol: string;
  price: number;
  sentiment: number;
  fearGreedIndex: number;
  technicalIndicators: {
    rsi: number;
  };
  rsi_signal?: number; // 0=hold, 1=buy, 2=sell
  timestamp: string;
  metadata: {
    source: string;
    confidence: number;
    tags: string[];
  };
}

const signalColors = {
  buy: "bg-green-100 text-green-800 border-green-200",
  sell: "bg-red-100 text-red-800 border-red-200",
  hold: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

const confidenceColor = (confidence: number) => {
  if (confidence >= 85) return "text-green-600";
  if (confidence >= 70) return "text-yellow-600";
  return "text-red-600";
};

const getSignalType = (
  sentiment: number,
  rsi: number,
  rsiSignal?: number
): "buy" | "sell" | "hold" => {
  // If we have an RSI signal, use it directly
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

  // Fallback to sentiment-based logic if no RSI signal
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
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

export function MarketSignals() {
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchSignals = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchAPI(`${API_ENDPOINTS.data}?limit=10`);
      setSignals(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching market signals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchSignals();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchSignals, 30000);
    return () => clearInterval(interval);
  }, []);

  // Don't render anything until component is mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Market Signals</h2>
            <p className="text-muted-foreground">
              Live trading signals with entry and exit points
            </p>
          </div>
          <Badge variant="outline" className="bg-gray-50 text-gray-700">
            <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
            Loading...
          </Badge>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Market Signals</h2>
            <p className="text-muted-foreground">
              Live trading signals with entry and exit points
            </p>
          </div>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
            Loading...
          </Badge>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Market Signals</h2>
            <p className="text-muted-foreground">
              Live trading signals with entry and exit points
            </p>
          </div>
          <Badge variant="outline" className="bg-red-50 text-red-700">
            Error
          </Badge>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchSignals} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Market Signals</h2>
          <p className="text-muted-foreground">
            Live trading signals with entry and exit points
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchSignals} size="sm" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Live
          </Badge>
        </div>
      </div>

      {signals.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No market signals available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {signals.map((signal) => {
            const signalType = getSignalType(
              signal.sentiment,
              signal.technicalIndicators.rsi,
              signal.rsi_signal
            );
            const signalText = getSignalText(signalType);
            const confidence = Math.round(signal.metadata.confidence * 100);
            const priceChange = signal.sentiment * 100; // Simulate price change based on sentiment

            return (
              <Card
                key={signal._id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {signal.symbol}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {getFearGreedText(signal.fearGreedIndex)}
                        </p>
                      </div>
                      <Badge className={signalColors[signalType]}>
                        {signalText}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {formatPrice(signal.price)}
                      </p>
                      <div className="flex items-center text-sm">
                        {priceChange > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
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

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Target className="h-3 w-3 mr-1" />
                        RSI
                      </p>
                      <p className="font-medium">
                        {signal.technicalIndicators.rsi.toFixed(1)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Sentiment</p>
                      <p
                        className={`font-medium ${
                          signal.sentiment > 0
                            ? "text-green-600"
                            : signal.sentiment < 0
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {(signal.sentiment * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Fear/Greed
                      </p>
                      <p className="font-medium">{signal.fearGreedIndex}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Updated
                      </p>
                      <p className="font-medium">
                        {formatTimestamp(signal.timestamp)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          Confidence:{" "}
                        </span>
                        <span
                          className={`font-semibold ${confidenceColor(
                            confidence
                          )}`}
                        >
                          {confidence}%
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Source: {signal.metadata.source}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        Set Alert
                      </Button>
                      <Button
                        size="sm"
                        className={
                          signalType === "buy"
                            ? "bg-green-600 hover:bg-green-700"
                            : signalType === "sell"
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-yellow-600 hover:bg-yellow-700"
                        }
                      >
                        {signalType === "buy"
                          ? "Buy Now"
                          : signalType === "sell"
                          ? "Sell Now"
                          : "Watch"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
