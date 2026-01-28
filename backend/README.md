# 基金数据后端服务

使用 Python + FastAPI + akshare 实现的基金数据服务，从天天基金网获取实时数据。

## 功能特性

- 📊 获取热门基金列表
- 🔍 搜索任意基金（支持代码和名称）
- 📈 获取基金详情和历史净值
- 💰 获取基金实时报价
- ⚡ 内存缓存，提升响应速度

## 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

## 启动服务

### Windows
```bash
start.bat
```

### Linux/Mac
```bash
chmod +x start.sh
./start.sh
```

### 手动启动
```bash
python main.py
```

服务将在 `http://localhost:8000` 启动

## API 文档

启动服务后访问：http://localhost:8000/docs

### 主要端点

#### 1. 获取基金列表
```
GET /api/funds/list
```
返回前100只热门基金

#### 2. 搜索基金
```
GET /api/funds/search?q=华夏&limit=20
```
- `q`: 搜索关键词
- `limit`: 返回数量限制

#### 3. 获取基金详情
```
GET /api/funds/{code}/detail
```
返回基金详细信息，包括历史净值

#### 4. 获取实时报价
```
GET /api/funds/{code}/quote
```
返回基金最新净值和增长率

## 数据来源

- 天天基金网 (http://fund.eastmoney.com/)
- 使用 akshare 库爬取数据

## 注意事项

1. 本服务仅用于学习和模拟交易
2. 数据可能存在延迟，不构成投资建议
3. 请遵守天天基金网的使用条款
4. 建议添加请求频率限制，避免被封IP

## 环境变量

可以创建 `.env` 文件配置：

```env
# API 端口
PORT=8000

# 缓存时间（秒）
CACHE_DURATION=3600

# 日志级别
LOG_LEVEL=INFO
```

## 故障排查

### 问题：akshare 安装失败
```bash
pip install --upgrade pip
pip install akshare -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 问题：获取数据失败
1. 检查网络连接
2. 尝试访问天天基金网确认服务可用
3. 查看后端日志获取详细错误信息

### 问题：CORS 错误
确保后端 CORS 配置正确：
```python
allow_origins=["*"]
```
