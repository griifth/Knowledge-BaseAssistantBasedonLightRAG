<div align="center">

<img src="LightRAG/assets/logo.png" width="120" height="120" alt="LightRAG Logo">

# 🚀 Knowledge Base Assistant Based on LightRAG

**基于 LightRAG 的智能知识库助手**

<p>
  <a href="https://github.com/griifth/Knowledge-BaseAssistantBasedonLightRAG"><img src="https://img.shields.io/badge/🔥项目-主页-00d9ff?style=for-the-badge&logo=github" alt="Project Home"></a>
  <a href="https://github.com/HKUDS/LightRAG"><img src="https://img.shields.io/badge/⚡基于-LightRAG-ff6b6b?style=for-the-badge" alt="Based on LightRAG"></a>
</p>

<p>
  <img src="https://img.shields.io/badge/🐍Python-3.10+-4ecdc4?style=for-the-badge&logo=python">
  <img src="https://img.shields.io/badge/⚛️React-19-61dafb?style=for-the-badge&logo=react">
  <img src="https://img.shields.io/badge/🎨TypeScript-5.9-3178c6?style=for-the-badge&logo=typescript">
</p>

**一个功能丰富的 RAG 知识库系统，基于 LightRAG 构建，新增对话管理、文件上传、联网搜索等实用功能**

</div>

---

## ✨ 项目亮点

本项目在 [LightRAG](https://github.com/HKUDS/LightRAG) 的基础上，新增了以下特色功能：

### 🆕 核心新增功能

| 功能 | 说明 | 状态 |
|------|------|------|
| 💬 **Chat 对话页面** | 全新的对话式交互界面，支持多对话管理 | ✅ |
| 📎 **文件上传功能** | 支持 PDF、DOCX、PPTX、XLSX 等多种格式 | ✅ |
| 🌐 **联网搜索** | 集成博查AI搜索，实时获取网络信息 | ✅ |
| 🗂️ **多知识库管理** | 动态创建、切换、删除多个独立知识库 | ✅ |
| ⚙️ **对话设置** | 独立的系统提示词和参数配置 | ✅ |
| 💾 **多对话管理** | 创建、切换、删除多个独立对话 | ✅ |
| 🔄 **参数共享** | Chat 与 Retrieval 页面智能参数管理 | ✅ |

### 📋 功能对比

<details>
<summary><b>点击展开完整功能对比表</b></summary>

| 功能类别 | 原版 LightRAG | 本项目 | 说明 |
|---------|--------------|--------|------|
| **基础 RAG** | ✅ | ✅ | 保留所有原有功能 |
| **知识图谱** | ✅ | ✅ | 可视化和探索 |
| **文档管理** | ✅ | ✅ | 上传、索引、管理 |
| **检索测试** | ✅ | ✅ | 多种查询模式 |
| **Chat 对话** | ❌ | ✅ | **新增功能** |
| **文件上传（聊天）** | ❌ | ✅ | **新增功能** |
| **联网搜索** | ❌ | ✅ | **新增功能** |
| **多知识库管理** | ❌ | ✅ | **新增功能** |
| **多对话管理** | ❌ | ✅ | **新增功能** |
| **系统提示词** | ❌ | ✅ | **新增功能** |
| **对话历史保存** | ❌ | ✅ | **新增功能** |

</details>

---

## 🎯 功能展示

### 1️⃣ Chat 对话界面

- ✨ 类似 ChatGPT 的对话体验
- 📚 支持多对话管理（创建、切换、删除）
- 💾 对话历史自动保存
- 🎨 Markdown、LaTeX、Mermaid 图表渲染
- 🤔 COT (Chain-of-Thought) 思考过程展示

### 2️⃣ 文件上传功能

支持的文件格式：
- 📄 **文档**: PDF, DOCX, PPTX, XLSX
- 📝 **文本**: TXT, MD, CSV, JSON, XML, HTML, YAML
- 🖼️ **图片**: PNG, JPG, JPEG, GIF, WEBP

**智能处理**：
- 前端直接解析文本文件
- 后端处理复杂格式（PDF、Office）
- 自动提取内容并注入到 LLM prompt

### 3️⃣ 联网搜索

- 🔍 集成博查AI搜索 API
- 🔄 自动提取搜索关键词
- 📊 搜索结果智能整合到回答中
- ⚡ 实时获取最新信息

### 4️⃣ 智能参数管理

- 🎛️ Chat 页面：系统提示词、联网搜索（独立配置）
- 📐 Retrieval 页面：temperature、maxTokens、topP 等（全局共享）
- 🔧 参数分离，互不干扰

### 5️⃣ 多知识库管理 🆕

**企业级多租户支持**：

- 🗂️ **动态创建知识库**：无需重启服务器
- 🔄 **即时切换**：通过 HTTP Header 瞬时切换（<10ms）
- 🔐 **完全隔离**：每个知识库独立的数据和索引
- 💾 **智能缓存**：已加载的知识库保留在内存中
- ⚡ **按需加载**：只在访问时才创建实例
- 🏢 **多租户场景**：支持多项目、多客户、测试/生产环境隔离

**使用场景**：
```bash
# 项目A的知识库
workspace: project_a → 25个文档，关于Web开发

# 项目B的知识库  
workspace: research_papers → 150个文档，关于机器学习

# 完全独立，互不干扰
```

**API 端点**：
- `GET /workspaces` - 列出所有知识库
- `POST /workspaces` - 创建新知识库
- `DELETE /workspaces/{name}` - 删除知识库
- `GET /workspaces/current` - 获取当前知识库

---

## 🚀 快速开始

### 前置要求

- Python 3.10+
- Node.js 18+ / Bun 1.0+
- Ollama（或其他 LLM 服务）

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/griifth/Knowledge-BaseAssistantBasedonLightRAG.git
cd Knowledge-BaseAssistantBasedonLightRAG
```

#### 2. 配置环境变量

```bash
# 复制环境变量模板
cp LightRAG/env.example LightRAG/.env

# 编辑 .env 文件，配置您的 LLM 和 Embedding 模型
vim LightRAG/.env
```

**最小配置示例**（使用本地 Ollama）：

```bash
# LLM 配置
LLM_BINDING=ollama
LLM_MODEL=qwen2.5:14b
LLM_BINDING_HOST=http://localhost:11434

# Embedding 配置
EMBEDDING_BINDING=ollama
EMBEDDING_MODEL=bge-m3:latest
EMBEDDING_DIM=1024
EMBEDDING_BINDING_HOST=http://localhost:11434

# 工作空间配置（多知识库支持）
WORKSPACE=default                    # 默认工作空间名称
WORKING_DIR=./rag_storage           # 数据存储目录
INPUT_DIR=./inputs                  # 文档输入目录

# 博查AI搜索 API Key（可选，用于联网搜索）
BOCHA_API_KEY=your_api_key_here

# 用户认证（可选）
AUTH_ACCOUNTS='admin:admin123'
TOKEN_SECRET='your-secret-key'
TOKEN_EXPIRE_HOURS=4
```

#### 3. 安装后端依赖

```bash
cd LightRAG

# 使用 uv（推荐）
uv sync --extra api
source .venv/bin/activate

# 或使用 pip
pip install -e ".[api]"
```

#### 4. 构建前端

```bash
cd lightrag_webui

# 安装依赖
bun install --frozen-lockfile

# 构建
bun run build

cd ../..
```

#### 5. 启动服务

```bash
cd LightRAG

# 开发模式
lightrag-server

# 或生产模式（多进程）
lightrag-gunicorn --workers 4
```

访问：http://localhost:9621

---

## 📖 使用指南

### Chat 对话页面

#### 创建新对话

1. 点击左侧边栏的 **"+ 新建对话"**
2. 开始输入问题并发送

#### 上传文件

1. 点击输入框左侧的 **📎 文件上传按钮**
2. 选择文件（支持多个文件）
3. 文件内容会自动注入到 prompt 中

#### 开启联网搜索

1. 点击输入框的 **🌐 联网搜索按钮**（需要配置 `BOCHA_API_KEY`）
2. 或在设置中默认开启

#### 配置系统提示词

1. 点击右上角 **⚙️ 设置按钮**
2. 输入系统提示词，定义 AI 的角色和行为
3. 示例：
   ```
   你是一个专业的技术顾问，擅长解释复杂的技术概念。
   请用简洁明了的语言回答问题，并提供实际案例。
   ```

### 查询模式说明

将鼠标悬停在查询模式选择器旁的 **❓** 图标，可以查看各模式说明：

- **Naive**: 传统文本块向量检索
- **Local**: 侧重实体检索，关注局部知识
- **Global**: 侧重关系检索，关注全局知识
- **Hybrid**: 混合模式（Local + Global）
- **Mix**: 综合模式（Local + Global + Naive）
- **Bypass**: 跳过 RAG 检索，直接使用 LLM

### 多知识库管理

#### 列出所有知识库

```bash
curl -X GET http://localhost:9621/workspaces \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 创建新知识库

```bash
curl -X POST http://localhost:9621/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "my_project"}'
```

#### 切换知识库

在所有API请求中添加 `LIGHTRAG-WORKSPACE` header：

```bash
# 查询 project_a 的文档
curl -X GET http://localhost:9621/documents \
  -H "LIGHTRAG-WORKSPACE: project_a" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 切换到 project_b
curl -X GET http://localhost:9621/documents \
  -H "LIGHTRAG-WORKSPACE: project_b" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 删除知识库

```bash
curl -X DELETE http://localhost:9621/workspaces/my_project \
  -H "Authorization: Bearer YOUR_TOKEN"
```

⚠️ **警告**：删除操作不可逆，将删除该知识库的所有数据！

---

## 🏗️ 技术架构

### 技术栈

**后端**:
- FastAPI - Web 框架
- LightRAG - RAG 核心引擎
- Ollama - LLM 推理
- PostgreSQL / Neo4j / MongoDB - 存储（可选）

**前端**:
- React 19 - UI 框架
- TypeScript - 类型安全
- Zustand - 状态管理
- Bun - 包管理和构建
- Vite - 构建工具
- TailwindCSS - 样式

### 新增组件

**前端组件**：
```
lightrag_webui/src/
├── features/
│   └── Chat.tsx                    # 🆕 Chat 对话页面
├── components/
│   └── chat/
│       ├── ChatHeader.tsx          # 🆕 对话头部（模式选择、设置）
│       ├── ChatSidebar.tsx         # 🆕 对话侧边栏（多对话管理）
│       ├── ChatSettingsDialog.tsx  # 🆕 对话设置弹窗
│       ├── FileUploadButton.tsx    # 🆕 文件上传按钮
│       └── WebSearchToggle.tsx     # 🆕 联网搜索开关
├── lib/
│   ├── fileParser.ts               # 🆕 文件解析工具
│   └── webSearch.ts                # 🆕 联网搜索工具
├── stores/
│   └── conversations.ts            # 🆕 对话状态管理
└── types/
    └── chat.ts                     # 🆕 Chat 类型定义
```

**后端组件**：
```
lightrag/api/
├── rag_manager.py                  # 🆕 多知识库实例管理器
│   ├── RAGInstanceManager          # 实例缓存池
│   └── RAGInstanceConfig           # 实例配置
├── routers/
│   ├── chat_routes.py              # 🆕 Chat相关API
│   │   ├── /chat/parse-file        # 文件解析
│   │   └── /chat/web-search        # 联网搜索
│   └── workspace_routes.py         # 🆕 工作空间管理API
│       ├── GET /workspaces         # 列出知识库
│       ├── POST /workspaces        # 创建知识库
│       ├── DELETE /workspaces/{id} # 删除知识库
│       └── GET /workspaces/current # 当前知识库
```

### 参数架构

```
┌─────────────────────────────────────────┐
│         全局参数（Retrieval 页面）         │
│   temperature, maxTokens, topP...       │
│              ↓ 共享                      │
├─────────────────────────────────────────┤
│          Chat 页面                       │
│   ✓ 继承全局参数                         │
│   ✓ 独立：systemPrompt                  │
│   ✓ 独立：webSearchEnabled              │
│   ✓ 独立：mode, historyTurns            │
└─────────────────────────────────────────┘
```

### 多知识库架构

```
用户请求
  ↓
Header: LIGHTRAG-WORKSPACE
  ↓
API层
  ↓
RAGInstanceManager
  ├─→ 实例已存在？ → 缓存命中 <10ms ──┐
  └─→ 首次访问？                      │
       ↓                              │
     创建新实例                        │
       ↓                              │
     初始化存储                        │
       ↓                              │
     加入缓存池 ────────────────────────┤
                                      ↓
                                   返回数据
```

**核心特性**：

```python
# 1. 智能实例缓存
RAGInstanceManager
├── _instances: Dict[str, LightRAG]  # workspace → 实例映射
├── _locks: Dict[str, asyncio.Lock]  # 并发控制
└── get_instance(workspace) → LightRAG  # 懒加载

# 2. 数据隔离
rag_storage/
├── project_a/           # workspace 1
│   ├── kv_store_doc_status.json
│   ├── graph_chunk_entity_relation.graphml
│   └── vdb_entities.json
├── research_papers/     # workspace 2
│   └── ...
└── (default)/          # 默认workspace
    └── ...

# 3. HTTP Header切换
headers: {
  'LIGHTRAG-WORKSPACE': 'project_a'  # 指定知识库
}
```

**性能优势**：

| 特性 | 原版 LightRAG | 多知识库增强版 |
|-----|-------------|--------------|
| Workspace数量 | 单一（启动指定） | 无限多个 |
| 切换方式 | 重启服务器 | HTTP Header即时切换 |
| 切换延迟 | 30-60秒 | <10ms（缓存） |
| 并发访问 | 单workspace | 多workspace并发 |
| 实例管理 | 单实例 | 多实例缓存池 |
| 适用场景 | 个人使用 | 企业级多租户 |

**安全特性**：

- ✅ 工作空间名称验证（仅允许 `[a-zA-Z0-9_]`）
- ✅ 防止路径遍历攻击
- ✅ 禁止删除默认workspace
- ✅ 最大名称长度限制（64字符）
- ✅ 线程安全的并发控制

---

## 🔧 开发指南

### 前端开发

```bash
cd LightRAG/lightrag_webui

# 安装依赖
bun install

# 开发模式（热重载）
bun run dev

# 构建生产版本
bun run build
```

### 后端开发

```bash
cd LightRAG

# 激活虚拟环境
source .venv/bin/activate

# 启动开发服务器
lightrag-server --log-level DEBUG
```

### 添加新功能

1. **前端**：在 `lightrag_webui/src/` 中添加新组件
2. **后端**：在 `lightrag/api/routers/` 中添加新路由
3. **类型**：在 `lightrag_webui/src/types/` 中定义 TypeScript 类型

---

## 📝 待办事项

### 对话功能增强
- [ ] 添加对话导出功能（Markdown/PDF）
- [ ] 对话统计和分析
- [ ] 语音输入支持

### 搜索功能增强
- [ ] 支持更多搜索引擎（Google、Bing）
- [ ] 搜索结果缓存优化

### 多知识库增强
- [ ] 前端知识库切换UI组件
- [ ] 知识库使用统计和监控
- [ ] 知识库导入/导出功能
- [ ] 知识库访问权限控制

### 部署与优化
- [ ] 移动端适配优化
- [ ] Docker 一键部署
- [ ] Kubernetes Helm Chart

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献流程

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'Add some feature'`
4. 推送到分支：`git push origin feature/your-feature`
5. 提交 Pull Request

---

## 📄 许可证

本项目基于 [LightRAG](https://github.com/HKUDS/LightRAG) 构建，遵循相同的许可证。

---

## 🙏 致谢

- **[LightRAG](https://github.com/HKUDS/LightRAG)** - 提供强大的 RAG 框架
- **[博查AI](https://bocha.ai/)** - 提供搜索 API 支持
- **所有贡献者** - 感谢你们的支持！

---

## 📬 联系方式

- **GitHub Issues**: [提交问题](https://github.com/griifth/Knowledge-BaseAssistantBasedonLightRAG/issues)
- **LightRAG Discord**: [加入社区](https://discord.gg/yF2MmDJyGJ)

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给个 Star！⭐**

Made with ❤️ based on LightRAG

</div>



