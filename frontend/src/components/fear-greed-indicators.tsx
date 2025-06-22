"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Activity } from "lucide-react";

interface FearGreedIndicatorsProps {
  fearMoves?: number;
  greedMoves?: number;
  totalMoves?: number;
}

export function FearGreedIndicators({
  fearMoves = 12,
  greedMoves = 8,
  totalMoves = 20,
}: FearGreedIndicatorsProps) {
  const fearPercentage = totalMoves > 0 ? (fearMoves / totalMoves) * 100 : 0;
  const greedPercentage = totalMoves > 0 ? (greedMoves / totalMoves) * 100 : 0;

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
              <div className="text-xs text-red-600">Avg loss: xxx</div>
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
    </div>
  );
}
