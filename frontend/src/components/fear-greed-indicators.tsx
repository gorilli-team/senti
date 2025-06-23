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
        // Sentiment score: 1 (all fear) to 100 (all greed)
        setSentimentScore(total > 0 ? (greed / total) * 99 + 1 : 50);
      } catch (err) {
        setError("Failed to load trading stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const fearPercentage = totalMoves > 0 ? (fearMoves / totalMoves) * 100 : 0;
  const greedPercentage = totalMoves > 0 ? (greedMoves / totalMoves) * 100 : 0;

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }
  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Fear & Greed Tracker</h2>
          <p className="text-sm text-muted-foreground">
            Your trading sentiment analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Activity className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Last 30 days</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Fear Indicator */}
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2 text-red-700 text-base">
              <TrendingDown className="h-4 w-4" />
              <span>Fear Moves (SELL)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-red-700">
                  {fearMoves}
                </span>
                <div className="text-right">
                  <div className="text-xl font-bold text-red-700">
                    {fearPercentage.toFixed(0)}%
                  </div>
                  <div className="text-xs text-red-600">of total moves</div>
                </div>
              </div>
              <div className="w-full bg-red-200 rounded-full h-1.5">
                <div
                  className="bg-red-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${fearPercentage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Greed Indicator */}
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2 text-green-700 text-base">
              <TrendingUp className="h-4 w-4" />
              <span>Greed Moves (BUY)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-green-700">
                  {greedMoves}
                </span>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-700">
                    {greedPercentage.toFixed(0)}%
                  </div>
                  <div className="text-xs text-green-600">of total moves</div>
                </div>
              </div>
              <div className="w-full bg-green-200 rounded-full h-1.5">
                <div
                  className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${greedPercentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-green-600">Avg gain: xxx</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Score */}
      <div className="mt-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2 text-blue-700 text-base">
              <span>Sentiment Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center space-x-4">
              <span className="text-3xl font-bold text-blue-700">
                {sentimentScore.toFixed(0)}
              </span>
              <span className="text-xs text-blue-600">
                (
                {sentimentScore > 50
                  ? "Greed-dominant"
                  : sentimentScore < 50
                  ? "Fear-dominant"
                  : "Neutral"}
                )
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
