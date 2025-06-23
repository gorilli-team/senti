"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Activity } from "lucide-react";
import { API_ENDPOINTS, fetchAPI } from "@/lib/api";

export function FearGreedIndicators() {
  const [fearMoves, setFearMoves] = useState(0);
  const [greedMoves, setGreedMoves] = useState(0);
  const [totalMoves, setTotalMoves] = useState(0);
  const [sentimentScore, setSentimentScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const stats = await fetchAPI(`${API_ENDPOINTS.tradingHistory}/stats`);
        const fear = stats.sellCount || 0;
        const greed = stats.buyCount || 0;
        const total = fear + greed;
        setFearMoves(fear);
        setGreedMoves(greed);
        setTotalMoves(total);
        setSentimentScore(total > 0 ? (greed / total) * 99 + 1 : 50);
      } catch (err) {
        setError(`Failed to load trading stats: ${err}`);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const fearPercentage = totalMoves > 0 ? (fearMoves / totalMoves) * 100 : 0;
  const greedPercentage = totalMoves > 0 ? (greedMoves / totalMoves) * 100 : 0;

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Fear & Greed Tracker (Sell & Buy)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Fear & Greed Tracker (Sell & Buy)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-red-600">{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Fear & Greed Tracker (Sell & Buy)</span>
          <div className="flex items-center space-x-1">
            <Activity className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">30d</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Combined Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* Fear */}
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 mb-1">
                <TrendingDown className="h-3 w-3 text-red-700" />
                <span className="text-sm font-medium text-red-700">Fear</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg font-bold text-red-700">
                  {fearMoves}
                </span>
                <span className="text-sm font-bold text-red-700">
                  {fearPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-red-200 rounded-full h-1">
                <div
                  className="bg-red-600 h-1 rounded-full"
                  style={{ width: `${fearPercentage}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Greed */}
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 mb-1">
                <TrendingUp className="h-3 w-3 text-green-700" />
                <span className="text-sm font-medium text-green-700">
                  Greed
                </span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg font-bold text-green-700">
                  {greedMoves}
                </span>
                <span className="text-sm font-bold text-green-700">
                  {greedPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-1">
                <div
                  className="bg-green-600 h-1 rounded-full"
                  style={{ width: `${greedPercentage}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Sentiment */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-3">
              <div className="text-sm font-medium text-blue-700 mb-1">
                Sentiment
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg font-bold text-blue-700">
                  {sentimentScore.toFixed(0)}
                </span>
                <span className="text-xs text-blue-600">
                  {sentimentScore > 50
                    ? "Greed"
                    : sentimentScore < 50
                    ? "Fear"
                    : "Neutral"}
                </span>
              </div>
              <div className="text-xs text-blue-600 leading-tight">
                Market sentiment score based on buy vs sell ratio. Higher values
                indicate bullish sentiment.
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
