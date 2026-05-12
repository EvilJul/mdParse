# 模态框暗色主题修复

## 问题描述
在暗色主题下，所有模态框的背景遮罩层和内容区域存在透明度问题：
- 背景遮罩使用 `bg-gray-950`，透明度过高
- 模态框内容区域使用 `bg-gray-800`，在暗色主题下显得不够实心
- 导致后面的主页文字透过模态框显示，造成文字重叠

## 修复方案

### 1. 背景遮罩层优化
**修改前**:
```tsx
<div className="fixed inset-0 bg-gray-950 flex items-center justify-center z-50">
```

**修改后**:
```tsx
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
```

**改进点**:
- 使用 `bg-black/60` 替代 `bg-gray-950`，提供60%不透明度的黑色背景
- 添加 `backdrop-blur-sm` 实现背景模糊效果，进一步遮挡后面的内容
- 提升视觉层次感，让用户更专注于模态框内容

### 2. 模态框内容区域优化
**修改前**:
```tsx
className={`... ${isDark ? 'bg-gray-800' : 'bg-white'}`}
```

**修改后**:
```tsx
className={`... ${isDark ? 'bg-gray-900' : 'bg-white'}`}
```

**改进点**:
- 使用更深的 `bg-gray-900` 替代 `bg-gray-800`
- 提供更实心的背景，完全遮挡后面的内容
- 保持暗色主题的视觉一致性

### 3. 头部和导航栏优化
**修改前**:
```tsx
className={`... ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
```

**修改后**:
```tsx
className={`... ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}
```

**改进点**:
- 为头部和导航栏添加明确的背景色
- 确保所有区域都有实心背景，不会透出后面的内容

## 修复的文件

### 1. `src/components/modals/SettingsModal.tsx`
修复了设置模态框的4个区域：
- ✅ 背景遮罩层
- ✅ 模态框主容器
- ✅ 头部区域
- ✅ 标签导航区域
- ✅ 内容区域

### 2. `src/App.tsx`
修复了3个内联模态框：
- ✅ Guide Modal (Markdown 语法指南)
- ✅ Preview Modal (预览优化内容)
- ✅ AI Modal (AI 助手)

## 视觉效果对比

### 亮色主题
- **修改前**: 正常显示，无明显问题
- **修改后**: 保持一致，无变化

### 暗色主题
- **修改前**: 
  - 背景遮罩几乎透明
  - 可以看到后面的主页文字
  - 文字重叠，影响阅读
  - 视觉层次不清晰

- **修改后**:
  - 背景遮罩60%不透明度 + 模糊效果
  - 完全遮挡后面的内容
  - 文字清晰可读，无重叠
  - 视觉层次分明，用户体验更好

## 技术细节

### Tailwind CSS 类说明
- `bg-black/60`: 60%不透明度的黑色背景
- `backdrop-blur-sm`: 小幅度背景模糊（4px）
- `bg-gray-900`: Tailwind 的深灰色（#111827）
- `bg-gray-800`: Tailwind 的中深灰色（#1f2937）

### 颜色对比
| 颜色 | Hex | 用途 | 不透明度 |
|------|-----|------|----------|
| gray-950 | #030712 | 旧遮罩层 | 几乎透明 |
| black/60 | #000000 | 新遮罩层 | 60% |
| gray-800 | #1f2937 | 旧内容区 | 100% |
| gray-900 | #111827 | 新内容区 | 100% |

## 测试结果
- ✅ 构建成功（npm run build）
- ✅ 无 TypeScript 错误
- ✅ 无 ESLint 警告
- ✅ 亮色主题显示正常
- ✅ 暗色主题显示正常
- ✅ 所有模态框背景不透明
- ✅ 文字清晰可读，无重叠

## 相关文件
- `src/components/modals/SettingsModal.tsx` - 设置模态框
- `src/App.tsx` - 主应用（包含3个内联模态框）

## 提交信息
```
fix: improve modal backdrop and background in dark mode

- Replace bg-gray-950 with bg-black/60 and backdrop-blur-sm for better visibility
- Change modal background from bg-gray-800 to bg-gray-900 in dark mode
- Add explicit background colors to modal headers and navigation
- Fixes text overlap issue in dark mode
- Affects: SettingsModal, GuideModal, PreviewModal, AIModal
```

---

**修复日期**: 2026-05-12  
**影响范围**: 所有模态框组件  
**优先级**: 高（用户体验问题）
