"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { API_ENDPOINTS, fetchAPI } from "@/lib/api";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

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

interface TradingStats {
  totalTrades: number;
  totalVolume: number;
  buyCount: number;
  sellCount: number;
  averagePrice: number;
  profitLoss: number;
  pairs: string[];
  recentTrades: ExecutedTrade[];
}

export default function TradingHistoryPage() {
  const [trades, setTrades] = useState<ExecutedTrade[]>([]);
  const [stats, setStats] = useState<TradingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    pair: "",
    action: "",
  });

  useEffect(() => {
    fetchTradingData();
  }, [currentPage, filters]);

  const fetchTradingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });

      if (filters.pair) {
        params.append("pair", filters.pair);
      }
      if (filters.action) {
        params.append("action", filters.action);
      }

      // Fetch both trades and stats
      const [tradesResponse, statsResponse] = await Promise.all([
        fetchAPI(`${API_ENDPOINTS.tradingHistory}?${params}`),
        fetchAPI(`${API_ENDPOINTS.tradingHistory}/stats`),
      ]);

      setTrades(tradesResponse.data);
      setTotalPages(tradesResponse.pagination.totalPages);
      setStats(statsResponse);
    } catch (err) {
      console.error("Failed to fetch trading data:", err);
      setError("Failed to load trading history");
    } finally {
      setLoading(false);
    }
  };

  const getActionInfo = (action: string) => {
    if (action === "BUY") {
      return {
        label: "Buy",
        color: "text-green-600",
        bgColor: "bg-green-100",
        borderColor: "border-green-200",
        emoji: "📈",
      };
    } else {
      return {
        label: "Sell",
        color: "text-red-600",
        bgColor: "bg-red-100",
        borderColor: "border-red-200",
        emoji: "📉",
      };
    }
  };

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

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader />
          <div className="flex flex-1 flex-col gap-6 p-6">
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-bold">Trading History</h1>
              <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader />
          <div className="flex flex-1 flex-col gap-6 p-6">
            <h1 className="text-3xl font-bold mb-6">Trading History</h1>
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-xl font-semibold text-red-600 mb-2">
                  Error Loading Data
                </h2>
                <p className="text-muted-foreground">{error}</p>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Trading History</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              <span>📊</span>
              Executed Trades from Smart Contracts
            </div>
          </div>

          {/* Trading Statistics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Trades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTrades}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Volume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${stats.totalVolume.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Buy/Sell Ratio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.buyCount}/{stats.sellCount}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    P&L
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      stats.profitLoss >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ${stats.profitLoss.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">
                    Trading Pair
                  </label>
                  <select
                    value={filters.pair}
                    onChange={(e) =>
                      setFilters({ ...filters, pair: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">All Pairs</option>
                    {stats?.pairs.map((pair) => (
                      <option key={pair} value={pair}>
                        {pair}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">
                    Action
                  </label>
                  <select
                    value={filters.action}
                    onChange={(e) =>
                      setFilters({ ...filters, action: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">All Actions</option>
                    <option value="BUY">Buy</option>
                    <option value="SELL">Sell</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trades Table */}
          <Card>
            <CardHeader>
              <CardTitle>Executed Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                      <th className="text-left py-3 px-4 font-medium">Pair</th>
                      <th className="text-left py-3 px-4 font-medium">
                        Action
                      </th>
                      <th className="text-left py-3 px-4 font-medium">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-medium">Price</th>
                      <th className="text-left py-3 px-4 font-medium">RSI</th>
                      <th className="text-left py-3 px-4 font-medium">
                        Transaction
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => {
                      const actionInfo = getActionInfo(trade.action);
                      return (
                        <tr
                          key={trade._id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="py-3 px-4">
                            {new Date(trade.timestamp).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </td>
                          <td className="py-3 px-4 font-medium">
                            {trade.pair}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              className={`${actionInfo.bgColor} ${actionInfo.color} ${actionInfo.borderColor} text-xs`}
                            >
                              <span className="mr-1">{actionInfo.emoji}</span>
                              {actionInfo.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">{formatAmount(trade)}</td>
                          <td className="py-3 px-4 font-medium">
                            {formatPrice(trade.price)}
                          </td>
                          <td className="py-3 px-4">
                            {trade.rsi ? trade.rsi.toFixed(2) : "N/A"}
                          </td>
                          <td className="py-3 px-4">
                            {trade.tx_hash ? (
                              <a
                                href={`https://testnet.bscscan.com/tx/${trade.tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-xs"
                              >
                                {trade.tx_hash.slice(0, 8)}...
                              </a>
                            ) : (
                              "N/A"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Trades Summary */}
          {stats?.recentTrades && stats.recentTrades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentTrades.map((trade) => {
                    const actionInfo = getActionInfo(trade.action);
                    return (
                      <div
                        key={trade._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{actionInfo.emoji}</span>
                          <div>
                            <div className="font-medium">{trade.pair}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(trade.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatAmount(trade)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatPrice(trade.price)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
