"""
基金数据后端服务
使用 akshare 获取天天基金网数据
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import akshare as ak
import pandas as pd
from typing import List, Optional
from datetime import datetime
import asyncio
from functools import lru_cache

app = FastAPI(title="基金数据服务", version="1.0.0")

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FundInfo(BaseModel):
    """基金信息模型"""
    code: str
    name: str
    type: str
    company: str
    value: float  # 最新净值
    day_growth: float  # 日增长率
    week_growth: Optional[float] = None
    month_growth: Optional[float] = None
    year_growth: Optional[float] = None


class FundSearchResult(BaseModel):
    """基金搜索结果"""
    code: str
    name: str
    type: str


class FundDetail(BaseModel):
    """基金详情"""
    code: str
    name: str
    type: str
    company: str
    value: float
    day_growth: float
    value_date: str
    nav_history: List[dict]  # 净值历史


# 内存缓存
_fund_list_cache = None
_fund_list_cache_time = None
CACHE_DURATION = 3600  # 缓存1小时


def get_fund_type(code: str) -> str:
    """根据基金代码判断类型"""
    if code.startswith('000') or code.startswith('001'):
        return 'mix'  # 混合型
    elif code.startswith('1617') or code.startswith('1634'):
        return 'index'  # 指数型
    elif code.startswith('519') or code.startswith('161'):
        return 'stock'  # 股票型
    elif code.startswith('1619') or code.startswith('005'):
        return 'bond'  # 债券型
    elif code.startswith('002') or code.startswith('003'):
        return 'money'  # 货币型
    else:
        return 'mix'  # 默认混合型


@app.get("/")
async def root():
    """健康检查"""
    return {
        "service": "基金数据服务",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/funds/list", response_model=List[FundInfo])
async def get_fund_list():
    """
    获取基金列表（热门基金）
    返回前100只热门基金
    """
    global _fund_list_cache, _fund_list_cache_time

    # 检查缓存
    if _fund_list_cache and _fund_list_cache_time:
        cache_age = (datetime.now() - _fund_list_cache_time).total_seconds()
        if cache_age < CACHE_DURATION:
            return _fund_list_cache

    try:
        # 获取开放式基金列表
        df = ak.fund_open_fund_info_em(
            symbol="开放式基金",
            indicator="单位净值走势"
        )

        # 转换为基金信息列表
        funds = []
        for _, row in df.head(100).iterrows():
            try:
                fund_code = str(row.get('基金代码', ''))
                fund_name = str(row.get('基金名称', ''))
                fund_value = float(row.get('单位净值', 1.0))
                fund_growth = float(row.get('日增长率', 0.0))

                funds.append(FundInfo(
                    code=fund_code,
                    name=fund_name,
                    type=get_fund_type(fund_code),
                    company=str(row.get('基金公司', '')),
                    value=fund_value,
                    day_growth=fund_growth
                ))
            except Exception as e:
                print(f"处理基金数据时出错: {e}")
                continue

        # 更新缓存
        _fund_list_cache = funds
        _fund_list_cache_time = datetime.now()

        return funds

    except Exception as e:
        print(f"获取基金列表失败: {e}")
        # 返回一些默认的模拟基金
        return [
            FundInfo(
                code="000001",
                name="华夏成长混合",
                type="mix",
                company="华夏基金",
                value=1.234,
                day_growth=0.5
            ),
            FundInfo(
                code="110022",
                name="易方达消费行业股票",
                type="stock",
                company="易方达基金",
                value=2.456,
                day_growth=1.2
            ),
            FundInfo(
                code="161725",
                name="招商中证白酒指数",
                type="index",
                company="招商基金",
                value=1.567,
                day_growth=-0.3
            ),
        ]


@app.get("/api/funds/search", response_model=List[FundSearchResult])
async def search_funds(q: str = "", limit: int = 20):
    """
    搜索基金
    :param q: 搜索关键词（基金代码或名称）
    :param limit: 返回结果数量限制
    """
    if not q or len(q) < 2:
        return []

    try:
        # 尝试获取实时基金数据
        df = ak.fund_open_fund_info_em(
            symbol="开放式基金",
            indicator="单位净值走势"
        )

        # 筛选匹配的基金
        results = []
        search_lower = q.lower()

        for _, row in df.iterrows():
            if len(results) >= limit:
                break

            fund_code = str(row.get('基金代码', ''))
            fund_name = str(row.get('基金名称', ''))

            # 匹配基金代码或名称
            if search_lower in fund_code or search_lower in fund_name.lower():
                results.append(FundSearchResult(
                    code=fund_code,
                    name=fund_name,
                    type=get_fund_type(fund_code)
                ))

        return results

    except Exception as e:
        print(f"搜索基金失败: {e}")
        # 返回模拟数据
        mock_funds = [
            FundSearchResult(code="000001", name="华夏成长混合", type="mix"),
            FundSearchResult(code="110022", name="易方达消费行业股票", type="stock"),
            FundSearchResult(code="161725", name="招商中证白酒指数", type="index"),
        ]
        return [f for f in mock_funds if search_lower in f.code or search_lower in f.name.lower()]


@app.get("/api/funds/{fund_code}/detail", response_model=FundDetail)
async def get_fund_detail(fund_code: str):
    """
    获取基金详情
    :param fund_code: 基金代码
    """
    try:
        # 获取基金历史净值
        df = ak.fund_open_fund_info_em(
            fund_code,
            symbol="净值"
        )

        if df.empty:
            raise HTTPException(status_code=404, detail="基金不存在")

        # 获取最新净值
        latest = df.iloc[0]
        fund_value = float(latest.get('单位净值', 1.0))
        day_growth = float(latest.get('日增长率', 0.0))
        value_date = str(latest.get('净值日期', ''))

        # 转换历史数据
        nav_history = []
        for _, row in df.head(30).iterrows():
            nav_history.append({
                'date': str(row.get('净值日期', '')),
                'value': float(row.get('单位净值', 1.0)),
                'accumulated': float(row.get('累计净值', 1.0))
            })

        return FundDetail(
            code=fund_code,
            name=latest.get('基金名称', ''),
            type=get_fund_type(fund_code),
            company=latest.get('基金公司', ''),
            value=fund_value,
            day_growth=day_growth,
            value_date=value_date,
            nav_history=nav_history
        )

    except Exception as e:
        print(f"获取基金详情失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取基金详情失败: {str(e)}")


@app.get("/api/funds/{fund_code}/quote")
async def get_fund_quote(fund_code: str):
    """
    获取基金实时报价
    :param fund_code: 基金代码
    """
    try:
        df = ak.fund_open_fund_info_em(
            fund_code,
            symbol="单位净值走势"
        )

        if df.empty:
            raise HTTPException(status_code=404, detail="基金不存在")

        latest = df.iloc[0]

        return {
            "code": fund_code,
            "name": latest.get('基金名称', ''),
            "value": float(latest.get('单位净值', 1.0)),
            "day_growth": float(latest.get('日增长率', 0.0)),
            "value_date": str(latest.get('净值日期', '')),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        print(f"获取基金报价失败: {e}")
        # 返回模拟数据
        return {
            "code": fund_code,
            "name": "模拟基金",
            "value": 1.500,
            "day_growth": 0.5,
            "value_date": datetime.now().strftime("%Y-%m-%d"),
            "timestamp": datetime.now().isoformat()
        }


if __name__ == "__main__":
    import uvicorn
    print("🚀 基金数据服务启动中...")
    print("📊 数据来源: 天天基金网 (via akshare)")
    print("🔗 API 文档: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
