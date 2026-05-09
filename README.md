# Markdown 编辑器

一个简洁优雅的 Markdown 编辑器，支持实时预览、AI 辅助和多文件管理。

## ✨ 主要功能

### 核心功能
- 📝 **Markdown 编辑** - 实时预览，语法高亮，代码高亮
- 📂 **多文件管理** - 侧边栏文件列表，快速切换
- 💾 **自动保存** - 每 30 秒自动保存，防止数据丢失
- 🔍 **搜索替换** - Ctrl+F 搜索，Ctrl+H 替换
- 🎨 **主题切换** - 浅色/深色主题，护眼舒适
- 🤖 **AI 辅助** - AI 智能优化 Markdown 排版

### 编辑增强
- 🛠️ **Markdown 工具栏** - 12 种格式化工具，一键插入
- 📊 **表格支持** - 完整的 GFM 表格渲染（需安装 remark-gfm）
- ✅ **任务列表** - 支持 GitHub 风格任务列表
- 🔗 **自动链接** - URL 自动转换为可点击链接
- ~~删除线~~ - 支持删除线语法

### 文件操作
- 新建、打开、保存文件
- 打开文件夹，批量管理
- 文件重命名、删除
- 文件搜索过滤
- 未保存状态提示

### 视图模式
- 📝 **编辑模式** - 专注编辑
- 👁️ **预览模式** - 查看渲染效果
- ⚡ **分屏模式** - 编辑预览同步

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 桌面应用开发
```bash
npm run electron:dev
```

### 构建
```bash
# Web 版本
npm run build

# 桌面应用
npm run electron:build
```

## ⌨️ 快捷键

### 文件操作
- `Ctrl/Cmd + N` - 新建文件
- `Ctrl/Cmd + O` - 打开文件
- `Ctrl/Cmd + S` - 保存文件
- `Ctrl/Cmd + Shift + S` - 另存为
- `Ctrl/Cmd + W` - 关闭文件
- `Ctrl/Cmd + Shift + O` - 打开文件夹

### 编辑操作
- `Ctrl/Cmd + F` - 搜索
- `Ctrl/Cmd + H` - 替换
- `Ctrl/Cmd + B` - 粗体
- `Ctrl/Cmd + I` - 斜体
- `Ctrl/Cmd + K` - 插入链接
- `Ctrl/Cmd + 1/2/3` - 标题级别
- `Tab` - 插入制表符

### 其他
- `Ctrl/Cmd + Shift + T` - 切换主题
- `Ctrl/Cmd + ?` - 显示快捷键
- `Esc` - 关闭弹窗

## 📦 技术栈

- **React 19** - UI 框架
- **TypeScript 6** - 类型安全
- **Vite 8** - 构建工具
- **TailwindCSS 4** - 样式框架
- **Electron 22** - 桌面应用
- **React Markdown** - Markdown 渲染
- **Prism** - 代码语法高亮

## 🏗️ 项目结构

```
src/
├── components/          # 组件
│   ├── modals/         # 模态框组件
│   ├── MarkdownEditor.tsx    # 编辑器
│   ├── MarkdownToolbar.tsx   # 工具栏
│   ├── FileSearchBar.tsx     # 文件搜索
│   ├── SearchReplace.tsx     # 搜索替换
│   └── ...
├── hooks/              # 自定义 Hooks
│   ├── useTheme.ts     # 主题管理
│   ├── useAutoSave.ts  # 自动保存
│   ├── useModals.ts    # 模态框管理
│   └── useSidebar.ts   # 侧边栏管理
├── types/              # 类型定义
├── utils/              # 工具函数
├── constants/          # 常量
└── data/               # 数据文件
```

## 🎯 版本历史

### v0.2.0 (2026-05-09) - UI 优化版本

**UI 优化**
- ✅ 简化编辑器工具栏（节省 40% 空间）
- ✅ 优化文件列表卡片（减少 33% 高度）
- ✅ 移除顶部重复标签栏
- ✅ 移除装饰性图标和动画
- ✅ 统一按钮尺寸和样式
- ✅ 更简洁的视觉效果

**功能改进**
- ✅ 添加 Markdown 工具栏（12 种格式化工具）
- ✅ 添加文件搜索过滤
- ✅ 支持 GFM 表格渲染（需安装 remark-gfm）
- ✅ 移除"关于"页面默认打开
- ✅ Toast 通知系统
- ✅ 自动调整文本框

**代码优化**
- ✅ 减少 40% 工具栏代码
- ✅ 减少 50% 文件卡片代码
- ✅ 统一设计系统
- ✅ 改进响应式布局

### v0.1.0 (2026-04-27) - 初始版本

**核心功能**
- ✅ Markdown 编辑和预览
- ✅ 多文件管理
- ✅ 自动保存
- ✅ 搜索替换
- ✅ AI 辅助
- ✅ 主题切换

## 📝 开发统计

- **总代码**: ~3000 行
- **组件数**: 15+ 个
- **Hooks**: 5 个
- **构建时间**: ~1.5s
- **包大小**: 1034 KB (gzip: 341 KB)

## 🔧 配置说明

### AI 功能配置

1. 打开设置（Settings）
2. 进入 AI 配置标签
3. 配置以下信息：
   - API Key
   - API 地址
   - 模型名称
4. 测试连接
5. 保存设置

支持的 AI 提供商：
- OpenAI
- DeepSeek
- 自定义 API

### 表格渲染支持

安装 remark-gfm 以启用表格渲染：

```bash
npm install remark-gfm
```

然后取消注释以下文件中的相关代码：
- `src/components/MarkdownContent.tsx`
- `src/components/MarkdownViewer.tsx`

## 🎨 设计系统

### 颜色
- 主色调: Emerald (翠绿色)
- 辅助色: Teal (青色)
- 中性色: Gray (灰色)

### 圆角
- 小: 4px (rounded-md)
- 中: 8px (rounded-lg)
- 大: 12px (rounded-xl)

### 阴影
- 无阴影: 简洁设计
- 悬停: 颜色过渡

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**Made with ❤️ by EvilJul**
