"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { searchFunds, type FundSearchResult } from "@/lib/fundApi";
import { cn } from "@/lib/utils";

interface FundSearchProps {
  onSelect: (fund: FundSearchResult) => void;
  placeholder?: string;
}

export function FundSearch({ onSelect, placeholder = "搜索基金代码或名称..." }: FundSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FundSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        try {
          const data = await searchFunds(query, 10);
          setResults(data);
          setShowResults(true);
        } catch (error) {
          console.error('搜索失败:', error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // 点击外部关闭搜索结果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (fund: FundSearchResult) => {
    onSelect(fund);
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  const getFundTypeLabel = (type: string) => {
    const labels = {
      stock: "股票型",
      bond: "债券型",
      mix: "混合型",
      money: "货币型",
      index: "指数型",
    };
    return labels[type as keyof typeof labels] || type;
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

  return (
    <div ref={searchRef} className="relative w-full">
      {/* 搜索输入框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border-2 border-macaron-pink/30 rounded-2xl focus:outline-none focus:border-macaron-pink focus:ring-2 focus:ring-macaron-pink/20 transition-all text-sm"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-macaron-pink animate-spin" />
        )}
      </div>

      {/* 搜索结果下拉列表 */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border-2 border-macaron-pink/20 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2">
            {results.map((fund, index) => (
              <button
                key={fund.code}
                onClick={() => handleSelect(fund)}
                className={cn(
                  "w-full text-left p-3 rounded-xl hover:bg-macaron-cream transition-colors",
                  index === 0 && "bg-macaron-cream"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate text-sm">{fund.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{fund.code}</p>
                  </div>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs flex-shrink-0",
                      getFundTypeColor(fund.type)
                    )}
                  >
                    {getFundTypeLabel(fund.type)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* 底部提示 */}
          <div className="px-4 py-2 bg-macaron-cream border-t border-macaron-pink/10">
            <p className="text-xs text-gray-500 text-center">
              💡 使用 ↑↓ 键选择，Enter 确认
            </p>
          </div>
        </div>
      )}

      {/* 无结果提示 */}
      {showResults && query.length >= 2 && !loading && results.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border-2 border-macaron-pink/20 p-4">
          <p className="text-sm text-gray-500 text-center">
            未找到匹配的基金，请尝试其他关键词
          </p>
        </div>
      )}
    </div>
  );
}
