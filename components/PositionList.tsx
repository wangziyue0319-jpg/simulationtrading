"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSimulationStore } from "@/store/simulationStore";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function PositionList() {
  const { account, updatePrices } = useSimulationStore();

  const getFundTypeColor = (type: string) => {
    const colors = {
      stock: "bg-red-100 text-red-700",
      bond: "bg-blue-100 text-blue-700",
      mix: "bg-purple-100 text-purple-700",
      money: "bg-yellow-100 text-yellow-700",
      index: "bg-green-100 text-green-700",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-700";
  };

  const getFundTypeName = (type: string) => {
    const names = {
      stock: "股票型",
      bond: "债券型",
      mix: "混合型",
      money: "货币型",
      index: "指数型",
    };
    return names[type as keyof typeof names] || type;
  };

  return (
    <div className="space-y-6">
      {/* Account Summary */}
      <Card className="border-macaron-green/30 bg-gradient-to-br from-macaron-green/10 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>账户概览</CardTitle>
            <button
              onClick={updatePrices}
              className="text-sm bg-macaron-pink text-white px-4 py-2 rounded-button hover:bg-macaron-pink/90 transition-colors"
            >
              更新价格
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">总资产</p>
              <p className="text-xl font-bold text-gray-800">
                {formatCurrency(account.totalAssets)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">持仓市值</p>
              <p className="text-xl font-bold text-gray-800">
                {formatCurrency(
                  account.positions.reduce((sum, p) => sum + p.marketValue, 0)
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">总收益</p>
              <p
                className={`text-xl font-bold flex items-center gap-1 ${
                  account.profitLoss >= 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {account.profitLoss >= 0 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
                {formatCurrency(Math.abs(account.profitLoss))}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">收益率</p>
              <p
                className={`text-xl font-bold ${
                  account.profitLossPercent >= 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {account.profitLossPercent >= 0 ? "+" : ""}
                {account.profitLossPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Positions */}
      <Card className="border-macaron-pink/20">
        <CardHeader>
          <CardTitle className="text-lg">我的持仓</CardTitle>
        </CardHeader>
        <CardContent>
          {account.positions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">还没有持仓</p>
              <p className="text-sm text-gray-400">
                快去买入你的第一只基金吧～
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {account.positions.map((position) => (
                <div
                  key={position.id}
                  className="bg-macaron-cream rounded-card p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {position.fundName}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${getFundTypeColor(
                            position.fundType
                          )}`}
                        >
                          {getFundTypeName(position.fundType)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{position.fundCode}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">持仓市值</p>
                      <p className="text-lg font-bold text-gray-800">
                        {formatCurrency(position.marketValue)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">持有份额</p>
                      <p className="font-medium">{position.shares.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">持仓成本</p>
                      <p className="font-medium">¥{position.avgCost.toFixed(3)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">当前价格</p>
                      <p className="font-medium">¥{position.currentPrice.toFixed(3)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">盈亏</p>
                      <p
                        className={`font-medium flex items-center gap-1 ${
                          position.profitLoss >= 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {position.profitLoss >= 0 ? "+" : ""}
                        {formatCurrency(position.profitLoss)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="border-macaron-pink/20">
        <CardHeader>
          <CardTitle className="text-lg">交易记录</CardTitle>
        </CardHeader>
        <CardContent>
          {account.transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">还没有交易记录</p>
            </div>
          ) : (
            <div className="space-y-2">
              {account.transactions.slice(0, 10).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          tx.type === "buy"
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {tx.type === "buy" ? "买入" : "卖出"}
                      </span>
                      <span className="font-medium text-sm">{tx.fundName}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {tx.shares.toFixed(2)}份 × ¥{tx.price.toFixed(3)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">
                      {formatCurrency(tx.totalAmount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
