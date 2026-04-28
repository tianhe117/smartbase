# SmartBase - 小学识字学习工具

专为小学1-3年级学生设计的识字学习网页工具，支持分册分课管理、学习和基于间隔重复算法的智能复习。

## 功能特性

- **分册管理** - 按课本分册（如一年级上册），每册包含多课
- **汉字管理** - 每课可添加汉字，包含拼音和常用组词
- **学习模式** - 逐字学习，可查看拼音和组词，标记认识/不认识
- **智能复习** - 基于加权随机的间隔重复算法，不认识的字高频出现，已掌握的字低频抽查
- **响应式设计** - 适配 PC 和移动端

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Python 3.10+ / FastAPI / SQLAlchemy / SQLite |
| 前端 | React 18 / TypeScript / Vite / TailwindCSS |

## 项目结构

```
SmartBase/
├── server/                     # Python 后端
│   ├── app/
│   │   ├── main.py            # FastAPI 入口
│   │   ├── config.py          # 配置
│   │   ├── database.py        # 数据库连接
│   │   ├── models/            # SQLAlchemy 数据模型
│   │   ├── schemas/           # Pydantic 请求/响应模型
│   │   ├── routers/           # API 路由
│   │   └── services/          # 业务逻辑（间隔重复算法）
│   ├── data/                  # SQLite 数据库（运行时生成）
│   └── requirements.txt
│
├── web/                        # React 前端
│   ├── src/
│   │   ├── api/               # API 调用封装
│   │   ├── types/             # TypeScript 类型定义
│   │   ├── pages/             # 页面组件
│   │   └── components/        # 通用组件
│   └── vite.config.ts
│
├── start.sh                    # 生产模式启动脚本
└── start-dev.sh                # 开发模式启动脚本
```

## 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+
- npm 或 pnpm

### 安装

```bash
# 克隆项目
git clone https://github.com/your-username/SmartBase.git
cd SmartBase

# 创建 Python 虚拟环境
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装后端依赖
pip install -r server/requirements.txt

# 安装前端依赖
cd web && npm install && cd ..
```

### 开发模式

```bash
# 方式一：使用脚本（同时启动前后端）
./start-dev.sh

# 方式二：分别启动
# 终端1 - 启动后端
cd server
source ../venv/bin/activate
uvicorn app.main:app --reload --port 8000

# 终端2 - 启动前端
cd web
npm run dev
```

- 前端: http://localhost:5173
- 后端 API 文档: http://localhost:8000/docs

### 生产部署

```bash
# 构建前端
cd web && npm run build && cd ..

# 启动服务
./start.sh
# 访问 http://localhost:8000
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/volumes` | 获取所有册 |
| POST | `/api/v1/volumes` | 新建册 |
| PUT | `/api/v1/volumes/{id}` | 修改册 |
| DELETE | `/api/v1/volumes/{id}` | 删除册 |
| GET | `/api/v1/volumes/{id}/lessons` | 获取某册所有课 |
| POST | `/api/v1/volumes/{id}/lessons` | 新建课 |
| GET | `/api/v1/lessons/{id}/characters` | 获取某课所有汉字 |
| POST | `/api/v1/lessons/{id}/characters` | 添加汉字 |
| GET | `/api/v1/learning/volume/{id}` | 获取某册学习汉字 |
| GET | `/api/v1/review/next?volume_id=X` | 获取复习队列 |
| POST | `/api/v1/review/result` | 提交复习结果 |
| GET | `/api/v1/review/stats?volume_id=X` | 复习统计 |

## 间隔重复算法

复习采用加权随机选择，权重由三个因子相乘：

```
weight = W_result × W_time × W_new
```

| 因子 | 不认识 | 认识 | 新字 |
|------|--------|------|------|
| W_result | `10 × 1.5^n` (封顶100) | `max(0.05, 1/1.8^n)` | 1.0 |
| W_time | `1 + ln(1+hours) × 0.3` | 同左 | 1.0 |
| W_new | 1.0 | 1.0 | 5.0 |

- 不认识的字权重递增，高频出现
- 认识的字权重递减，低频抽查（最低0.05保底）
- 新字有5倍加权，优先学习
- 时间因子随时间推移增加权重，防止遗忘

## 后续规划

- [ ] 用户登录注册
- [ ] 心算练习模块
- [ ] 英语单词模块
- [ ] 学习报表导出
- [ ] 管理后台

## License

MIT
