import { create } from "zustand";

export interface Position {
  id: string;
  fundCode: string;
  fundName: string;
  fundType: "stock" | "bond" | "mix" | "money" | "index";
  shares: number;
  totalCost: number; // 总成本
  avgCost: number; // 持仓均价 = totalCost / shares
  currentPrice: number;
  profitLoss: number;
  profitLossPercent: number;
  marketValue: number;
}

export interface Transaction {
  id: string;
  fundCode: string;
  fundName: string;
  fundType: string;
  type: "buy" | "sell";
  sellType?: "partial" | "full"; // 部分卖出 或 清仓
  shares: number;
  price: number;
  totalAmount: number;
  createdAt: Date;
}

export interface SimulationAccount {
  totalAssets: number;
  cashBalance: number;
  profitLoss: number;
  profitLossPercent: number;
  positions: Position[];
  transactions: Transaction[];
}

// Mock fund data (不展示真实基金名称)
const mockFunds = [
  { code: "F001", name: "成长优选混合", type: "mix" as const, price: 2.456 },
  { code: "F002", name: "稳健债券A", type: "bond" as const, price: 1.234 },
  { code: "F003", name: "科技先锋股票", type: "stock" as const, price: 3.789 },
  { code: "F004", name: "沪深300指数", type: "index" as const, price: 1.876 },
  { code: "F005", name: "货币增强", type: "money" as const, price: 1.023 },
  { code: "F006", name: "消费主题混合", type: "mix" as const, price: 2.123 },
  { code: "F007", name: "价值精选股票", type: "stock" as const, price: 1.987 },
  { code: "F008", name: "新能源指数", type: "index" as const, price: 1.543 },
];

interface SimulationStore {
  account: SimulationAccount;
  availableFunds: typeof mockFunds;

  // Actions
  buyFund: (fundCode: string, shares: number) => void;
  sellFund: (fundCode: string, shares: number) => { success: boolean; message?: string };
  updatePrices: () => void;
  resetAccount: () => void;
}

const initialState: SimulationAccount = {
  totalAssets: 100000,
  cashBalance: 100000,
  profitLoss: 0,
  profitLossPercent: 0,
  positions: [],
  transactions: [],
};

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  account: initialState,
  availableFunds: mockFunds,

  buyFund: (fundCode: string, shares: number) => {
    const fund = mockFunds.find((f) => f.code === fundCode);
    if (!fund) return;

    const { account } = get();
    const totalAmount = shares * fund.price;

    if (totalAmount > account.cashBalance) {
      alert("现金余额不足！");
      return;
    }

    // Check if position exists
    const existingPosition = account.positions.find(
      (p) => p.fundCode === fundCode
    );

    let newPositions: Position[];
    let newTotalCost: number;
    let newAvgCost: number;

    if (existingPosition) {
      // 使用加权平均法更新持仓成本
      // 新总成本 = 旧总成本 + 新购入价格 × 数量
      newTotalCost = existingPosition.totalCost + (fund.price * shares);
      const totalShares = existingPosition.shares + shares;
      newAvgCost = newTotalCost / totalShares;

      newPositions = account.positions.map((p) =>
        p.fundCode === fundCode
          ? {
              ...p,
              shares: totalShares,
              totalCost: newTotalCost,
              avgCost: newAvgCost,
              currentPrice: fund.price,
              marketValue: totalShares * fund.price,
              profitLoss: totalShares * fund.price - newTotalCost,
              profitLossPercent:
                ((fund.price - newAvgCost) / newAvgCost) * 100,
            }
          : p
      );
    } else {
      // 新建持仓，总成本 = 购入价格 × 数量
      newTotalCost = fund.price * shares;
      newAvgCost = fund.price;

      const newPosition: Position = {
        id: Date.now().toString(),
        fundCode: fund.code,
        fundName: fund.name,
        fundType: fund.type,
        shares,
        totalCost: newTotalCost,
        avgCost: newAvgCost,
        currentPrice: fund.price,
        marketValue: shares * fund.price,
        profitLoss: 0,
        profitLossPercent: 0,
      };
      newPositions = [...account.positions, newPosition];
    }

    // Create transaction
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      fundCode: fund.code,
      fundName: fund.name,
      fundType: fund.type,
      type: "buy",
      shares,
      price: fund.price,
      totalAmount,
      createdAt: new Date(),
    };

    // Update account
    const newCashBalance = account.cashBalance - totalAmount;
    const newTotalAssets = newPositions.reduce(
      (sum, p) => sum + p.marketValue,
      0
    ) + newCashBalance;

    set({
      account: {
        ...account,
        cashBalance: newCashBalance,
        totalAssets: newTotalAssets,
        profitLoss: newTotalAssets - 100000,
        profitLossPercent: ((newTotalAssets - 100000) / 100000) * 100,
        positions: newPositions,
        transactions: [newTransaction, ...account.transactions],
      },
    });
  },

  sellFund: (fundCode: string, shares: number) => {
    const { account } = get();
    const position = account.positions.find((p) => p.fundCode === fundCode);

    // 校验：卖出份额不能超过持仓份额
    if (!position) {
      return { success: false, message: "未找到该持仓" };
    }

    if (shares <= 0) {
      return { success: false, message: "卖出份额必须大于0" };
    }

    if (shares > position.shares) {
      return {
        success: false,
        message: `卖出份额超过持仓份额！你最多可卖出 ${position.shares.toFixed(2)} 份`,
      };
    }

    const fund = mockFunds.find((f) => f.code === fundCode)!;
    const totalAmount = shares * fund.price;
    const isFullSell = shares === position.shares;
    const sellRatio = shares / position.shares;

    let newPositions: Position[];
    if (isFullSell) {
      // 清仓：移除整个持仓
      newPositions = account.positions.filter((p) => p.fundCode !== fundCode);
    } else {
      // 部分卖出：按比例扣除 totalCost
      const newTotalCost = position.totalCost * (1 - sellRatio);
      const newShares = position.shares - shares;

      newPositions = account.positions.map((p) =>
        p.fundCode === fundCode
          ? {
              ...p,
              shares: newShares,
              totalCost: newTotalCost,
              avgCost: newTotalCost / newShares,
              currentPrice: fund.price,
              marketValue: newShares * fund.price,
              profitLoss: newShares * fund.price - newTotalCost,
              profitLossPercent:
                ((fund.price - (newTotalCost / newShares)) / (newTotalCost / newShares)) * 100,
            }
          : p
      );
    }

    // Create transaction with sellType
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      fundCode: fund.code,
      fundName: fund.name,
      fundType: fund.type,
      type: "sell",
      sellType: isFullSell ? "full" : "partial",
      shares,
      price: fund.price,
      totalAmount,
      createdAt: new Date(),
    };

    // Update account
    const newCashBalance = account.cashBalance + totalAmount;
    const newTotalAssets = newPositions.reduce(
      (sum, p) => sum + p.marketValue,
      0
    ) + newCashBalance;

    set({
      account: {
        ...account,
        cashBalance: newCashBalance,
        totalAssets: newTotalAssets,
        profitLoss: newTotalAssets - 100000,
        profitLossPercent: ((newTotalAssets - 100000) / 100000) * 100,
        positions: newPositions,
        transactions: [newTransaction, ...account.transactions],
      },
    });

    return {
      success: true,
      message: isFullSell ? "清仓成功！" : "卖出成功！",
    };
  },

  updatePrices: () => {
    const { account } = get();

    // Simulate price changes (-3% to +3%)
    const newPositions = account.positions.map((position) => {
      const changePercent = (Math.random() - 0.5) * 0.06;
      const newPrice = position.currentPrice * (1 + changePercent);
      const marketValue = position.shares * newPrice;

      return {
        ...position,
        currentPrice: newPrice,
        marketValue,
        profitLoss: marketValue - position.totalCost,
        profitLossPercent:
          ((newPrice - position.avgCost) / position.avgCost) * 100,
      };
    });

    const newTotalAssets =
      newPositions.reduce((sum, p) => sum + p.marketValue, 0) +
      account.cashBalance;

    set({
      account: {
        ...account,
        totalAssets: newTotalAssets,
        profitLoss: newTotalAssets - 100000,
        profitLossPercent: ((newTotalAssets - 100000) / 100000) * 100,
        positions: newPositions,
      },
    });
  },

  resetAccount: () => {
    set({ account: initialState });
  },
}));
