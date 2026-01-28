"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSimulationStore } from "@/store/simulationStore";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { SellDialog } from "@/components/SellDialog";

export function TradePanel() {
  const { availableFunds, buyFund, sellFund, account } = useSimulationStore();
  const [selectedFundCode, setSelectedFundCode] = useState<string | null>(null);
  const [shares, setShares] = useState("");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedSellPosition, setSelectedSellPosition] = useState<string | null>(null);

  const selectedFund = availableFunds.find((f) => f.code === selectedFundCode);

  const handleTrade = () => {
    if (!selectedFundCode || !shares) return;

    const sharesNum = parseFloat(shares);
    if (isNaN(sharesNum) || sharesNum <= 0) {
      alert("请输入有效的份额");
      return;
    }

    if (tradeType === "buy") {
      buyFund(selectedFundCode, sharesNum);
      setShares("");
    } else {
      // 打开卖出对话框
      const position = account.positions.find((p) => p.fundCode === selectedFundCode);
      if (position) {
        setSelectedSellPosition(selectedFundCode);
        setSellDialogOpen(true);
      }
    }
  };

  const handleSellConfirm = (sellShares: number) => {
    if (!selectedSellPosition) return { success: false, message: "未选择基金" };

    const result = sellFund(selectedSellPosition, sellShares);
    if (result.success) {
      setShares("");
      setSelectedFundCode(null);
    }
    return result;
  };

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

  // 获取当前选中基金的持仓信息
  const selectedPosition = selectedFundCode
    ? account.positions.find((p) => p.fundCode === selectedFundCode)
    : null;

  return (
    <>
      <Card className="border-macaron-pink/20">
        <CardHeader>
          <CardTitle className="text-lg">交易面板</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Account Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-macaron-cream rounded-card p-4 text-center">
              <p className="text-xs text-gray-600 mb-1">总资产</p>
              <p className="text-lg font-bold text-gray-800">
                {formatCurrency(account.totalAssets)}
              </p>
            </div>
            <div className="bg-macaron-cream rounded-card p-4 text-center">
              <p className="text-xs text-gray-600 mb-1">可用资金</p>
              <p className="text-lg font-bold text-macaron-pink">
                {formatCurrency(account.cashBalance)}
              </p>
            </div>
          </div>

          {/* Fund Selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium">选择基金</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {availableFunds.map((fund) => {
                const position = account.positions.find((p) => p.fundCode === fund.code);
                return (
                  <button
                    key={fund.code}
                    onClick={() => setSelectedFundCode(fund.code)}
                    className={`p-3 rounded-card border-2 transition-all text-left ${
                      selectedFundCode === fund.code
                        ? "border-macaron-pink bg-macaron-pink/10"
                        : "border-gray-200 hover:border-macaron-pink/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{fund.name}</p>
                        <p className="text-xs text-gray-500">{fund.code}</p>
                        {position && (
                          <p className="text-xs text-macaron-purple mt-1">
                            持仓: {position.shares.toFixed(2)} 份
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${getFundTypeColor(
                          fund.type
                        )}`}
                      >
                        {getFundTypeName(fund.type)}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-macaron-pink mt-2">
                      ¥{fund.price.toFixed(3)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trade Type Selector */}
          {selectedFund && (
            <>
              <div className="flex gap-2">
                <Button
                  variant={tradeType === "buy" ? "default" : "outline"}
                  onClick={() => setTradeType("buy")}
                  className="flex-1 gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  买入
                </Button>
                <Button
                  variant={tradeType === "sell" ? "default" : "outline"}
                  onClick={() => setTradeType("sell")}
                  className="flex-1 gap-2"
                  disabled={!selectedPosition}
                >
                  <TrendingDown className="w-4 h-4" />
                  卖出
                </Button>
              </div>

              {/* 买入操作 */}
              {tradeType === "buy" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">买入份额</label>
                  <Input
                    type="number"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    placeholder="输入份额"
                    min="0"
                    step="100"
                  />
                  {selectedFund && shares && (
                    <p className="text-sm text-gray-600">
                      预计金额:{" "}
                      <span className="font-bold text-macaron-pink">
                        {formatCurrency(parseFloat(shares || "0") * selectedFund.price)}
                      </span>
                    </p>
                  )}
                  <Button
                    onClick={handleTrade}
                    disabled={!shares}
                    className="w-full"
                    size="lg"
                  >
                    确认买入
                  </Button>
                </div>
              )}

              {/* 卖出操作 - 直接打开对话框 */}
              {tradeType === "sell" && selectedPosition && (
                <div className="space-y-3">
                  <div className="bg-macaron-cream rounded-card p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">当前持仓</span>
                      <span className="font-medium text-gray-800">
                        {selectedPosition.shares.toFixed(2)} 份
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">持仓成本</span>
                      <span className="font-medium text-gray-800">
                        ¥{selectedPosition.avgCost.toFixed(3)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">当前市值</span>
                      <span className="font-medium text-macaron-pink">
                        {formatCurrency(selectedPosition.marketValue)}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setSellDialogOpen(true)}
                    className="w-full"
                    size="lg"
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    打开卖出面板
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 卖出对话框 */}
      <SellDialog
        position={selectedPosition}
        isOpen={sellDialogOpen}
        onClose={() => setSellDialogOpen(false)}
        onConfirm={handleSellConfirm}
      />
    </>
  );
}
