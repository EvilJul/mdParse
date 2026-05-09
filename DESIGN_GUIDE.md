# 设计指南

本文档描述了 Markdown 编辑器的设计系统和 UI 规范。

## 🎨 设计原则

### 1. 简洁性
- 移除不必要的装饰元素
- 保持界面清爽
- 聚焦核心功能

### 2. 一致性
- 统一的颜色方案
- 统一的圆角大小
- 统一的间距系统

### 3. 高效性
- 紧凑的布局
- 快速的操作
- 清晰的反馈

## 🎨 颜色系统

### 主色调
- **Emerald 500**: `#10b981` - 主要操作按钮
- **Emerald 600**: `#059669` - 激活状态（深色模式）
- **Teal 500**: `#14b8a6` - 辅助色

### 中性色
- **Gray 50-900**: 背景、文字、边框
- **White**: 浅色模式背景
- **Black**: 深色模式背景

### 功能色
- **Yellow 400**: `#fbbf24` - 未保存状态
- **Red 500**: `#ef4444` - 错误、删除
- **Green 500**: `#22c55e` - 成功

## 📐 间距系统

### 内边距
- `p-1`: 4px - 小按钮
- `p-1.5`: 6px - 图标按钮
- `p-2`: 8px - 紧凑元素
- `p-3`: 12px - 标准元素
- `p-4`: 16px - 大元素

### 外边距
- `gap-1`: 4px - 紧密元素
- `gap-2`: 8px - 标准间距
- `gap-3`: 12px - 宽松间距
- `gap-4`: 16px - 分组间距

## 🔲 圆角系统

- `rounded-md`: 6px - 小元素
- `rounded-lg`: 8px - 标准元素
- `rounded-xl`: 12px - 大元素
- `rounded-2xl`: 16px - 模态框

## 📏 尺寸规范

### 按钮
- **小按钮**: `px-3 py-1.5 text-xs` (12px 字体)
- **标准按钮**: `px-4 py-2 text-sm` (14px 字体)
- **大按钮**: `px-5 py-2.5 text-base` (16px 字体)

### 图标
- **小图标**: 14px (w-3.5 h-3.5)
- **标准图标**: 16px (w-4 h-4)
- **大图标**: 20px (w-5 h-5)

### 文件卡片
- **高度**: 32px
- **内边距**: `px-3 py-2`
- **图标**: 16px
- **字体**: 14px (text-sm)

### 工具栏
- **高度**: 48px
- **内边距**: `px-6 py-3`
- **按钮**: `px-3 py-1.5 text-xs`

## 🎭 动画效果

### 过渡
- **颜色**: `transition-colors duration-200`
- **透明度**: `transition-opacity duration-200`
- **全部**: `transition-all duration-200` (谨慎使用)

### 禁用的动画
- ❌ 缩放动画 (scale)
- ❌ 脉冲动画 (pulse)
- ❌ 旋转动画 (rotate)
- ❌ 阴影动画 (shadow)

### 保留的动画
- ✅ 颜色过渡
- ✅ 透明度过渡
- ✅ 加载动画 (spin)

## 📱 响应式设计

### 断点
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px

### 侧边栏
- **默认宽度**: 280px
- **最小宽度**: 200px
- **最大宽度**: 400px

## 🌓 深色模式

### 背景色
- **主背景**: `bg-gray-900`
- **次背景**: `bg-gray-800`
- **卡片**: `bg-gray-700`

### 文字色
- **主文字**: `text-white`
- **次文字**: `text-gray-300`
- **辅助文字**: `text-gray-400`

### 边框
- **主边框**: `border-gray-700`
- **次边框**: `border-gray-600`

## 🎯 组件规范

### 文件卡片
```tsx
<button className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors">
  <svg className="w-4 h-4" />
  <span className="truncate">文件名</span>
  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
</button>
```

### 按钮
```tsx
<button className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500 text-white transition-colors">
  按钮文字
</button>
```

### 输入框
```tsx
<input className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500/30" />
```

## 📝 文字规范

### 字体大小
- `text-xs`: 12px - 小按钮、标签
- `text-sm`: 14px - 正文、列表
- `text-base`: 16px - 标题、重要文字
- `text-lg`: 18px - 大标题
- `text-xl`: 20px - 主标题

### 字重
- `font-normal`: 400 - 正文
- `font-medium`: 500 - 强调
- `font-semibold`: 600 - 标题
- `font-bold`: 700 - 重要标题

## 🚫 避免使用

### 装饰元素
- ❌ 大型图标容器
- ❌ 渐变背景（除主按钮外）
- ❌ 复杂阴影
- ❌ 过度动画

### 复杂效果
- ❌ 多层嵌套
- ❌ 过多类名
- ❌ 内联样式
- ❌ 固定尺寸（使用响应式）

## ✅ 推荐使用

### 简洁元素
- ✅ 纯色背景
- ✅ 简单过渡
- ✅ 清晰层次
- ✅ 统一间距

### 高效代码
- ✅ 语义化类名
- ✅ 组件复用
- ✅ Hooks 抽象
- ✅ 类型安全

## 📚 参考资源

- [TailwindCSS 文档](https://tailwindcss.com)
- [React 文档](https://react.dev)
- [TypeScript 文档](https://www.typescriptlang.org)

---

**设计系统版本**: v0.2.0  
**最后更新**: 2026-05-09
