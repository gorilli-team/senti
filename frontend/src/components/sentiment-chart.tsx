"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SentimentChartProps {
  sentimentValue?: number; // 0-100 scale
  previousValue?: number;
  marketMood?: string;
}

export function SentimentChart({
  sentimentValue = 40,
  previousValue = 58,
  marketMood = "Greed",
}: SentimentChartProps) {
  // Determine sentiment category and colors
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

  const sentimentInfo = getSentimentInfo(sentimentValue);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Market Sentiment Index</span>
          <Badge
            className={`${sentimentInfo.bgColor} ${sentimentInfo.color} ${sentimentInfo.borderColor} text-xs`}
          >
            {sentimentInfo.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Sentiment Image and Score */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">{sentimentInfo.emoji}</span>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {sentimentValue}
            </div>
            <div className="text-sm text-muted-foreground">Sentiment Score</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
