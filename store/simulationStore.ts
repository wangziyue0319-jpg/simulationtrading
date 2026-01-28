import { create } from "zustand";

export interface Position {
  id: string;
  fundCode: string;
  fundName: string;
  fundType: "stock" | "bond" | "mix" | "money" | "index";
  shares: number;
  avgCost: number;
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
  sellFund: (fundCode: string, shares: number) => void;
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
    let newAvgCost = fund.price;

    if (existingPosition) {
      // Update existing position
      const totalShares = existingPosition.shares + shares;
      newAvgCost =
        (existingPosition.avgCost * existingPosition.shares +
          fund.price * shares) / totalShares;

      newPositions = account.positions.map((p) =>
        p.fundCode === fundCode
          ? {
              ...p,
              shares: totalShares,
              avgCost: newAvgCost,
              marketValue: totalShares * fund.price,
              profitLoss: totalShares * fund.price - newAvgCost * totalShares,
              profitLossPercent:
                ((fund.price - newAvgCost) / newAvgCost) * 100,
            }
          : p
      );
    } else {
      // Create new position
      const newPosition: Position = {
        id: Date.now().toString(),
        fundCode: fund.code,
        fundName: fund.name,
        fundType: fund.type,
        shares,
        avgCost: fund.price,
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

    if (!position) {
      alert("未找到该持仓！");
      return;
    }

    if (shares > position.shares) {
      alert("卖出份额超过持仓份额！");
      return;
    }

    const fund = mockFunds.find((f) => f.code === fundCode)!;
    const totalAmount = shares * fund.price;

    let newPositions: Position[];
    if (shares === position.shares) {
      // Remove position entirely
      newPositions = account.positions.filter((p) => p.fundCode !== fundCode);
    } else {
      // Update position
      newPositions = account.positions.map((p) =>
        p.fundCode === fundCode
          ? {
              ...p,
              shares: p.shares - shares,
              marketValue: (p.shares - shares) * fund.price,
              profitLoss:
                (p.shares - shares) * fund.price - p.avgCost * (p.shares - shares),
              profitLossPercent:
                ((fund.price - p.avgCost) / p.avgCost) * 100,
            }
          : p
      );
    }

    // Create transaction
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      fundCode: fund.code,
      fundName: fund.name,
      fundType: fund.type,
      type: "sell",
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
        profitLoss: marketValue - position.avgCost * position.shares,
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
