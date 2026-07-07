import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import type { ChangeSpec, SelectionRange } from '@codemirror/state';

// 把工具栏 / 快捷键的浏览器命令翻译成对 CodeMirror 文档的编辑。
// 所有编辑通过 view.dispatch 应用，改动会自然触发 updateListener 里的 onChange。

// 统一的 dispatch：应用 changes，并把选区设置为给定 anchor/head 列表。
function dispatchEdit(
  view: EditorView,
  changes: ChangeSpec[],
  ranges: SelectionRange[]
): void {
  view.dispatch({
    changes,
    selection: ranges.length ? EditorSelection.create(ranges) : undefined,
    scrollIntoView: true,
    userEvent: 'input.format',
  });
  view.focus();
}

// 在当前主选区两侧包裹给定定界符；无选区时插入 wrapper + 占位文字并选中占位文字。
function wrapSelection(view: EditorView, marker: string, placeholder: string): void {
  const changes: ChangeSpec[] = [];
  const ranges: SelectionRange[] = [];
  for (const range of view.state.selection.ranges) {
    if (range.empty) {
      const insert = marker + placeholder + marker;
      changes.push({ from: range.from, insert });
      const start = range.from + marker.length;
      ranges.push(EditorSelection.range(start, start + placeholder.length));
    } else {
      const text = view.state.sliceDoc(range.from, range.to);
      changes.push({ from: range.from, to: range.to, insert: marker + text + marker });
      ranges.push(
        EditorSelection.range(
          range.from + marker.length,
          range.from + marker.length + text.length
        )
      );
    }
  }
  dispatchEdit(view, changes, ranges);
}

// 在当前行行首插入前缀（列表 / 引用）。多行选区时每一行都加。
function prefixLines(view: EditorView, prefix: string): void {
  const { state } = view;
  const changes: ChangeSpec[] = [];
  const seen = new Set<number>();
  for (const range of state.selection.ranges) {
    const startLine = state.doc.lineAt(range.from).number;
    const endLine = state.doc.lineAt(range.to).number;
    for (let ln = startLine; ln <= endLine; ln++) {
      if (seen.has(ln)) continue;
      seen.add(ln);
      changes.push({ from: state.doc.line(ln).from, insert: prefix });
    }
  }
  view.dispatch({ changes, scrollIntoView: true, userEvent: 'input.format' });
  view.focus();
}

// 把当前行设为指定级别标题：先清掉行首已有的 `#{1,6}\s*`，再加新前缀。
function setHeading(view: EditorView, hashes: string): void {
  const { state } = view;
  const changes: ChangeSpec[] = [];
  const seen = new Set<number>();
  for (const range of state.selection.ranges) {
    const startLine = state.doc.lineAt(range.from).number;
    const endLine = state.doc.lineAt(range.to).number;
    for (let ln = startLine; ln <= endLine; ln++) {
      if (seen.has(ln)) continue;
      seen.add(ln);
      const line = state.doc.line(ln);
      const m = /^(#{1,6}\s*)/.exec(line.text);
      const stripLen = m ? m[1].length : 0;
      changes.push({
        from: line.from,
        to: line.from + stripLen,
        insert: hashes + ' ',
      });
    }
  }
  view.dispatch({ changes, scrollIntoView: true, userEvent: 'input.format' });
  view.focus();
}

// 生成链接：选区变 `[选区](url)`，无选区 `[链接](url)`。
function makeLink(view: EditorView, url: string): void {
  const changes: ChangeSpec[] = [];
  const ranges: SelectionRange[] = [];
  for (const range of view.state.selection.ranges) {
    const text = range.empty ? '链接' : view.state.sliceDoc(range.from, range.to);
    const insert = `[${text}](${url})`;
    changes.push({ from: range.from, to: range.to, insert });
    const end = range.from + insert.length;
    ranges.push(EditorSelection.cursor(end));
  }
  dispatchEdit(view, changes, ranges);
}

// 在光标处插入一段文本。
function insertTextAt(view: EditorView, text: string): void {
  const changes: ChangeSpec[] = [];
  const ranges: SelectionRange[] = [];
  for (const range of view.state.selection.ranges) {
    changes.push({ from: range.from, to: range.to, insert: text });
    ranges.push(EditorSelection.cursor(range.from + text.length));
  }
  dispatchEdit(view, changes, ranges);
}

// 从 insertHTML 的 HTML 串里提取等价 markdown。
function htmlToMarkdown(html: string): string {
  const h = html.trim();
  // 图片：<img src="URL" .../>
  if (/<img/i.test(h)) {
    const src = /src\s*=\s*["']([^"']*)["']/i.exec(h);
    const alt = /alt\s*=\s*["']([^"']*)["']/i.exec(h);
    const url = src ? src[1] : '';
    const altText = alt && alt[1] ? alt[1] : 'image';
    return `![${altText}](${url})`;
  }
  // 表格：固定 3 列示例。
  if (/<table/i.test(h)) {
    return '\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n';
  }
  // 行内代码：<code>文本</code>
  if (/<code/i.test(h)) {
    const inner = /<code[^>]*>([\s\S]*?)<\/code>/i.exec(h);
    const text = inner ? stripTags(inner[1]) : '代码';
    return '`' + (text || '代码') + '`';
  }
  // 兜底：去标签后作为纯文本插入。
  return stripTags(h);
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// 命令派发入口：翻译 cmd -> CodeMirror 编辑。未知 cmd 安全忽略。
export function runEditorCommand(view: EditorView, cmd: string, value?: string): void {
  switch (cmd) {
    case 'bold':
      wrapSelection(view, '**', '粗体');
      break;
    case 'italic':
      wrapSelection(view, '*', '斜体');
      break;
    case 'createLink':
      makeLink(view, value || '');
      break;
    case 'insertUnorderedList':
      prefixLines(view, '- ');
      break;
    case 'insertOrderedList':
      prefixLines(view, '1. ');
      break;
    case 'formatBlock': {
      const v = (value || '').toLowerCase();
      if (v.includes('blockquote')) prefixLines(view, '> ');
      else if (v.includes('h1')) setHeading(view, '#');
      else if (v.includes('h2')) setHeading(view, '##');
      else if (v.includes('h3')) setHeading(view, '###');
      else if (v.includes('h4')) setHeading(view, '####');
      else if (v.includes('h5')) setHeading(view, '#####');
      else if (v.includes('h6')) setHeading(view, '######');
      break;
    }
    case 'insertHTML':
      insertTextAt(view, htmlToMarkdown(value || ''));
      break;
    case 'insertText':
      insertTextAt(view, value || '');
      break;
    default:
      // 未知命令：安全忽略，不抛异常。
      break;
  }
}

// 供 keymap 复用的粗体/斜体/链接命令。
export function toggleBold(view: EditorView): void {
  wrapSelection(view, '**', '粗体');
}
export function toggleItalic(view: EditorView): void {
  wrapSelection(view, '*', '斜体');
}
export function insertLink(view: EditorView, url: string): void {
  makeLink(view, url);
}
