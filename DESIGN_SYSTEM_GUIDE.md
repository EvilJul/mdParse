# 设计系统使用指南

> mdParse 项目的统一设计系统
> 更新日期：2026-05-09

---

## 📐 设计系统概览

本项目已建立统一的设计系统，包括色彩、圆角、阴影和间距规范。所有新组件和UI更新都应遵循这些规范。

---

## 🎨 色彩系统

### 品牌主色
```css
--color-primary-from: #34d399;  /* emerald-400 */
--color-primary-to: #14b8a6;    /* teal-600 */
```

### 使用示例
```tsx
// 渐变背景
<div className="bg-gradient-to-r from-emerald-400 to-teal-600">

// 或使用 CSS 变量
<div style={{ 
  background: `linear-gradient(to right, var(--color-primary-from), var(--color-primary-to))` 
}}>
```

### Hover 状态
```css
--color-primary-hover-from: #10b981;  /* emerald-500 */
--color-primary-hover-to: #0d9488;    /* teal-700 */
```

---

## 📏 圆角系统

| 级别 | 变量 | 值 | 用途 |
|------|------|-----|------|
| 小 | `--radius-sm` | 8px (0.5rem) | 小元素、标签 |
| 中 | `--radius-md` | 12px (0.75rem) | 按钮、输入框 |
| 大 | `--radius-lg` | 16px (1rem) | 卡片、面板 |
| 超大 | `--radius-xl` | 24px (1.5rem) | 模态框、大容器 |

### 使用示例
```tsx
// Tailwind 类名
<button className="rounded-xl">  {/* 对应 --radius-xl */}
<div className="rounded-lg">     {/* 对应 --radius-lg */}

// 或使用 CSS 变量
<div style={{ borderRadius: 'var(--radius-lg)' }}>
```

### 推荐用法
- **按钮**: `rounded-xl` (12px)
- **卡片**: `rounded-xl` (16px)
- **模态框**: `rounded-2xl` (24px)
- **小标签**: `rounded-lg` (8px)

---

## 🌑 阴影系统

| 级别 | 变量 | 用途 |
|------|------|------|
| 小 | `--shadow-sm` | 微妙的边框效果 |
| 中 | `--shadow-md` | 卡片、按钮 |
| 大 | `--shadow-lg` | 浮动元素、下拉菜单 |
| 超大 | `--shadow-xl` | 模态框、重要弹窗 |

### 使用示例
```tsx
// Tailwind 类名
<div className="shadow-md">
<div className="shadow-lg">
<div className="shadow-xl">

// 或使用 CSS 变量
<div style={{ boxShadow: 'var(--shadow-lg)' }}>
```

### 推荐用法
- **卡片**: `shadow-md`
- **浮动按钮**: `shadow-lg`
- **模态框**: `shadow-2xl`
- **Hover 效果**: 从 `shadow-md` 到 `shadow-lg`

---

## 📐 间距系统

| 级别 | 变量 | 值 | 用途 |
|------|------|-----|------|
| 超小 | `--spacing-xs` | 8px (0.5rem) | 紧密间距 |
| 小 | `--spacing-sm` | 12px (0.75rem) | 小间距 |
| 中 | `--spacing-md` | 16px (1rem) | 标准间距 |
| 大 | `--spacing-lg` | 24px (1.5rem) | 大间距 |
| 超大 | `--spacing-xl` | 32px (2rem) | 区块间距 |

### 使用示例
```tsx
// Tailwind 类名
<div className="p-4">   {/* padding: 1rem (16px) */}
<div className="gap-6">  {/* gap: 1.5rem (24px) */}

// 或使用 CSS 变量
<div style={{ padding: 'var(--spacing-md)' }}>
```

---

## 🎭 动画系统

### 内置动画类

#### 1. 对话框进入动画
```tsx
<div className="dialog-animate">
  {/* 模态框内容 */}
</div>
```

#### 2. 淡入动画
```tsx
<div className="fade-in">
  {/* 内容 */}
</div>
```

#### 3. 从右侧滑入
```tsx
<div className="slide-in-right">
  {/* 侧边栏内容 */}
</div>
```

#### 4. AI 浮动按钮脉冲
```tsx
<button className="ai-float-btn">
  {/* AI 按钮 */}
</button>
```

---

## 🧩 实用工具类

### 卡片样式
```tsx
<div className="card">
  {/* 自动应用 border-radius 和 box-shadow */}
</div>
```

### 按钮样式
```tsx
<button className="btn">
  {/* 自动应用 padding、border-radius 和 hover 效果 */}
</button>
```

### 模态框样式
```tsx
<div className="modal">
  {/* 自动应用大圆角和阴影 */}
</div>
```

---

## 📱 响应式设计

### 断点系统
```css
/* 移动端 */
@media (max-width: 767px) {
  /* 小屏幕样式 */
}

/* 平板 */
@media (min-width: 768px) and (max-width: 1023px) {
  /* 中等屏幕样式 */
}

/* 桌面 */
@media (min-width: 1024px) {
  /* 大屏幕样式 */
}
```

### Tailwind 响应式类
```tsx
<div className="p-4 md:p-6 lg:p-8">
  {/* 移动端 16px, 平板 24px, 桌面 32px */}
</div>
```

---

## 🌓 深色模式

### 使用方式
```tsx
// 条件类名
<div className={`${isDark ? 'bg-gray-800' : 'bg-white'}`}>

// Tailwind dark: 前缀
<div className="bg-white dark:bg-gray-800">
```

### 推荐色彩
| 元素 | 浅色模式 | 深色模式 |
|------|----------|----------|
| 背景 | `bg-white` | `bg-gray-800` |
| 次要背景 | `bg-gray-50` | `bg-gray-700` |
| 边框 | `border-gray-200` | `border-gray-700` |
| 主文本 | `text-gray-900` | `text-white` |
| 次要文本 | `text-gray-600` | `text-gray-300` |
| 禁用文本 | `text-gray-400` | `text-gray-500` |

---

## ✅ 最佳实践

### 1. 优先使用 Tailwind 类名
```tsx
// ✅ 推荐
<button className="px-4 py-2 rounded-xl shadow-md">

// ❌ 避免
<button style={{ padding: '8px 16px', borderRadius: '12px' }}>
```

### 2. 保持一致性
```tsx
// ✅ 所有按钮使用相同的圆角
<button className="rounded-xl">主按钮</button>
<button className="rounded-xl">次要按钮</button>

// ❌ 避免混用不同圆角
<button className="rounded-lg">主按钮</button>
<button className="rounded-2xl">次要按钮</button>
```

### 3. 使用语义化间距
```tsx
// ✅ 使用标准间距
<div className="space-y-6">  {/* 24px 间距 */}

// ❌ 避免随意数值
<div className="space-y-5">  {/* 20px 非标准 */}
```

### 4. Hover 效果一致
```tsx
// ✅ 统一的 hover 效果
<button className="hover:shadow-lg hover:scale-105 transition-all">

// ❌ 避免不一致的效果
<button className="hover:shadow-md">  {/* 某些按钮 */}
<button className="hover:shadow-xl">  {/* 其他按钮 */}
```

---

## 🎯 组件示例

### 现代化按钮
```tsx
<button className="
  px-6 py-3 
  bg-gradient-to-r from-emerald-500 to-teal-600 
  text-white font-medium
  rounded-xl shadow-md
  hover:shadow-lg hover:scale-105
  active:scale-95
  transition-all duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
">
  保存
</button>
```

### 卡片容器
```tsx
<div className={`
  p-6 rounded-xl border
  ${isDark ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'}
  shadow-md hover:shadow-lg
  transition-all duration-200
`}>
  {/* 卡片内容 */}
</div>
```

### 输入框
```tsx
<input className={`
  w-full px-4 py-2.5 
  border rounded-xl
  ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}
  focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20
  transition-all duration-200
`} />
```

### 模态框
```tsx
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
  <div className={`
    w-full max-w-2xl
    rounded-2xl shadow-2xl
    ${isDark ? 'bg-gray-800' : 'bg-white'}
    dialog-animate
  `}>
    {/* 模态框内容 */}
  </div>
</div>
```

---

## 🔄 迁移指南

### 从旧样式迁移到新设计系统

#### 1. 更新圆角
```tsx
// 旧
<div className="rounded-lg">

// 新（根据元素类型选择）
<button className="rounded-xl">  {/* 按钮 */}
<div className="rounded-xl">     {/* 卡片 */}
<div className="rounded-2xl">    {/* 模态框 */}
```

#### 2. 更新阴影
```tsx
// 旧
<div className="shadow">

// 新（根据层级选择）
<div className="shadow-md">   {/* 卡片 */}
<div className="shadow-lg">   {/* 浮动元素 */}
<div className="shadow-2xl">  {/* 模态框 */}
```

#### 3. 更新渐变
```tsx
// 旧（多种不同的渐变）
<div className="bg-gradient-to-br from-emerald-400 to-teal-500">
<div className="bg-gradient-to-r from-emerald-500 to-teal-600">

// 新（统一使用）
<div className="bg-gradient-to-r from-emerald-500 to-teal-600">
```

---

## 📚 参考资源

- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [WCAG 对比度检查器](https://webaim.org/resources/contrastchecker/)
- [UI_OPTIMIZATION_TODO.md](./UI_OPTIMIZATION_TODO.md) - 完整优化清单
- [UI_OPTIMIZATION_COMPLETED.md](./UI_OPTIMIZATION_COMPLETED.md) - 已完成的优化

---

**文档版本**: v1.0  
**更新日期**: 2026-05-09  
**维护者**: Kiro AI
