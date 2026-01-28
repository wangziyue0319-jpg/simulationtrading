"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Position } from "@/store/simulationStore";

interface SellDialogProps {
  position: Position | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (shares: number) => { success: boolean; message?: string };
}

export function SellDialog({ position, isOpen, onClose, onConfirm }: SellDialogProps) {
  const [shares, setShares] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 重置状态
  useEffect(() => {
    if (isOpen && position) {
      setShares(0);
      setSliderValue(0);
      setMessage(null);
    }
  }, [isOpen, position]);

  if (!isOpen || !position) return null;

  const maxShares = Math.floor(position.shares);
  const estimatedAmount = sliderValue * position.currentPrice;

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    setShares(value);
  };

  const handleQuickSelect = (percent: number) => {
    const value = Math.floor(maxShares * percent);
    setSliderValue(value);
    setShares(value);
  };

  const handleConfirm = () => {
    if (shares <= 0) {
      setMessage({ type: "error", text: "请先选择卖出份额" });
      return;
    }

    const result = onConfirm(shares);
    if (result.success) {
      setMessage({ type: "success", text: result.message || "卖出成功！" });
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setMessage({ type: "error", text: result.message || "卖出失败" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <Card
        className="w-full max-w-md bg-gradient-to-br from-[#FFFDD0] to-white shadow-2xl animate-in zoom-in duration-200"
        style={{
          borderRadius: "1.5rem",
          border: "2px solid #FFB6C1",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-macaron-pink/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-macaron-pink/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-macaron-pink" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">卖出确认</h3>
              <p className="text-xs text-gray-500">{position.fundName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-macaron-pink/10 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* 持仓信息 */}
          <div className="bg-white/60 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">当前持仓</span>
              <span className="font-medium text-gray-800">{position.shares.toFixed(2)} 份</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">当前价格</span>
              <span className="font-medium text-gray-800">¥{position.currentPrice.toFixed(3)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">持仓成本</span>
              <span className="font-medium text-gray-800">¥{position.avgCost.toFixed(3)}</span>
            </div>
          </div>

          {/* 滑动条 */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              选择卖出份额：<span className="text-macaron-pink font-bold">{shares}</span> 份
            </label>
            <div className="relative">
              {/* 轨道背景 */}
              <div
                className="h-2 rounded-full transition-colors"
                style={{
                  background: `linear-gradient(to right, #E0FFF0 0%, #E0FFF0 ${(sliderValue / maxShares) * 100}%, #f0f0f0 ${(sliderValue / maxShares) * 100}%, #f0f0f0 100%)`,
                }}
              />
              {/* 滑动条 */}
              <input
                type="range"
                min="0"
                max={maxShares}
                value={sliderValue}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ appearance: "none", WebkitAppearance: "none" }}
              />
              {/* 自定义滑块 */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full shadow-lg border-2 border-white transition-transform hover:scale-110"
                style={{
                  left: `${(sliderValue / maxShares) * 100}%`,
                  transform: "translate(-50%, -50%)",
                  background: "linear-gradient(135deg, #FFB6C1 0%, #FFB3BA 100%)",
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>0 份</span>
              <span>{maxShares} 份</span>
            </div>
          </div>

          {/* 快速选择 */}
          <div className="flex gap-2">
            {[25, 50, 75, 100].map((percent) => (
              <Button
                key={percent}
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(percent / 100)}
                className="flex-1 border-macaron-pink/30 text-gray-700 hover:bg-macaron-pink hover:text-white hover:border-macaron-pink transition-all"
              >
                {percent}%
              </Button>
            ))}
          </div>

          {/* 预计回收资金 */}
          {shares > 0 && (
            <div className="bg-gradient-to-r from-macaron-green/10 to-macaron-blue/10 rounded-2xl p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">预计回收资金</p>
              <p className="text-2xl font-bold text-macaron-pink">
                ¥{estimatedAmount.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {shares === position.shares ? "🎯 清仓操作" : `📊 卖出 ${((shares / position.shares) * 100).toFixed(0)}%`}
              </p>
            </div>
          )}

          {/* 消息提示 */}
          {message && (
            <div
              className={cn(
                "text-center py-2 px-4 rounded-xl text-sm font-medium animate-in fade-in duration-200",
                message.type === "success"
                  ? "bg-macaron-green/20 text-macaron-green"
                  : "bg-macaron-pink/20 text-macaron-pink"
              )}
            >
              {message.text}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              取消
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={shares <= 0}
              className="flex-1 bg-gradient-to-r from-macaron-pink to-macaron-purple hover:from-macaron-pink/90 hover:to-macaron-purple/90 text-white font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderRadius: "0.75rem" }}
            >
              确认卖出
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
