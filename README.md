# Markdown 阅读器

一个功能强大的 Markdown 编辑器和阅读器，支持实时预览、AI 辅助和多文件管理。

## ✨ 主要功能

### 核心功能
- 📝 **Markdown 编辑** - 实时预览，语法高亮
- 📂 **多文件管理** - 文件标签页，快速切换
- 💾 **自动保存** - 每 30 秒自动保存，防止丢失
- 🔍 **搜索替换** - Ctrl+F 搜索，Ctrl+H 替换
- 🎨 **主题切换** - 浅色/深色主题
- 🤖 **AI 辅助** - AI 优化 Markdown 内容

### 文件操作
- 新建、打开、保存文件
- 打开文件夹，批量管理
- 文件重命名、删除
- 文件历史记录

### 编辑增强
- 快捷键支持（Ctrl+B 粗体等）
- 代码高亮显示
- 一键复制代码
- 实时预览同步

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建
```bash
npm run build
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

### 其他
- `Ctrl/Cmd + Shift + T` - 切换主题
- `Ctrl/Cmd + ?` - 显示快捷键
- `Esc` - 关闭弹窗

## 📦 技术栈

- **React** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **TailwindCSS** - 样式
- **Electron** - 桌面应用
- **React Markdown** - Markdown 渲染

## 🏗️ 项目结构

```
src/
├── components/          # 组件
│   ├── modals/         # 模态框组件
│   ├── FileTabs.tsx    # 文件标签页
│   ├── SearchReplace.tsx # 搜索替换
│   └── ...
├── hooks/              # 自定义 Hooks
│   ├── useTheme.ts     # 主题管理
│   ├── useAutoSave.ts  # 自动保存
│   └── ...
├── types/              # 类型定义
├── utils/              # 工具函数
└── constants/          # 常量
```

## 🎯 最近更新

### v2.0.0 (2026-04-27)

**重构优化**
- ✅ 组件拆分（13 个组件）
- ✅ Custom Hooks（4 个）
- ✅ 代码减少 469 行（-23%）
- ✅ 代码质量提升 ⭐⭐⭐⭐⭐

**新功能**
- ✅ 文件标签页
- ✅ 自动保存（每 30 秒）
- ✅ 搜索和替换

## 📝 开发统计

- **总代码**: 3054 行
- **组件数**: 13 个
- **Hooks**: 4 个
- **构建时间**: ~1s
- **包大小**: 1020 KB

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
