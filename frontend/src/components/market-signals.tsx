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
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  buy: "bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-200 shadow-sm",
  sell: "bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-red-200 shadow-sm",
  hold: "bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-800 border-yellow-200 shadow-sm",
};

const cardGradients = {
  buy: "bg-gradient-to-br from-green-50 via-white to-emerald-50 border-l-4 border-l-green-500",
  sell: "bg-gradient-to-br from-red-50 via-white to-rose-50 border-l-4 border-l-red-500",
  hold: "bg-gradient-to-br from-yellow-50 via-white to-amber-50 border-l-4 border-l-yellow-500",
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
  const router = useRouter();
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [priceChanges24h, setPriceChanges24h] = useState<
    Record<string, number>
  >({});

  const fetch24hPriceChange = useCallback(async (symbol: string) => {
    try {
      const now = Date.now();
      const data = await fetchAPI(
        `${API_ENDPOINTS.data}?symbol=${encodeURIComponent(symbol)}&limit=1000`
      );
      console.log("Fetched data for", symbol, data.data);
      const prices = (data.data || []).filter((d: MarketSignal) => {
        const t = new Date(d.timestamp).getTime();
        const in24h = t >= now - 24 * 60 * 60 * 1000;
        if (!in24h) {
          console.log(
            "Filtered out (not in 24h):",
            d.timestamp,
            t,
            now - 24 * 60 * 60 * 1000
          );
        }
        return in24h;
      });
      console.log("Prices in last 24h for", symbol, prices);
      if (prices.length > 1) {
        const oldest = prices[prices.length - 1].price;
        const latest = prices[0].price;
        console.log("Oldest:", oldest, "Latest:", latest);
        return ((latest - oldest) / oldest) * 100;
      }
      return 0;
    } catch (e) {
      console.error("Error fetching 24h price change for", symbol, e);
      return 0;
    }
  }, []);

  const fetchSignals = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchAPI(`${API_ENDPOINTS.data}?limit=10`);
      setSignals(data.data || []);
      setPriceChanges24h(data.priceChanges24h || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching market signals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignalClick = (signal: MarketSignal) => {
    // Navigate to the charts page for this token
    router.push(`/charts/${encodeURIComponent(signal.symbol)}`);
  };

  useEffect(() => {
    setMounted(true);
    fetchSignals();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchSignals, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (signals.length === 0) return;
    (async () => {
      const changes: Record<string, number> = {};
      await Promise.all(
        signals.map(async (signal) => {
          changes[signal.symbol] = await fetch24hPriceChange(signal.symbol);
        })
      );
      setPriceChanges24h(changes);
    })();
  }, [signals, fetch24hPriceChange]);

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
        <div className="grid gap-3">
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
        <div className="grid gap-3">
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
        <div className="grid gap-3">
          {signals.map((signal) => {
            const signalType = getSignalType(
              signal.sentiment,
              signal.technicalIndicators.rsi,
              signal.rsi_signal
            );
            const signalText = getSignalText(signalType);
            const confidence = Math.round(signal.metadata.confidence * 100);
            const priceChange = priceChanges24h[signal.symbol] ?? 0;

            return (
              <Card
                key={signal._id}
                className={`hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.02] ${cardGradients[signalType]}`}
                onClick={() => handleSignalClick(signal)}
              >
                <CardContent className="px-3 py-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div>
                        <h3 className="font-semibold text-sm">
                          {signal.symbol}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {getFearGreedText(signal.fearGreedIndex)}
                        </p>
                      </div>
                      <Badge className={`text-xs ${signalColors[signalType]}`}>
                        {signalText}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm bg-white/80 rounded px-2 py-0.5 inline-block">
                        {formatPrice(signal.price)}
                      </p>
                      <div className="flex items-center text-xs mt-0.5">
                        {priceChange > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                        )}
                        <span
                          className={`font-medium px-1 py-0.5 rounded text-xs ${
                            priceChange > 0
                              ? "text-green-700 bg-green-100"
                              : "text-red-700 bg-red-100"
                          }`}
                        >
                          {Math.abs(priceChange).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-2">
                    <div className="space-y-0.5 bg-white/60 rounded p-1">
                      <p className="text-xs text-muted-foreground flex items-center font-medium">
                        <Target className="h-3 w-3 mr-1" />
                        RSI
                      </p>
                      <p className="font-bold text-xs">
                        {signal.technicalIndicators.rsi.toFixed(1)}
                      </p>
                    </div>
                    <div className="space-y-0.5 bg-white/60 rounded p-1">
                      <p className="text-xs text-muted-foreground font-medium">
                        Sentiment
                      </p>
                      <p
                        className={`font-bold text-xs ${
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
                    <div className="space-y-0.5 bg-white/60 rounded p-1">
                      <p className="text-xs text-muted-foreground font-medium">
                        Fear/Greed
                      </p>
                      <p className="font-bold text-xs">
                        {signal.fearGreedIndex}
                      </p>
                    </div>
                    <div className="space-y-0.5 bg-white/60 rounded p-1">
                      <p className="text-xs text-muted-foreground flex items-center font-medium">
                        <Clock className="h-3 w-3 mr-1" />
                        Updated
                      </p>
                      <p className="font-bold text-xs">
                        {formatTimestamp(signal.timestamp)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-white/40 rounded p-1">
                    <div className="flex items-center space-x-1">
                      <div className="text-xs text-muted-foreground bg-white/60 rounded px-1.5 py-0.5">
                        Source: {signal.metadata.source}
                      </div>
                      <div className="text-xs text-muted-foreground bg-white/80 rounded px-1.5 py-0.5">
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
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        className={`h-6 px-2 text-xs font-medium shadow-sm ${
                          signalType === "buy"
                            ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                            : signalType === "sell"
                            ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
                            : "bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white"
                        }`}
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
