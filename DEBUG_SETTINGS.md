# 设置界面调试指南

## 🔍 已添加的调试代码

我在代码中添加了两个 console.log 来追踪问题：

### 1. 菜单点击事件（App.tsx 第730行）
```typescript
cleanups.push(window.electronAPI.onMenuOpenSettings(() => {
  console.log('Settings menu clicked - opening settings modal');
  setShowSettingsModal(true);
  setSettingsActiveTab('general');
}));
```

### 2. 模态框渲染（App.tsx 第1364行）
```typescript
{showSettingsModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    {console.log('Rendering settings modal, showSettingsModal:', showSettingsModal)}
    ...
  </div>
)}
```

---

## 🚀 调试步骤

### 步骤 1: 重启应用
```bash
# 在终端按 Ctrl+C 停止当前应用
# 然后重新启动
npm run electron:dev
```

### 步骤 2: 打开开发者工具
在 Electron 窗口中按 `Cmd+Option+I` 打开开发者工具

### 步骤 3: 点击设置菜单
点击顶部菜单栏 `mdParse` → `设置`（或按 `Cmd+,`）

### 步骤 4: 查看控制台输出

**情况 A: 看到 "Settings menu clicked"**
```
Settings menu clicked - opening settings modal
Rendering settings modal, showSettingsModal: true
```
✅ 说明事件触发正常，模态框正在渲染
❓ 问题可能是：模态框被 CSS 隐藏或 z-index 太低

**情况 B: 只看到 "Settings menu clicked"，没有 "Rendering settings modal"**
```
Settings menu clicked - opening settings modal
```
❌ 说明 `showSettingsModal` 状态没有更新
❓ 问题可能是：React 状态更新失败

**情况 C: 什么都没看到**
```
(空白)
```
❌ 说明菜单事件没有触发
❓ 问题可能是：
- Electron 菜单配置错误
- preload.cjs 没有正确加载
- 事件监听器没有注册

---

## 🔧 根据不同情况的修复方案

### 情况 A: 模态框渲染但不可见

**可能原因**：
1. z-index 太低，被其他元素覆盖
2. CSS 样式问题导致不可见
3. 位置偏移到屏幕外

**修复方案**：
```css
/* 在 index.css 末尾添加 */
.fixed.inset-0 {
  z-index: 99999 !important;
}

[class*="dialog-animate"] {
  display: block !important;
  visibility: visible !important;
}
```

---

### 情况 B: 状态更新失败

**可能原因**：
1. React 状态更新被阻止
2. 组件重渲染问题
3. 状态初始化错误

**修复方案**：
强制更新状态：
```typescript
// 修改 App.tsx 第730行
cleanups.push(window.electronAPI.onMenuOpenSettings(() => {
  console.log('Settings menu clicked');
  setTimeout(() => {
    setShowSettingsModal(true);
    setSettingsActiveTab('general');
  }, 0);
}));
```

---

### 情况 C: 事件没有触发

**可能原因**：
1. Electron 菜单配置错误
2. preload.cjs 没有加载
3. 事件监听器注册失败

**修复方案**：

#### 检查 1: 验证 preload.cjs 是否加载
在控制台输入：
```javascript
console.log(window.electronAPI);
```
应该看到一个对象，包含 `onMenuOpenSettings` 方法

#### 检查 2: 手动触发设置界面
在控制台输入：
```javascript
// 假设 React 组件有全局引用
document.querySelector('button')?.click();
```

#### 检查 3: 检查菜单配置
查看 `electron/main.cjs` 第178-181行：
```javascript
{
  label: '设置',
  accelerator: 'CmdOrCtrl+,',
  click: () => mainWindow.webContents.send('menu-open-settings')
}
```

---

## 📊 调试检查清单

请按顺序检查以下内容，并告诉我结果：

- [ ] 1. 重启应用后，开发者工具是否自动打开？
- [ ] 2. 点击菜单 `mdParse` → `设置` 后，控制台是否有输出？
- [ ] 3. 如果有输出，具体是什么？（复制粘贴给我）
- [ ] 4. 如果没有输出，在控制台输入 `window.electronAPI` 看到什么？
- [ ] 5. 屏幕上是否有任何变化？（即使很微小）
- [ ] 6. 按快捷键 `Cmd+,` 是否有反应？

---

## 🎯 快速测试

### 测试 1: 手动触发设置界面
在浏览器控制台输入：
```javascript
// 这会直接设置状态，绕过菜单事件
window.dispatchEvent(new CustomEvent('test-settings'));
```

### 测试 2: 检查 React 状态
在控制台输入：
```javascript
// 查看 DOM 中是否有设置模态框
document.querySelector('[class*="dialog-animate"]');
```

### 测试 3: 检查 z-index
在控制台输入：
```javascript
// 查看所有 fixed 元素的 z-index
Array.from(document.querySelectorAll('.fixed')).map(el => ({
  element: el.className,
  zIndex: window.getComputedStyle(el).zIndex
}));
```

---

## 💡 临时解决方案

如果调试太复杂，我可以添加一个**界面按钮**来打开设置：

```typescript
// 在工具栏添加设置按钮
<button
  onClick={() => {
    setShowSettingsModal(true);
    setSettingsActiveTab('general');
  }}
  className="p-2 rounded-lg hover:bg-gray-100"
  title="设置"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
</button>
```

---

## 📝 请告诉我

完成上述调试步骤后，请告诉我：

1. **控制台输出了什么？**（复制粘贴完整的输出）
2. **屏幕上有什么变化？**（即使很微小）
3. **你更倾向于哪种方案？**
   - A: 继续调试菜单问题
   - B: 添加界面按钮作为临时方案
   - C: 两者都做

---

**下一步**: 重启应用，按照调试步骤操作，然后告诉我结果
