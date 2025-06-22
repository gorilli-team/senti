"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Clock, Target } from "lucide-react";

const signals = [
  {
    id: 1,
    pair: "BTC/USDT",
    name: "Bitcoin",
    price: "$43,256.78",
    signal: "Strong Buy",
    confidence: 92,
    timeframe: "4H",
    entry: "$43,100",
    target: "$45,500",
    stopLoss: "$41,800",
    change: "+2.45%",
    changeType: "positive",
    signalType: "buy",
    timestamp: "2 min ago",
  },
  {
    id: 2,
    pair: "ETH/USDT",
    name: "Ethereum",
    price: "$2,847.32",
    signal: "Sell",
    confidence: 78,
    timeframe: "1H",
    entry: "$2,850",
    target: "$2,720",
    stopLoss: "$2,920",
    change: "-1.23%",
    changeType: "negative",
    signalType: "sell",
    timestamp: "5 min ago",
  },
  {
    id: 3,
    pair: "SOL/USDT",
    name: "Solana",
    price: "$98.45",
    signal: "Buy",
    confidence: 85,
    timeframe: "2H",
    entry: "$98.20",
    target: "$105.00",
    stopLoss: "$94.50",
    change: "+5.67%",
    changeType: "positive",
    signalType: "buy",
    timestamp: "8 min ago",
  },
];

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

export function MarketSignals() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Market Signals</h2>
          <p className="text-muted-foreground">
            Live trading signals with entry and exit points
          </p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Live
        </Badge>
      </div>

      <div className="grid gap-4">
        {signals.map((signal) => (
          <Card key={signal.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div>
                    <h3 className="font-semibold text-lg">{signal.pair}</h3>
                    <p className="text-sm text-muted-foreground">
                      {signal.name}
                    </p>
                  </div>
                  <Badge
                    className={`${
                      signalColors[
                        signal.signalType as keyof typeof signalColors
                      ]
                    }`}
                  >
                    {signal.signal}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{signal.price}</p>
                  <div className="flex items-center text-sm">
                    {signal.changeType === "positive" ? (
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span
                      className={
                        signal.changeType === "positive"
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      {signal.change}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center">
                    <Target className="h-3 w-3 mr-1" />
                    Entry
                  </p>
                  <p className="font-medium">{signal.entry}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="font-medium text-green-600">{signal.target}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Stop Loss</p>
                  <p className="font-medium text-red-600">{signal.stopLoss}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Timeframe
                  </p>
                  <p className="font-medium">{signal.timeframe}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Confidence: </span>
                    <span
                      className={`font-semibold ${confidenceColor(
                        signal.confidence
                      )}`}
                    >
                      {signal.confidence}%
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {signal.timestamp}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    Set Alert
                  </Button>
                  <Button
                    size="sm"
                    className={
                      signal.signalType === "buy"
                        ? "bg-green-600 hover:bg-green-700"
                        : signal.signalType === "sell"
                        ? "bg-red-600 hover:bg-red-700"
                        : ""
                    }
                  >
                    {signal.signalType === "buy"
                      ? "Buy Now"
                      : signal.signalType === "sell"
                      ? "Sell Now"
                      : "Watch"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
