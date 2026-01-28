import { create } from "zustand";
import { FundInfo, getFundQuote, getFundList } from "@/lib/fundApi";

export interface Fund {
  code: string;
  name: string;
  type: "stock" | "bond" | "mix" | "money" | "index";
  company?: string;
  price: number;
  dayGrowth: number;
}

interface FundStore {
  // 基金列表（热门基金）
  popularFunds: Fund[];

  // 用户自定义添加的基金
  customFunds: Fund[];

  // 所有可用基金（去重）
  allFunds: Fund[];

  // 是否正在加载
  isLoading: boolean;

  // Actions
  loadPopularFunds: () => Promise<void>;
  addCustomFund: (code: string) => Promise<Fund | null>;
  updateFundPrice: (code: string) => Promise<void>;
  getAllFunds: () => Fund[];
}

const mockFunds: Fund[] = [
  { code: "000001", name: "华夏成长混合", type: "mix", price: 1.234, dayGrowth: 0.5 },
  { code: "110022", name: "易方达消费行业股票", type: "stock", price: 2.456, dayGrowth: 1.2 },
  { code: "161725", name: "招商中证白酒指数", type: "index", price: 1.567, dayGrowth: -0.3 },
  { code: "270002", name: "广发稳健增长混合", type: "mix", price: 1.876, dayGrowth: 0.8 },
  { code: "519732", name: "交银定期支付双息平衡混合", type: "mix", price: 1.543, dayGrowth: 0.2 },
  { code: "001618", name: "天弘中证电子ETF联接A", type: "index", price: 1.234, dayGrowth: 0.6 },
  { code: "005827", name: "易方达蓝筹精选混合", type: "mix", price: 1.987, dayGrowth: 1.5 },
  { code: "161025", name: "招商国证生物医药指数", type: "index", price: 1.321, dayGrowth: -0.5 },
];

export const useFundStore = create<FundStore>((set, get) => ({
  popularFunds: mockFunds,
  customFunds: [],
  allFunds: mockFunds,
  isLoading: false,

  loadPopularFunds: async () => {
    set({ isLoading: true });
    try {
      const funds = await getFundList();
      const convertedFunds: Fund[] = funds.map((f) => ({
        code: f.code,
        name: f.name,
        type: f.type as Fund["type"],
        company: f.company,
        price: f.value,
        dayGrowth: f.day_growth,
      }));
      set({ popularFunds: convertedFunds });
      get().getAllFunds(); // 更新 allFunds
    } catch (error) {
      console.error("加载热门基金失败:", error);
      // 保持使用 mock 数据
    } finally {
      set({ isLoading: false });
    }
  },

  addCustomFund: async (code: string) => {
    try {
      const quote = await getFundQuote(code);
      if (!quote) {
        alert("获取基金信息失败，请检查基金代码");
        return null;
      }

      const newFund: Fund = {
        code: quote.code,
        name: quote.name,
        type: "mix", // 默认混合型，后续可以根据实际情况调整
        price: quote.value,
        dayGrowth: quote.day_growth,
      };

      const { customFunds } = get();
      if (!customFunds.find((f) => f.code === code)) {
        set({ customFunds: [...customFunds, newFund] });
        get().getAllFunds();
      }

      return newFund;
    } catch (error) {
      console.error("添加基金失败:", error);
      alert("添加基金失败，请稍后重试");
      return null;
    }
  },

  updateFundPrice: async (code: string) => {
    try {
      const quote = await getFundQuote(code);
      if (!quote) return;

      const { popularFunds, customFunds } = get();

      // 更新 popularFunds
      const updatedPopular = popularFunds.map((f) =>
        f.code === code
          ? { ...f, price: quote.value, dayGrowth: quote.day_growth }
          : f
      );

      // 更新 customFunds
      const updatedCustom = customFunds.map((f) =>
        f.code === code
          ? { ...f, price: quote.value, dayGrowth: quote.day_growth }
          : f
      );

      set({
        popularFunds: updatedPopular,
        customFunds: updatedCustom,
      });
      get().getAllFunds();
    } catch (error) {
      console.error("更新基金价格失败:", error);
    }
  },

  getAllFunds: () => {
    const { popularFunds, customFunds } = get();
    const allFundsMap = new Map<string, Fund>();

    // 先添加热门基金
    popularFunds.forEach((fund) => {
      allFundsMap.set(fund.code, fund);
    });

    // 再添加自定义基金（覆盖同代码的）
    customFunds.forEach((fund) => {
      allFundsMap.set(fund.code, fund);
    });

    const allFunds = Array.from(allFundsMap.values());
    set({ allFunds });
    return allFunds;
  },
}));
