"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUp, TrendingDown } from "lucide-react";
import { API_ENDPOINTS, fetchAPI } from "@/lib/api";

interface ExecutedTrade {
  _id: string;
  pair: string;
  action: "BUY" | "SELL";
  amount_usd?: number;
  amount_token?: number;
  price: number;
  timestamp: string;
  rsi?: number;
  tx_hash?: string;
}

export function LiveFeed() {
  const [trades, setTrades] = useState<ExecutedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchAPI(
          `${API_ENDPOINTS.tradingHistory}?limit=10`
        );
        setTrades(response.data);
      } catch (err) {
        setError("Failed to load trading data");
        console.error("Failed to fetch trades:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();

    // Refresh every 30 seconds
    const interval = setInterval(fetchTrades, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatAmount = (trade: ExecutedTrade) => {
    if (trade.amount_usd) {
      return `$${trade.amount_usd.toFixed(2)}`;
    } else if (trade.amount_token) {
      return `${trade.amount_token} ${trade.pair.split("/")[0]}`;
    }
    return "N/A";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(price);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const tradeTime = new Date(timestamp);
    const diffInSeconds = Math.floor(
      (now.getTime() - tradeTime.getTime()) / 1000
    );

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Live Feed</CardTitle>
          <CardDescription>Loading trading activity...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-start space-x-3 p-3 rounded-lg border"
              >
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Live Feed</CardTitle>
          <CardDescription className="text-red-600">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Live Feed
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </CardTitle>
            <CardDescription>
              Real-time trading activity from smart contracts
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[800px] overflow-y-auto">
        {trades.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent trades found
          </div>
        ) : (
          trades.map((trade) => {
            const user = "Senti";
            const amount = formatAmount(trade);
            const price = formatPrice(trade.price);
            const timeAgo = formatTimeAgo(trade.timestamp);

            return (
              <div
                key={trade._id}
                className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" alt={user} />
                  <AvatarFallback className="text-xs">
                    {user.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm">
                      <span className="font-medium">{user}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        {trade.action.toLowerCase() === "buy"
                          ? "bought"
                          : "sold"}{" "}
                      </span>
                      <span className="font-medium">{trade.pair}</span>
                    </p>
                    {trade.action === "BUY" ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-medium">{amount}</span>
                      <span className="text-muted-foreground">@</span>
                      <span className="font-medium">{price}</span>
                    </div>
                    {trade.rsi && (
                      <Badge variant="outline" className="text-xs">
                        RSI: {trade.rsi.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{timeAgo}</p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
