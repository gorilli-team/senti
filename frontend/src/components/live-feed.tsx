"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

const feedData = [
  {
    id: 1,
    user: "Alex_Trader",
    action: "bought",
    pair: "BTC/USDT",
    amount: "$5,200",
    price: "$43,256",
    time: "30s ago",
    avatar: "/placeholder.svg?height=32&width=32",
    type: "buy",
    profit: null,
  },
  {
    id: 2,
    user: "CryptoSarah",
    action: "sold",
    pair: "ETH/USDT",
    amount: "$2,800",
    price: "$2,847",
    time: "1m ago",
    avatar: "/placeholder.svg?height=32&width=32",
    type: "sell",
    profit: "+$340",
  },
  {
    id: 3,
    user: "Mike_Hodler",
    action: "bought",
    pair: "SOL/USDT",
    amount: "$1,500",
    price: "$98.45",
    time: "2m ago",
    avatar: "/placeholder.svg?height=32&width=32",
    type: "buy",
    profit: null,
  },
  {
    id: 4,
    user: "Luna_Trader",
    action: "sold",
    pair: "ADA/USDT",
    amount: "$890",
    price: "$0.5234",
    time: "3m ago",
    avatar: "/placeholder.svg?height=32&width=32",
    type: "sell",
    profit: "+$67",
  },
  {
    id: 5,
    user: "BTC_Whale",
    action: "bought",
    pair: "AVAX/USDT",
    amount: "$12,000",
    price: "$37.82",
    time: "4m ago",
    avatar: "/placeholder.svg?height=32&width=32",
    type: "buy",
    profit: null,
  },
];

export function LiveFeed() {
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
              Real-time trading activity from our community
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[800px] overflow-y-auto">
        {feedData.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={activity.avatar || "/placeholder.svg"}
                alt={activity.user}
              />
              <AvatarFallback className="text-xs">
                {activity.user.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm">
                  <span className="font-medium">{activity.user}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    {activity.action}{" "}
                  </span>
                  <span className="font-medium">{activity.pair}</span>
                </p>
                {activity.type === "buy" ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">{activity.amount}</span>
                  <span className="text-muted-foreground">@</span>
                  <span className="font-medium">{activity.price}</span>
                </div>
                {activity.profit && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      activity.profit.startsWith("+")
                        ? "text-green-600 border-green-200 bg-green-50"
                        : "text-red-600 border-red-200 bg-red-50"
                    }`}
                  >
                    <DollarSign className="h-3 w-3 mr-1" />
                    {activity.profit}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
