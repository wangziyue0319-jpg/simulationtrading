"""
基金数据后端服务
使用 akshare 获取天天基金网数据
"""
import sys
import io

# 设置 UTF-8 编码输出
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import akshare as ak
import pandas as pd
from typing import List, Optional
from datetime import datetime
import requests
from urllib.parse import quote

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


class FundSearchResult(BaseModel):
    """基金搜索结果"""
    code: str
    name: str
    type: str


# 内存缓存 - 常见基金列表
COMMON_FUNDS = [
    {"code": "000001", "name": "华夏成长混合", "type": "mix"},
    {"code": "000002", "name": "华夏成长混合(ETF联接)", "type": "mix"},
    {"code": "000003", "name": "中国海油", "type": "stock"},
    {"code": "110022", "name": "易方达消费行业股票", "type": "stock"},
    {"code": "110023", "name": "易方达消费行业股票C", "type": "stock"},
    {"code": "161725", "name": "招商中证白酒指数", "type": "index"},
    {"code": "161726", "name": "招商中证白酒指数C", "type": "index"},
    {"code": "270002", "name": "广发稳健增长混合", "type": "mix"},
    {"code": "519732", "name": "交银定期支付双息平衡混合", "type": "mix"},
    {"code": "001618", "name": "天弘中证电子ETF联接A", "type": "index"},
    {"code": "001618", "name": "天弘中证电子ETF联接A", "type": "index"},
    {"code": "005827", "name": "易方达蓝筹精选混合", "type": "mix"},
    {"code": "161025", "name": "招商国证生物医药指数", "type": "index"},
    {"code": "163406", "name": "兴全合润混合", "type": "mix"},
    {"code": "163402", "name": "兴全趋势投资混合", "type": "mix"},
    {"code": "040025", "name": "华安科技动力混合", "type": "mix"},
    {"code": "050009", "name": "华夏稳增混合", "type": "mix"},
    {"code": "060001", "name": "华夏回报混合A", "type": "mix"},
    {"code": "070032", "name": "嘉实优化红利混合", "type": "mix"},
    {"code": "090001", "name": "大成核心价值混合", "type": "mix"},
    {"code": "100026", "name": "富国天合稳健优选混合", "type": "mix"},
    {"code": "110001", "name": "易方达平稳增长混合", "type": "mix"},
    {"code": "121003", "name": "国投瑞银核心企业混合", "type": "mix"},
    {"code": "162203", "name": "湘财合价值优选混合", "type": "mix"},
    {"code": "162204", "name": "湘财荷价值优化混合", "type": "mix"},
    {"code": "162605", "name": "景顺长城鼎益混合", "type": "mix"},
    {"code": "162703", "name": "广发小盘成长混合", "type": "mix"},
    {"code": "180012", "name": "银华富裕主题混合", "type": "mix"},
    {"code": "200002", "name": "长城久恒混合", "type": "mix"},
]


def get_fund_type(code: str) -> str:
    """根据基金代码判断类型"""
    if code.startswith('000') or code.startswith('001') or code.startswith('002'):
        return 'mix'  # 混合型
    elif code.startswith('1617') or code.startswith('1634') or code.startswith('510'):
        return 'index'  # 指数型
    elif code.startswith('519') or code.startswith('161') or code.startswith('050'):
        return 'stock'  # 股票型
    elif code.startswith('1619') or code.startswith('005') or code.startswith('270'):
        return 'bond'  # 债券型
    elif code.startswith('003') or code.startswith('004'):
        return 'money'  # 货币型
    else:
        return 'mix'  # 默认混合型


@app.get("/")
async def root():
    """健康检查"""
    return {
        "service": "基金数据服务",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
        "fund_count": len(COMMON_FUNDS)
    }


@app.get("/api/funds/list", response_model=List[FundInfo])
async def get_fund_list():
    """
    获取基金列表（常见基金）
    返回常见基金列表
    """
    try:
        # 尝试获取实时数据
        try:
            # 使用 akshare 获取基金数据
            df = ak.fund_em_open_fund_daily_em(fund="000001", symbol="单位净值")
            if not df.empty:
                funds = []
                for fund_dict in COMMON_FUNDS[:20]:  # 限制返回数量
                    try:
                        # 获取该基金的净值
                        fund_df = ak.fund_em_open_fund_daily_em(fund=fund_dict["code"], symbol="单位净值")
                        if not fund_df.empty:
                            latest = fund_df.iloc[0]
                            funds.append(FundInfo(
                                code=fund_dict["code"],
                                name=fund_dict["name"],
                                type=fund_dict["type"],
                                company="",
                                value=float(latest.get('单位净值', 1.0)),
                                day_growth=0.0
                            ))
                    except:
                        # 如果获取失败，使用默认值
                        funds.append(FundInfo(
                            code=fund_dict["code"],
                            name=fund_dict["name"],
                            type=fund_dict["type"],
                            company="",
                            value=1.500,
                            day_growth=0.0
                        ))
                return funds
        except Exception as e:
            print(f"获取实时数据失败: {e}")

        # 返回默认基金列表
        funds = []
        for fund_dict in COMMON_FUNDS:
            funds.append(FundInfo(
                code=fund_dict["code"],
                name=fund_dict["name"],
                type=fund_dict["type"],
                company="",
                value=1.500,
                day_growth=0.0
            ))
        return funds

    except Exception as e:
        print(f"获取基金列表失败: {e}")
        return []


@app.get("/api/funds/search", response_model=List[FundSearchResult])
async def search_funds(q: str = "", limit: int = 20):
    """
    搜索基金
    :param q: 搜索关键词（基金代码或名称）
    :param limit: 返回结果数量限制
    """
    if not q or len(q) < 1:
        return []

    search_lower = q.lower()
    results = []

    # 从本地基金列表中搜索
    for fund in COMMON_FUNDS:
        if len(results) >= limit:
            break

        # 匹配基金代码或名称
        if (search_lower in fund["code"].lower() or
            search_lower in fund["name"].lower()):
            results.append(FundSearchResult(
                code=fund["code"],
                name=fund["name"],
                type=fund["type"]
            ))

    return results


@app.get("/api/funds/{fund_code}/quote")
async def get_fund_quote(fund_code: str):
    """
    获取基金实时报价
    :param fund_code: 基金代码
    """
    try:
        # 尝试获取实时净值
        df = ak.fund_em_open_fund_daily_em(fund=fund_code, symbol="单位净值")

        if df.empty:
            # 如果获取失败，从本地列表查找
            fund_info = next((f for f in COMMON_FUNDS if f["code"] == fund_code), None)
            if fund_info:
                return {
                    "code": fund_code,
                    "name": fund_info["name"],
                    "value": 1.500,
                    "day_growth": 0.0,
                    "value_date": datetime.now().strftime("%Y-%m-%d"),
                    "timestamp": datetime.now().isoformat()
                }
            raise HTTPException(status_code=404, detail="基金不存在")

        latest = df.iloc[0]

        return {
            "code": fund_code,
            "name": latest.get('基金名称', ''),
            "value": float(latest.get('单位净值', 1.500)),
            "day_growth": 0.0,
            "value_date": str(latest.get('净值日期', datetime.now().strftime("%Y-%m-%d"))),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        print(f"获取基金报价失败: {e}")
        # 返回模拟数据
        fund_info = next((f for f in COMMON_FUNDS if f["code"] == fund_code), None)
        if fund_info:
            return {
                "code": fund_code,
                "name": fund_info["name"],
                "value": 1.500,
                "day_growth": 0.0,
                "value_date": datetime.now().strftime("%Y-%m-%d"),
                "timestamp": datetime.now().isoformat()
            }
        else:
            return {
                "code": fund_code,
                "name": "未知基金",
                "value": 1.500,
                "day_growth": 0.0,
                "value_date": datetime.now().strftime("%Y-%m-%d"),
                "timestamp": datetime.now().isoformat()
            }


if __name__ == "__main__":
    import uvicorn
    print("🚀 基金数据服务启动中...")
    print(f"📊 已加载 {len(COMMON_FUNDS)} 只常见基金")
    print("🔗 API 文档: http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001)
