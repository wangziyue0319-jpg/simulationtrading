/**
 * 基金数据 API 服务
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface FundInfo {
  code: string;
  name: string;
  type: string;
  company: string;
  value: number;
  day_growth: number;
  week_growth?: number;
  month_growth?: number;
  year_growth?: number;
}

export interface FundSearchResult {
  code: string;
  name: string;
  type: string;
}

export interface FundDetail {
  code: string;
  name: string;
  type: string;
  company: string;
  value: number;
  day_growth: number;
  value_date: string;
  nav_history: Array<{
    date: string;
    value: number;
    accumulated: number;
  }>;
}

export interface FundQuote {
  code: string;
  name: string;
  value: number;
  day_growth: number;
  value_date: string;
  timestamp: string;
}

/**
 * 获取基金列表
 */
export async function getFundList(): Promise<FundInfo[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/funds/list`);
    if (!response.ok) throw new Error('获取基金列表失败');
    return await response.json();
  } catch (error) {
    console.error('获取基金列表失败:', error);
    return [];
  }
}

/**
 * 搜索基金
 */
export async function searchFunds(query: string, limit: number = 20): Promise<FundSearchResult[]> {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/api/funds/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!response.ok) throw new Error('搜索失败');
    return await response.json();
  } catch (error) {
    console.error('搜索基金失败:', error);
    return [];
  }
}

/**
 * 获取基金详情
 */
export async function getFundDetail(code: string): Promise<FundDetail | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/funds/${code}/detail`);
    if (!response.ok) throw new Error('获取基金详情失败');
    return await response.json();
  } catch (error) {
    console.error('获取基金详情失败:', error);
    return null;
  }
}

/**
 * 获取基金实时报价
 */
export async function getFundQuote(code: string): Promise<FundQuote | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/funds/${code}/quote`);
    if (!response.ok) throw new Error('获取基金报价失败');
    return await response.json();
  } catch (error) {
    console.error('获取基金报价失败:', error);
    return null;
  }
}
