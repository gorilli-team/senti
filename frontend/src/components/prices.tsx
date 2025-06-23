"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_ENDPOINTS, fetchAPI } from "@/lib/api";

interface PriceData {
  pair: string;
  priceReadable: string;
  timestamp: string;
  priceChange?: number;
  priceChangePercent?: number;
}

export function Prices() {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true);
        const stats = await fetchAPI(API_ENDPOINTS.priceFeeds + "/stats");

        // Get current prices for top pairs
        const pricePromises = stats.byPair
          .slice(0, 6)
          .map(
            async (pairStat: {
              _id: string;
              latestPriceReadable: string;
              latestTimestamp: string;
            }) => {
              try {
                const currentPrice = await fetchAPI(
                  `${API_ENDPOINTS.priceFeeds}/current/${pairStat._id}`
                );
                return {
                  pair: pairStat._id,
                  priceReadable: currentPrice.priceReadable,
                  timestamp: currentPrice.timestamp,
                };
              } catch (error) {
                console.error(
                  `Error fetching price for ${pairStat._id}:`,
                  error
                );
                return {
                  pair: pairStat._id,
                  priceReadable: pairStat.latestPriceReadable || "N/A",
                  timestamp: pairStat.latestTimestamp,
                };
              }
            }
          );

        const priceData = await Promise.all(pricePromises);
        setPrices(priceData);
      } catch (err) {
        console.error("Error fetching prices:", err);
        setError("Failed to load price data");
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();

    // Refresh prices every 30 seconds
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    if (isNaN(num)) return price;

    if (num >= 1) {
      return num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } else {
      return num.toFixed(6);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">💰</span>
            Live Prices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">💰</span>
            Live Prices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-blue-500 hover:text-blue-600"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">💰</span>
          Live Prices
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prices.map((price) => (
            <div
              key={price.pair}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <img
                    src={`/${price.pair.split("/")[0].toLowerCase()}.png`}
                    alt={price.pair}
                    className="h-8 w-8 rounded-full"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://cryptologos.cc/logos/generic-crypto-logo.png?v=040";
                    }}
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-500">
                    {price.pair.split("/")[0]}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">
                  ${formatPrice(price.priceReadable)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatTime(price.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {prices.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>No price data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
