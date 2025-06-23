"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { API_ENDPOINTS, fetchAPI } from "@/lib/api";
import Link from "next/link";

interface SentimentData {
  timestamp: string;
  value: number;
  classification: string;
}

interface SentimentChartProps {
  sentimentValue?: number; // 0-100 scale (fallback)
}

export function SentimentChart({
  sentimentValue: fallbackValue = 40,
}: SentimentChartProps) {
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSentimentData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAPI(`${API_ENDPOINTS.fearGreed}/latest`);
        setSentimentData(data);
      } catch (err) {
        console.error("Failed to fetch sentiment data:", err);
        setError("Failed to load sentiment data");
      } finally {
        setLoading(false);
      }
    };

    fetchSentimentData();
  }, []);

  // Use API data if available, otherwise use fallback
  const sentimentValue = sentimentData?.value ?? fallbackValue;

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

  if (loading) {
    return (
      <Link href="/sentiment" className="block">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Market Sentiment Index</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-3">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-300 animate-pulse">
                  --
                </div>
                <div className="text-sm text-muted-foreground">Loading...</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (error) {
    return (
      <Link href="/sentiment" className="block">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Market Sentiment Index</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-3">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
                <span className="text-4xl">⚠️</span>
              </div>
              <div className="text-center">
                <div className="text-sm text-red-600">{error}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Using fallback data
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href="/sentiment" className="block">
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
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
              <div className="text-sm text-muted-foreground">
                Sentiment Score
              </div>
              {sentimentData?.timestamp && (
                <div className="text-xs text-muted-foreground mt-1">
                  Updated:{" "}
                  {new Date(
                    parseInt(sentimentData.timestamp) * 1000
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
              <div className="text-xs text-blue-600 mt-2 hover:underline">
                View historical data →
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
