# SmartBase - 小学识字学习工具

专为小学1-3年级学生设计的识字学习网页工具，支持分册分课管理、学习和基于间隔重复算法的智能复习。

## 功能特性

- **分册管理** - 按课本分册（如一年级上册），每册包含多课
- **汉字管理** - 每课可添加汉字，支持批量添加，自动查询拼音和组词
- **学习模式** - 逐字学习，可查看拼音和组词，标记认识/不认识
- **智能复习** - 基于加权随机的间隔重复算法，不认识的字高频出现，已掌握的字低频抽查
- **密码保护** - 管理页面需密码验证，学习和复习页面公开访问
- **响应式设计** - 适配 PC 和移动端

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Python 3.10+ / FastAPI / SQLAlchemy / SQLite |
| 前端 | React 19 / TypeScript / Vite 8 / TailwindCSS 4 |
| 拼音 | pypinyin（后端自动查询） |
| 认证 | 简单密码 + Bearer Token（SHA-256 哈希，内存存储） |

## 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+

### 安装

```bash
# 克隆项目
git clone https://github.com/your-username/SmartBase.git
cd SmartBase

# 创建 Python 虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装后端依赖
pip install -r server/requirements.txt

# 安装前端依赖
cd web && npm install
```

### 开发模式

```bash
# 方式一：使用脚本（同时启动前后端）
./start-dev.sh

# 方式二：分别启动
# 终端1 - 启动后端
cd server && source ../venv/bin/activate && uvicorn app.main:app --reload --port 8000

# 终端2 - 启动前端
cd web && npm run dev
```

- 前端: http://localhost:5173
- 后端 API 文档: http://localhost:8000/docs

### 生产部署

```bash
./start.sh
# 访问 http://localhost:8000
```

`start.sh` 会自动检测并构建前端（如果 `server/static/` 不存在），然后启动 uvicorn 服务。

## 项目结构

```
SmartBase/
├── server/                          # Python 后端 (FastAPI)
│   ├── app/
│   │   ├── main.py                  # FastAPI 入口，CORS、静态文件服务、路由注册
│   │   ├── config.py                # 数据库路径等配置
│   │   ├── database.py              # SQLAlchemy 引擎、会话、数据库初始化
│   │   ├── models/                  # SQLAlchemy ORM 模型
│   │   ├── schemas/                 # Pydantic 请求/响应模型
│   │   ├── routers/                 # API 路由模块
│   │   │   ├── volumes.py           # 册 CRUD
│   │   │   ├── lessons.py           # 课 CRUD
│   │   │   ├── characters.py        # 汉字 CRUD + 批量添加
│   │   │   ├── learning.py          # 学习模式
│   │   │   ├── review.py            # 智能复习
│   │   │   ├── lookup.py            # 拼音/组词自动查询
│   │   │   └── auth.py              # 登录/验证/修改密码
│   │   └── services/                # 业务逻辑
│   │       ├── review.py            # 间隔重复算法
│   │       └── char_lookup.py       # 拼音 + 组词查询（在线百度词典 + 离线回退）
│   ├── data/                        # SQLite 数据库（运行时生成，已 gitignore）
│   └── requirements.txt
├── web/                             # React 前端 (Vite)
│   ├── src/
│   │   ├── main.tsx                 # React 入口
│   │   ├── App.tsx                  # 路由配置：/, /manage, /learn/:volumeId, /review/:volumeId
│   │   ├── api/client.ts            # Axios 实例 + 所有 API 函数
│   │   ├── types/index.ts           # TypeScript 类型定义
│   │   ├── pages/                   # 页面组件（Home, Manage, Learn, Review）
│   │   ├── components/              # 通用组件
│   │   └── index.css                # TailwindCSS + 自定义字体
│   └── vite.config.ts               # 代理 /api → localhost:8000，输出到 server/static/
├── start-dev.sh                     # 开发模式：同时启动前后端
├── start.sh                         # 生产模式：自动构建 + 启动
├── smartbase.service                # Systemd 服务文件
├── nginx.conf.example               # Nginx 反向代理配置（含 SSL）
└── .env.example                     # 环境变量模板
```

## API 接口

所有接口前缀：`/api/v1/`

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
| POST | `/api/v1/lessons/{id}/characters/batch` | 批量添加汉字 |
| GET | `/api/v1/learning/volume/{id}` | 获取某册学习汉字 |
| GET | `/api/v1/review/next?volume_id=X` | 获取复习队列 |
| POST | `/api/v1/review/result` | 提交复习结果 |
| GET | `/api/v1/review/stats?volume_id=X` | 复习统计 |
| POST | `/api/v1/lookup/character` | 查询汉字拼音和组词 |
| POST | `/api/v1/auth/login` | 登录 |
| POST | `/api/v1/auth/verify` | 验证 Token |
| POST | `/api/v1/auth/change-password` | 修改密码 |

## 间隔重复算法

复习采用加权随机选择，权重由三个因子相乘：

```
weight = W_result × W_time × W_new
```

| 因子 | 不认识 | 认识 | 新字 |
|------|--------|------|------|
| W_result | `10 × 1.5^n`（封顶100） | `max(0.05, 1/1.8^n)` | 1.0 |
| W_time | `1 + ln(1+hours) × 0.3` | 同左 | 1.0 |
| W_new | 1.0 | 1.0 | 5.0 |

- 不认识的字权重递增，高频出现
- 认识的字权重递减，低频抽查（最低 0.05 保底）
- 新字有 5 倍加权，优先学习
- 时间因子随时间推移增加权重，防止遗忘

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `HOST` | `0.0.0.0` | 服务绑定地址 |
| `PORT` | `8000` | 服务端口 |
| `WORKERS` | `1` | Uvicorn 工作进程数 |
| `ALLOWED_ORIGINS` | `*` | CORS 允许的来源（逗号分隔） |

## License

MIT
