# mdParse 项目设计文档

## 📋 项目概述

**项目名称**: mdParse
**版本**: 0.1.0
**类型**: Markdown 编辑器（Electron 桌面应用）
**技术栈**: React + TypeScript + Electron + Tailwind CSS

---

## 🏗️ 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Main Process                 │
│  - 窗口管理                                              │
│  - 菜单栏配置                                            │
│  - 文件系统操作（IPC）                                   │
└─────────────────────────────────────────────────────────┘
                            ↕ IPC
┌─────────────────────────────────────────────────────────┐
│                  Electron Renderer Process               │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │                    React App                        │ │
│  │                                                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │ │
│  │  │ File Manager │  │   Editor     │  │   AI     │ │ │
│  │  │  Components  │  │  Components  │  │Components│ │ │
│  │  └──────────────┘  └──────────────┘  └──────────┘ │ │
│  │                                                     │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │          Modal Components                     │  │ │
│  │  │  - Settings  - Preview  - Dialogs            │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 项目结构（重构后）

```
mdParse/
├── electron/
│   ├── main.cjs              # Electron 主进程
│   └── preload.cjs           # 预加载脚本（IPC 桥接）
├── src/
│   ├── components/
│   │   ├── modals/           # 模态框组件
│   │   │   ├── SettingsModal.tsx      ✅ 已完成
│   │   │   ├── AIPreviewModal.tsx     ⏳ 待拆分
│   │   │   ├── NewFileDialog.tsx      ⏳ 待拆分
│   │   │   ├── ConfirmDialog.tsx      ⏳ 待拆分
│   │   │   ├── ShortcutsModal.tsx     ⏳ 待拆分
│   │   │   ├── AboutModal.tsx         ⏳ 待拆分
│   │   │   └── GuideModal.tsx         ⏳ 待拆分
│   │   ├── FileManager/      # 文件管理组件
│   │   │   ├── FileSidebar.tsx        ⏳ 待拆分
│   │   │   ├── FileList.tsx           ⏳ 待拆分
│   │   │   ├── FileListItem.tsx       ⏳ 待拆分
│   │   │   ├── FileContextMenu.tsx    ⏳ 待拆分
│   │   │   └── FileRenameInput.tsx    ⏳ 待拆分
│   │   ├── AI/               # AI 功能组件
│   │   │   ├── AIPanel.tsx            ⏳ 待拆分
│   │   │   ├── AIChat.tsx             ⏳ 待拆分
│   │   │   ├── AIMessage.tsx          ⏳ 待拆分
│   │   │   └── AIInput.tsx            ⏳ 待拆分
│   │   ├── FileUploader.tsx  # 文件上传组件
│   │   ├── MarkdownEditor.tsx # Markdown 编辑器
│   │   └── MarkdownViewer.tsx # Markdown 预览
│   ├── contexts/             # Context API（待创建）
│   │   ├── FileContext.tsx
│   │   ├── AIContext.tsx
│   │   └── SettingsContext.tsx
│   ├── hooks/                # Custom Hooks（待创建）
│   │   ├── useFileManager.ts
│   │   ├── useAI.ts
│   │   ├── useSettings.ts
│   │   └── useElectronMenu.ts
│   ├── types/                # 类型定义（待创建）
│   │   ├── file.ts
│   │   ├── ai.ts
│   │   ├── settings.ts
│   │   └── electron.ts
│   ├── config/               # 配置文件（待创建）
│   │   ├── constants.ts
│   │   ├── defaults.ts
│   │   └── theme.ts
│   ├── utils/                # 工具函数（待创建）
│   │   ├── file.ts
│   │   ├── string.ts
│   │   ├── storage.ts
│   │   └── validation.ts
│   ├── data/
│   │   └── markdownGuide.ts  # Markdown 指南内容
│   ├── App.tsx               # 主应用组件（1788 行 → 目标 500 行）
│   ├── main.tsx              # React 入口
│   └── index.css             # 全局样式
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 🎨 核心功能模块

### 1. 文件管理模块

**功能**:
- 多文件标签页管理
- 文件夹打开和浏览
- 文件重命名、删除
- 文件保存（覆盖保存、另存为）
- 未保存提示

**组件**:
- `FileSidebar` - 文件侧边栏
- `FileList` - 文件列表
- `FileListItem` - 单个文件项
- `FileContextMenu` - 右键菜单
- `FileRenameInput` - 重命名输入框

**State**:
```typescript
interface FileState {
  id: string;
  name: string;
  content: string;
  isDirty: boolean;
  filePath?: string;
}

files: FileState[]
activeFileId: string | null
folderPath: string | null
folderFiles: Array<{ name: string; path: string }>
```

---

### 2. Markdown 编辑模块

**功能**:
- 实时编辑
- 语法高亮
- 自动保存
- Tab 键缩进
- 字体大小调整

**组件**:
- `MarkdownEditor` - 编辑器组件
- `MarkdownViewer` - 预览组件

**State**:
```typescript
fontSize: number
theme: 'light' | 'dark'
```

---

### 3. AI 助手模块

**功能**:
- AI 内容优化
- 对话历史
- 多 AI 提供商支持（OpenAI、DeepSeek、自定义）
- System Prompt 自定义
- 预览和应用优化内容

**组件**:
- `AIPanel` - AI 面板
- `AIChat` - 对话区域
- `AIMessage` - 单条消息
- `AIInput` - 输入框
- `AIPreviewModal` - 预览模态框

**State**:
```typescript
interface AISettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: 'openai' | 'deepseek' | 'custom';
}

interface AIAdvancedSettings {
  temperature: number;
  systemPrompt: string;
}

aiSettings: AISettings
aiAdvancedSettings: AIAdvancedSettings
aiMessagesMap: Record<string, AIMessage[]>
aiLoading: boolean
```

---

### 4. 设置模块

**功能**:
- 主题切换（浅色/深色）
- 字体大小调整
- AI API 配置
- AI 连接测试
- System Prompt 配置

**组件**:
- `SettingsModal` ✅ 已完成

**State**:
```typescript
theme: 'light' | 'dark'
fontSize: number
aiSettings: AISettings
aiAdvancedSettings: AIAdvancedSettings
```

---

### 5. 模态框模块

**功能**:
- 设置界面
- AI 预览
- 新建文件对话框
- 确认对话框
- 快捷键列表
- 关于/帮助

**组件**:
- `SettingsModal` ✅ 已完成
- `AIPreviewModal` ⏳ 待拆分
- `NewFileDialog` ⏳ 待拆分
- `ConfirmDialog` ⏳ 待拆分
- `ShortcutsModal` ⏳ 待拆分
- `AboutModal` ⏳ 待拆分
- `GuideModal` ⏳ 待拆分

---

## 🔄 数据流设计

### 文件操作流程

```
用户操作 → App.tsx → Electron IPC → Main Process → 文件系统
                                                        ↓
用户界面 ← App.tsx ← Electron IPC ← Main Process ← 操作结果
```

### AI 调用流程

```
用户输入 → AIPanel → API 请求 → AI 服务
                                    ↓
用户界面 ← AIPanel ← API 响应 ← AI 服务
```

### 状态管理流程（当前）

```
App.tsx (Root State)
    ↓
Props Drilling
    ↓
Child Components
```

### 状态管理流程（重构后）

```
Context Providers
    ↓
Custom Hooks
    ↓
Components
```

---

## 🎯 重构进度

### 已完成 ✅

1. **SettingsModal 组件**
   - 文件: `src/components/modals/SettingsModal.tsx`
   - 行数: 334 行
   - 功能: 完整的设置界面
   - 减少 App.tsx: 274 行

### 进行中 ⏳

2. **文件管理组件拆分**
   - 目录已创建: `src/components/FileManager/`
   - 待实施

### 待完成 📋

3. **其他模态框组件**
4. **AI 功能组件**
5. **Context API 和 Custom Hooks**
6. **类型定义和工具函数提取**

---

## 📊 代码质量指标

### 当前状态

| 指标 | 数值 |
|------|------|
| App.tsx 行数 | 1788 |
| 组件数量 | 4 |
| useState 数量 | 18+ |
| 可维护性 | ⭐⭐⭐ |
| 可测试性 | ⭐⭐ |

### 目标状态

| 指标 | 数值 |
|------|------|
| App.tsx 行数 | ~500 |
| 组件数量 | 20+ |
| useState 数量 | ~5 |
| 可维护性 | ⭐⭐⭐⭐⭐ |
| 可测试性 | ⭐⭐⭐⭐ |

---

## 🔧 技术栈详情

### 前端框架
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具

### UI 库
- **Tailwind CSS** - 样式框架
- **React Markdown** - Markdown 渲染
- **Prism** - 代码高亮

### 桌面框架
- **Electron 22** - 桌面应用框架
- **IPC** - 进程间通信

### AI 集成
- **OpenAI API** - AI 服务
- **DeepSeek API** - 国内 AI 服务
- **自定义 API** - 支持其他 AI 提供商

---

## 🚀 性能优化

### 已实施
1. ✅ 侧边栏拖拽节流（requestAnimationFrame）
2. ✅ localStorage 缓存（设置、AI 历史）
3. ✅ 组件拆分（减少单文件复杂度）

### 待实施
1. ⏳ React.memo（减少重渲染）
2. ⏳ useMemo/useCallback（优化计算）
3. ⏳ 代码分割（懒加载）
4. ⏳ 虚拟滚动（大文件列表）

---

## 🐛 已修复的 Bug

1. ✅ Tab 键光标位置错误
2. ✅ AI 消息历史丢失
3. ✅ 文件保存错误处理不完整
4. ✅ HTML 嵌套错误（button in button）
5. ✅ 设置菜单位置错误（macOS）

---

## 📝 开发规范

### 组件命名
- 使用 PascalCase
- 功能描述清晰
- 例: `SettingsModal`, `FileListItem`

### 文件组织
- 一个组件一个文件
- 相关组件放在同一目录
- 使用 index.ts 导出

### Props 接口
- 使用 TypeScript 接口定义
- 命名: `{ComponentName}Props`
- 必填项在前，可选项在后

### State 管理
- 优先使用 Context API
- 局部状态保留在组件内
- 避免 props drilling

---

## 🔐 安全考虑

1. **API Key 安全**
   - 使用 password 类型输入框
   - 存储在 localStorage（仅本地）
   - 不上传到服务器

2. **文件系统安全**
   - 通过 Electron IPC 访问
   - 不直接暴露 Node.js API
   - 使用 contextIsolation

3. **XSS 防护**
   - React 自动转义
   - Markdown 渲染使用白名单

---

## 📚 参考文档

- [React 官方文档](https://react.dev/)
- [Electron 官方文档](https://www.electronjs.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [TypeScript 文档](https://www.typescriptlang.org/)

---

## 📞 联系方式

**项目仓库**: （待添加）
**问题反馈**: （待添加）
**文档更新**: 2026-04-26

---

**文档版本**: 1.1
**最后更新**: 2026-04-26
**更新内容**: 添加重构进度和组件拆分设计
