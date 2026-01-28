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
  const [buyShares, setBuyShares] = useState("");
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedSellPosition, setSelectedSellPosition] = useState<ReturnType<typeof account.positions.find> | null>(null);

  const selectedFund = availableFunds.find((f) => f.code === selectedFundCode);
  const selectedPosition = selectedFundCode
    ? account.positions.find((p) => p.fundCode === selectedFundCode)
    : null;

  const handleBuy = () => {
    if (!selectedFundCode || !buyShares) return;

    const sharesNum = parseFloat(buyShares);
    if (isNaN(sharesNum) || sharesNum <= 0) {
      alert("请输入有效的份额");
      return;
    }

    buyFund(selectedFundCode, sharesNum);
    setBuyShares("");
  };

  const handleSellClick = () => {
    if (selectedPosition) {
      setSelectedSellPosition(selectedPosition);
      setSellDialogOpen(true);
    }
  };

  const handleSellConfirm = (sellShares: number) => {
    if (!selectedFundCode) return { success: false, message: "未选择基金" };

    const result = sellFund(selectedFundCode, sellShares);
    if (result.success) {
      setSelectedFundCode(null);
      setSellDialogOpen(false);
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
                    onClick={() => {
                      setSelectedFundCode(fund.code);
                      setBuyShares("");
                    }}
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

          {/* 买入/卖出操作区 */}
          {selectedFund && (
            <div className="space-y-4">
              {/* 如果有持仓，显示卖出按钮 */}
              {selectedPosition ? (
                <div className="space-y-3">
                  <div className="bg-macaron-cream rounded-card p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">当前持仓信息</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">持有份额</p>
                        <p className="font-medium">{selectedPosition.shares.toFixed(2)} 份</p>
                      </div>
                      <div>
                        <p className="text-gray-500">持仓成本</p>
                        <p className="font-medium">¥{selectedPosition.avgCost.toFixed(3)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">当前市值</p>
                        <p className="font-medium text-macaron-pink">
                          {formatCurrency(selectedPosition.marketValue)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleSellClick}
                    className="w-full bg-gradient-to-r from-macaron-blue to-macaron-green hover:from-macaron-blue/90 hover:to-macaron-green/90 text-white font-medium shadow-lg"
                    size="lg"
                  >
                    <TrendingDown className="w-5 h-5 mr-2" />
                    卖出（选择份额）
                  </Button>
                </div>
              ) : (
                /* 没有持仓，显示买入输入框 */
                <div className="space-y-2">
                  <label className="text-sm font-medium">买入份额</label>
                  <Input
                    type="number"
                    value={buyShares}
                    onChange={(e) => setBuyShares(e.target.value)}
                    placeholder="输入份额"
                    min="0"
                    step="100"
                  />
                  {buyShares && (
                    <p className="text-sm text-gray-600">
                      预计金额:{" "}
                      <span className="font-bold text-macaron-pink">
                        {formatCurrency(parseFloat(buyShares || "0") * selectedFund.price)}
                      </span>
                    </p>
                  )}
                  <Button
                    onClick={handleBuy}
                    disabled={!buyShares}
                    className="w-full bg-gradient-to-r from-macaron-pink to-macaron-purple hover:from-macaron-pink/90 hover:to-macaron-purple/90 text-white font-medium shadow-lg"
                    size="lg"
                  >
                    <TrendingUp className="w-5 h-5 mr-2" />
                    确认买入
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 卖出对话框 */}
      <SellDialog
        position={selectedSellPosition}
        isOpen={sellDialogOpen}
        onClose={() => setSellDialogOpen(false)}
        onConfirm={handleSellConfirm}
      />
    </>
  );
}
