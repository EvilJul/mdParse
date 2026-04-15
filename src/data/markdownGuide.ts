export const MARKDOWN_GUIDE = `# Markdown 语法指南

## 标题

使用 \`#\` 创建标题，\`#\` 越多级别越低：

\`\`\`markdown
# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题
\`\`\`

## 文本格式

\`\`\`markdown
**粗体文本**
*斜体文本*
~~删除线文本~~
\`行内代码\`
\`\`\`

## 列表

### 无序列表

\`\`\`markdown
- 项目 1
- 项目 2
  - 子项目 2.1
  - 子项目 2.2
* 也可以使用星号
+ 或者加号
\`\`\`

### 有序列表

\`\`\`markdown
1. 第一项
2. 第二项
3. 第三项
   - 嵌套无序列表
\`\`\`

## 链接和图片

\`\`\`markdown
[链接文字](https://example.com)
![图片描述](图片URL)
\`\`\`

## 代码

### 行内代码

使用反引号：\`const x = 1\`

### 代码块

\`\`\`markdown
\\\`\\\`\\\`javascript
function hello() {
  console.log('Hello World!');
}
\\\`\\\`\\\`
\`\`\`

## 引用

\`\`\`markdown
> 这是一段引用
> 可以换行

> ## 引用中可以包含其他格式
> - 列表
> - **粗体**
\`\`\`

## 表格

\`\`\`markdown
| 表头1 | 表头2 | 表头3 |
|-------|-------|-------|
| 内容1 | 内容2 | 内容3 |
| 内容4 | 内容5 | 内容6 |
\`\`\`

## 分隔线

\`\`\`markdown
---
***
___
\`\`\`

## 任务列表

\`\`\`markdown
- [x] 已完成的任务
- [ ] 未完成的任务
- [ ] 第三个任务
\`\`\`

## 常用快捷键（部分编辑器支持）

| 功能 | 快捷键 |
|------|--------|
| 粗体 | Ctrl + B |
| 斜体 | Ctrl + I |
| 链接 | Ctrl + K |
| 代码 | Ctrl + \` |
| 标题 | Ctrl + 1-6 |

---

## 完整语法参考

- **GFM (GitHub Flavored Markdown)** - GitHub 使用的扩展语法
- **CommonMark** - 标准 Markdown 语法
- **MDX** - 支持 JSX 的 Markdown

更多语法说明请访问：[Markdown 官方文档](https://www.markdownguide.org/)
`;

export const ABOUT_CONTENT = `# 关于 Markdown Reader

Markdown Reader 是一个简洁优雅的 Markdown 文档阅读和编辑工具。

## 功能特性

- 📖 **阅读模式** - 流畅阅读 Markdown 文档
- ✏️ **编辑模式** - 实时编辑和预览
- 🎨 **双主题** - GitHub Light / GitHub Dark
- 📋 **一键复制** - 代码块快速复制
- 🔒 **本地处理** - 保护隐私，无需上传

## 快捷键

| 操作 | 快捷键 |
|------|--------|
| 新建文件 | Ctrl + N |
| 保存文件 | Ctrl + S |
| 切换主题 | Ctrl + Shift + T |

## 技术栈

- React + TypeScript
- Vite
- Tailwind CSS
- react-markdown
- react-syntax-highlighter

---

*使用本地处理，保护您的隐私*
`;