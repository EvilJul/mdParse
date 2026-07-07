import {
  Decoration,
  ViewPlugin,
  WidgetType,
  EditorView,
} from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import { RangeSetBuilder, StateField } from '@codemirror/state';
import type { EditorState, Text } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';
import type { SyntaxNode } from '@lezer/common';

// 分割线小部件：光标不在该行时，用一条水平线替换 `---` 源码。
class HorizontalRuleWidget extends WidgetType {
  eq(): boolean {
    return true;
  }
  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'cm-md-hr';
    return span;
  }
  ignoreEvent(): boolean {
    return false;
  }
}

// 围栏代码块小部件：光标不在块内时，用 <pre><code>…</code></pre> 整块替换围栏+内容源码。
// 隐藏 ``` 围栏行；源码是 markdown 文本，按字面展示（不做语法高亮，避免泄漏第三方依赖）。
class FencedCodeWidget extends WidgetType {
  readonly text: string;
  constructor(text: string) {
    super();
    this.text = text;
  }
  eq(other: FencedCodeWidget): boolean {
    return other.text === this.text;
  }
  toDOM(): HTMLElement {
    const pre = document.createElement('pre');
    pre.className = 'cm-md-codeblock';
    const code = document.createElement('code');
    code.textContent = this.text;
    pre.appendChild(code);
    return pre;
  }
  ignoreEvent(): boolean {
    return false;
  }
}

// 图片小部件：光标不在该行时，用真实 <img> 替换 `![alt](url)` 源码。
// 无 src 或加载失败时回退显示 alt 文本，避免出现裂图。
class ImageWidget extends WidgetType {
  readonly url: string;
  readonly alt: string;
  constructor(url: string, alt: string) {
    super();
    this.url = url;
    this.alt = alt;
  }
  eq(other: ImageWidget): boolean {
    return other.url === this.url && other.alt === this.alt;
  }
  toDOM(): HTMLElement {
    const wrap = document.createElement('span');
    wrap.className = 'cm-md-image';
    if (!this.url) {
      wrap.textContent = this.alt || 'image';
      wrap.classList.add('cm-md-image-fallback');
      return wrap;
    }
    const img = document.createElement('img');
    img.src = this.url;
    img.alt = this.alt;
    img.className = 'cm-md-image-el';
    img.addEventListener('error', () => {
      wrap.textContent = this.alt || 'image';
      wrap.classList.add('cm-md-image-fallback');
    });
    wrap.appendChild(img);
    return wrap;
  }
  ignoreEvent(): boolean {
    return false;
  }
}

// 表格块小部件：光标不在表格任一行时，用真正的 <table> 整块替换 markdown 源码。
// 传入已解析好的表头单元格与各数据行单元格。
class TableWidget extends WidgetType {
  readonly header: string[];
  readonly rows: string[][];
  readonly signature: string;
  constructor(header: string[], rows: string[][], signature: string) {
    super();
    this.header = header;
    this.rows = rows;
    this.signature = signature;
  }
  eq(other: TableWidget): boolean {
    return other.signature === this.signature;
  }
  toDOM(): HTMLElement {
    const table = document.createElement('table');
    table.className = 'cm-md-table';

    const thead = document.createElement('thead');
    const htr = document.createElement('tr');
    for (const cell of this.header) {
      const th = document.createElement('th');
      th.textContent = cell;
      htr.appendChild(th);
    }
    thead.appendChild(htr);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (const row of this.rows) {
      const tr = document.createElement('tr');
      // 用表头列数对齐，缺失补空、超出忽略。
      for (let i = 0; i < this.header.length; i++) {
        const td = document.createElement('td');
        td.textContent = row[i] ?? '';
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    return table;
  }
  ignoreEvent(): boolean {
    return false;
  }
}

// 无序列表项目符号小部件：替换 `- ` / `* ` / `+ ` 源码为圆点。
class BulletWidget extends WidgetType {
  eq(): boolean {
    return true;
  }
  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'cm-md-bullet';
    span.textContent = '•';
    return span;
  }
  ignoreEvent(): boolean {
    return true;
  }
}

// 任务列表勾选框小部件：替换 `- [ ] ` / `- [x] ` 源码为复选框。
class TaskWidget extends WidgetType {
  readonly checked: boolean;
  constructor(checked: boolean) {
    super();
    this.checked = checked;
  }
  eq(other: TaskWidget): boolean {
    return other.checked === this.checked;
  }
  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'cm-md-task';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = this.checked;
    box.className = 'cm-md-task-box';
    // 只读展示：阻止直接勾选改变（源码才是真相），避免与文档状态不同步。
    box.addEventListener('mousedown', (e) => e.preventDefault());
    box.addEventListener('click', (e) => e.preventDefault());
    span.appendChild(box);
    return span;
  }
  ignoreEvent(): boolean {
    return true;
  }
}

// 简单净化：剥离 <script>/<style> 整段、HTML 注释以及 on* 事件属性。
// 不追求完备（innerHTML 本身不执行 <script>），仅做基础防护，避免过度设计。
function sanitizeHtml(raw: string): string {
  return raw
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // 去掉 on\w+= 事件属性（带引号或不带引号的值）。
    .replace(/\son\w+\s*=\s*"(?:[^"]*)"/gi, '')
    .replace(/\son\w+\s*=\s*'(?:[^']*)'/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '');
}

// 内嵌 HTML 块小部件：光标不在块内时，用真实 DOM 渲染整段 HTML 源码。
// container.innerHTML = 净化后的源码。用源码字符串做 eq，内容不变复用 DOM。
class HtmlBlockWidget extends WidgetType {
  readonly html: string;
  constructor(html: string) {
    super();
    this.html = html;
  }
  eq(other: HtmlBlockWidget): boolean {
    return other.html === this.html;
  }
  toDOM(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'cm-md-htmlblock';
    container.innerHTML = sanitizeHtml(this.html);
    return container;
  }
  ignoreEvent(): boolean {
    return false;
  }
}

// 行内 HTML 标签小部件：光标不在时把 <br>/<span>… 渲染成真实 DOM（inline）。
class HtmlInlineWidget extends WidgetType {
  readonly html: string;
  constructor(html: string) {
    super();
    this.html = html;
  }
  eq(other: HtmlInlineWidget): boolean {
    return other.html === this.html;
  }
  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'cm-md-htmlinline';
    span.innerHTML = sanitizeHtml(this.html);
    return span;
  }
  ignoreEvent(): boolean {
    return false;
  }
}

// 判断某个字符区间是否与当前任一选区（含光标）相交（基于 EditorState）。
// StateField 无 view，只能拿到 state，所以以 state 版为准。
function rangesTouchState(
  state: EditorState,
  from: number,
  to: number
): boolean {
  for (const range of state.selection.ranges) {
    if (range.from <= to && range.to >= from) return true;
  }
  return false;
}

// 判断某个字符区间是否与当前任一选区（含光标）相交（基于 view，委托给 state 版）。
// 相交 = 需要显示源码（不隐藏标记）。用行首/行尾做一点宽松处理，
// 让光标停在行首或行尾也算“在该节点内”，交互更自然。
function rangesTouch(
  view: EditorView,
  from: number,
  to: number
): boolean {
  return rangesTouchState(view.state, from, to);
}

// 判断某一行是否被任一选区触及（用于整行样式：标题行 / 引用行 / 代码块行）。
function lineActive(view: EditorView, lineFrom: number, lineTo: number): boolean {
  return rangesTouch(view, lineFrom, lineTo);
}

const HEADING_CLASS: Record<string, string> = {
  ATXHeading1: 'cm-md-h1',
  ATXHeading2: 'cm-md-h2',
  ATXHeading3: 'cm-md-h3',
  ATXHeading4: 'cm-md-h4',
  ATXHeading5: 'cm-md-h5',
  ATXHeading6: 'cm-md-h6',
};

interface DecoItem {
  from: number;
  to: number;
  deco: Decoration;
  // 排序权重：line 装饰必须先于同位置的 mark/replace 装饰进入 builder，
  // 且 replace(隐藏) 要与 mark 正确排序，这里统一按 (from, startSide) 处理。
}

const hideMark = Decoration.replace({});

// 遍历语法树，产出该视口内的所有装饰。
function buildDecorations(view: EditorView): DecorationSet {
  const items: DecoItem[] = [];
  const doc = view.state.doc;
  const tree = syntaxTree(view.state);

  // 记录已作为整行装饰处理过的行，避免代码块逐行与标题重复。
  for (const { from: vpFrom, to: vpTo } of view.visibleRanges) {
    tree.iterate({
      from: vpFrom,
      to: vpTo,
      enter: (node) => {
        const name = node.name;

        // ---------- 标题 ----------
        if (HEADING_CLASS[name]) {
          const line = doc.lineAt(node.from);
          items.push({
            from: line.from,
            to: line.from,
            deco: Decoration.line({ attributes: { class: HEADING_CLASS[name] } }),
          });
          if (!lineActive(view, line.from, line.to)) {
            // 隐藏行首 `#{1,6}` 及其后的一个空格。
            const headerMark = findChild(node.node, 'HeaderMark');
            if (headerMark) {
              let hideTo = headerMark.to;
              if (doc.sliceString(hideTo, hideTo + 1) === ' ') hideTo += 1;
              items.push({ from: headerMark.from, to: hideTo, deco: hideMark });
            }
          }
          return;
        }

        // ---------- 粗体 ----------
        if (name === 'StrongEmphasis') {
          pushMarkWithDelims(
            view,
            node.node,
            'cm-md-strong',
            'EmphasisMark',
            items
          );
          return;
        }

        // ---------- 斜体 ----------
        if (name === 'Emphasis') {
          pushMarkWithDelims(
            view,
            node.node,
            'cm-md-em',
            'EmphasisMark',
            items
          );
          return;
        }

        // ---------- 删除线 ----------
        if (name === 'Strikethrough') {
          pushMarkWithDelims(
            view,
            node.node,
            'cm-md-strike',
            'StrikethroughMark',
            items
          );
          return;
        }

        // ---------- 行内代码 ----------
        if (name === 'InlineCode') {
          pushMarkWithDelims(
            view,
            node.node,
            'cm-md-code',
            'CodeMark',
            items
          );
          return;
        }

        // ---------- 链接 [text](url) ----------
        if (name === 'Link') {
          const active = rangesTouch(view, node.from, node.to);
          // 整个链接文字部分标为 link 样式。
          items.push({
            from: node.from,
            to: node.to,
            deco: Decoration.mark({ class: 'cm-md-link' }),
          });
          if (!active) {
            // 隐藏第一个 `[`，以及从 `]` 到结尾 `)` 的整段（即 `](url)`）。
            const marks = findChildren(node.node, 'LinkMark');
            if (marks.length >= 1) {
              // 第一个 LinkMark 是 `[`
              items.push({ from: marks[0].from, to: marks[0].to, deco: hideMark });
            }
            if (marks.length >= 2) {
              // 从第二个 LinkMark（`]`）到链接节点结束，隐藏 `](url)`
              const closeStart = marks[1].from;
              items.push({ from: closeStart, to: node.to, deco: hideMark });
            }
          }
          return;
        }

        // ---------- 引用 ----------
        if (name === 'Blockquote') {
          // 逐行加引用样式，并在非激活行隐藏 `> ` 标记。
          let pos = node.from;
          while (pos <= node.to) {
            const line = doc.lineAt(pos);
            items.push({
              from: line.from,
              to: line.from,
              deco: Decoration.line({ attributes: { class: 'cm-md-quote' } }),
            });
            pos = line.to + 1;
          }
          // 隐藏 QuoteMark（每个子 QuoteMark），前提是该 mark 所在行未激活。
          const quoteMarks = findChildren(node.node, 'QuoteMark');
          for (const qm of quoteMarks) {
            const line = doc.lineAt(qm.from);
            if (!lineActive(view, line.from, line.to)) {
              let hideTo = qm.to;
              if (doc.sliceString(hideTo, hideTo + 1) === ' ') hideTo += 1;
              items.push({ from: qm.from, to: hideTo, deco: hideMark });
            }
          }
          return;
        }

        // ---------- 代码块（FencedCode）----------
        // block replace 由 blockDecorationField（StateField）提供 —— 这里只跳过子节点，
        // 避免对围栏（CodeMark）/信息串（CodeInfo）/内容（CodeText）产生装饰与 block replace 冲突。
        if (name === 'FencedCode') {
          return false;
        }

        // ---------- 分割线 ----------
        if (name === 'HorizontalRule') {
          const line = doc.lineAt(node.from);
          if (!lineActive(view, line.from, line.to)) {
            items.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({ widget: new HorizontalRuleWidget() }),
            });
          }
          return;
        }

        // ---------- 图片 ![alt](url) ----------
        if (name === 'Image') {
          // 光标不在图片范围内时，用真实 <img> 替换整段源码。
          if (!rangesTouch(view, node.from, node.to)) {
            const raw = doc.sliceString(node.from, node.to);
            const { alt, url } = parseImage(raw);
            items.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({ widget: new ImageWidget(url, alt) }),
            });
          }
          // 光标在范围内：不加装饰，显示源码。
          return false;
        }

        // ---------- 表格（GFM） ----------
        // block replace 由 blockDecorationField（StateField）提供 —— CodeMirror 规定
        // block decoration 不能经 ViewPlugin 提供。这里只跳过子节点，避免对单元格内容
        // 产生 inline/line 装饰而与 StateField 的 block replace 冲突。
        if (name === 'Table') {
          return false;
        }

        // ---------- 列表项（含任务列表） ----------
        if (name === 'ListItem') {
          handleListItem(view, doc, node.node, items);
          // 继续深入子节点：项目内的段落里可能有 **粗体**、`代码`、[链接] 等，
          // 需要让它们被后续遍历正常处理，所以不返回 false。
          return;
        }

        // ---------- 内嵌 HTML 块（多行）----------
        // block replace 同样由 blockDecorationField（StateField）提供，这里只跳过子节点。
        if (name === 'HTMLBlock' || name === 'CommentBlock') {
          return false;
        }

        // ---------- 行内 HTML 标签 ----------
        // 句中的 <br>、<span>… 光标不在时 inline 渲染成真实 DOM。
        if (name === 'HTMLTag') {
          if (node.to > node.from && !rangesTouch(view, node.from, node.to)) {
            const raw = doc.sliceString(node.from, node.to);
            items.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({ widget: new HtmlInlineWidget(raw) }),
            });
          }
          return false;
        }
      },
    });
  }

  // 排序：先按 from 升序；同一位置，line 装饰(startSide 极小)必须在最前，
  // replace 隐藏与 mark 之间用 CodeMirror 默认 side 处理。RangeSetBuilder 要求
  // 严格按 (from, value.startSide) 升序 add。这里对 from 相同的项，用 startSide 排序。
  items.sort((a, b) => {
    if (a.from !== b.from) return a.from - b.from;
    const sa = a.deco.startSide ?? 0;
    const sb = b.deco.startSide ?? 0;
    if (sa !== sb) return sa - sb;
    return a.to - b.to;
  });

  const builder = new RangeSetBuilder<Decoration>();
  for (const it of items) {
    builder.add(it.from, it.to, it.deco);
  }
  return builder.finish();
}

// 给一个「标记 + 两侧定界符」结构（粗体/斜体/代码/删除线）加装饰：
// 内容部分加样式 class；若光标不在节点内，则隐藏两侧定界符。
function pushMarkWithDelims(
  view: EditorView,
  node: SyntaxNode,
  cls: string,
  delimName: string,
  items: DecoItem[]
): void {
  items.push({
    from: node.from,
    to: node.to,
    deco: Decoration.mark({ class: cls }),
  });
  if (rangesTouch(view, node.from, node.to)) return;
  const delims = findChildren(node, delimName);
  for (const d of delims) {
    if (d.to > d.from) items.push({ from: d.from, to: d.to, deco: hideMark });
  }
  // 兜底：若没有解析出定界符子节点（极少数情况），不隐藏，保证不吞正文。
}

// 在语法节点的直接子节点中查找第一个指定名字的子节点。
function findChild(node: SyntaxNode, name: string): SyntaxNode | null {
  let child = node.firstChild;
  while (child) {
    if (child.name === name) return child;
    child = child.nextSibling;
  }
  return null;
}

// 查找所有指定名字的直接子节点。
function findChildren(node: SyntaxNode, name: string): SyntaxNode[] {
  const out: SyntaxNode[] = [];
  let child = node.firstChild;
  while (child) {
    if (child.name === name) out.push(child);
    child = child.nextSibling;
  }
  return out;
}

// 处理单个列表项：加缩进/间距样式；渲染无序符号或任务勾选框（光标在该行时显示源码）。
function handleListItem(
  view: EditorView,
  doc: EditorView['state']['doc'],
  item: SyntaxNode,
  items: DecoItem[]
): void {
  const listMark = findChild(item, 'ListMark');
  if (!listMark) return;
  const markLine = doc.lineAt(listMark.from);

  // 给项目首行加样式（缩进/行距）。
  items.push({
    from: markLine.from,
    to: markLine.from,
    deco: Decoration.line({ attributes: { class: 'cm-md-li' } }),
  });

  const active = lineActive(view, markLine.from, markLine.to);
  if (active) return; // 光标在该行：显示源码，不替换符号。

  const markText = doc.sliceString(listMark.from, listMark.to);
  // 判断是否任务列表：ListMark 之后（同一行）是否紧跟 `[ ]` / `[x]` / `[X]`。
  const afterMark = doc.sliceString(listMark.to, markLine.to);
  const taskMatch = /^\s*\[([ xX])\]\s?/.exec(afterMark);

  if (taskMatch) {
    // 任务列表：把 `- [ ] ` 整段（ListMark + 空格 + [x] + 一个空格）替换为勾选框。
    const checked = taskMatch[1].toLowerCase() === 'x';
    const replaceEnd = listMark.to + taskMatch[0].length;
    items.push({
      from: listMark.from,
      to: replaceEnd,
      deco: Decoration.replace({ widget: new TaskWidget(checked) }),
    });
    return;
  }

  // 有序列表（ListMark 形如 `1.` / `2)`）：保留数字源码，仅靠行样式呈现。
  if (/[.)]$/.test(markText)) return;

  // 无序列表（`-` / `*` / `+`）：用圆点替换标记及其后的一个空格。
  let hideTo = listMark.to;
  if (doc.sliceString(hideTo, hideTo + 1) === ' ') hideTo += 1;
  items.push({
    from: listMark.from,
    to: hideTo,
    deco: Decoration.replace({ widget: new BulletWidget() }),
  });
}

// 从 `![alt](url)` 源码解析 alt 与 url。宽松匹配，解析不到就退化。
function parseImage(raw: string): { alt: string; url: string } {
  const m = /^!\[([^\]]*)\]\(([^)]*)\)/.exec(raw.trim());
  if (!m) return { alt: '', url: '' };
  // url 可能带标题，如 (url "title")，取空格前的部分作为真实地址。
  const urlPart = m[2].trim();
  const url = urlPart.split(/\s+/)[0] || '';
  return { alt: m[1], url };
}

// 从 Table 节点解析出表头单元格与各数据行单元格。
// TableHeader / TableRow 下的 TableCell 顺序即列顺序；分隔行是裸 TableDelimiter，跳过。
// 接受 doc（Text）而非 view，以便 StateField（无 view）也能调用。
function parseTable(
  doc: Text,
  table: SyntaxNode
): { header: string[]; rows: string[][]; signature: string } | null {
  const cellsOf = (row: SyntaxNode): string[] =>
    findChildren(row, 'TableCell').map((c) =>
      doc.sliceString(c.from, c.to).trim()
    );

  const headerNode = findChild(table, 'TableHeader');
  if (!headerNode) return null;
  const header = cellsOf(headerNode);
  if (header.length === 0) return null;

  const rows = findChildren(table, 'TableRow').map(cellsOf);
  // signature 用于 widget.eq 比较，内容不变则复用同一 DOM。
  const signature = doc.sliceString(table.from, table.to);
  return { header, rows, signature };
}

// 构建「块级」装饰（Table / HTMLBlock / CommentBlock / FencedCode）。
// block replace 必须经 StateField 提供（CodeMirror 规定：块高度须在视口计算前确定，
// 不能来自 ViewPlugin）。StateField 无 view/viewport，故遍历整个文档语法树，不做视口裁剪
//（块元素通常数量少，性能可接受）。光标触及该块任一行 → 不装饰、显示源码。
function buildBlockDecorations(state: EditorState): DecorationSet {
  const doc = state.doc;
  const tree = syntaxTree(state);
  const builder = new RangeSetBuilder<Decoration>();

  tree.iterate({
    enter: (node) => {
      const name = node.name;

      if (name === 'Table') {
        const startLine = doc.lineAt(node.from);
        const endLine = doc.lineAt(Math.min(node.to, doc.length));
        if (!rangesTouchState(state, startLine.from, endLine.to)) {
          const parsed = parseTable(doc, node.node);
          if (parsed) {
            builder.add(
              startLine.from,
              endLine.to,
              Decoration.replace({
                widget: new TableWidget(
                  parsed.header,
                  parsed.rows,
                  parsed.signature
                ),
                block: true,
              })
            );
          }
        }
        return false; // 不深入子节点
      }

      if (name === 'HTMLBlock' || name === 'CommentBlock') {
        const startLine = doc.lineAt(node.from);
        const endLine = doc.lineAt(Math.min(node.to, doc.length));
        if (!rangesTouchState(state, startLine.from, endLine.to)) {
          const raw = doc.sliceString(node.from, node.to);
          builder.add(
            startLine.from,
            endLine.to,
            Decoration.replace({ widget: new HtmlBlockWidget(raw), block: true })
          );
        }
        return false;
      }

      // 围栏代码块：整块用 <pre><code>…</code></pre> 替换，隐藏 ``` 围栏。
      if (name === 'FencedCode') {
        const startLine = doc.lineAt(node.from);
        const endLine = doc.lineAt(Math.min(node.to, doc.length));
        if (!rangesTouchState(state, startLine.from, endLine.to)) {
          // 取围栏之间的内容行（去掉首行 ``` info 与末行 ```），保留内部缩进。
          let content = '';
          for (let ln = startLine.number + 1; ln < endLine.number; ln++) {
            content += (ln === startLine.number + 1 ? '' : '\n') + doc.line(ln).text;
          }
          builder.add(
            startLine.from,
            endLine.to,
            Decoration.replace({
              widget: new FencedCodeWidget(content),
              block: true,
            })
          );
        }
        return false;
      }

      return undefined;
    },
  });

  return builder.finish();
}

// StateField：提供块级装饰。block decoration 只能经 StateField（EditorView.decorations）提供。
//
// create 直接返回 Decoration.none：EditorState.create 是同步的，而 Lezer 的
// syntaxTree(state) 在 state 刚构造完时通常只有 Document 根（增量解析尚未推进），
// 此时遍历会得到空集。延迟到第一次 update（docChanged / selection / 语法树推进）
// 再通过 buildBlockDecorations 重建即可。
export const blockDecorationField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    // 文档变化 / 选区变化 / 语法树推进（异步增量解析）时重建。
    if (
      tr.docChanged ||
      tr.selection ||
      syntaxTree(tr.state) !== syntaxTree(tr.startState)
    ) {
      return buildBlockDecorations(tr.state);
    }
    return deco.map(tr.changes);
  },
  provide: (f) => [
    EditorView.decorations.from(f),
    // 让方向键跳过被块替换的区间（表格/HTML 块），光标不停进渲染后的块里。
    EditorView.atomicRanges.of((view) => view.state.field(f)),
  ],
});

// ViewPlugin：维护 DecorationSet，光标移动/文档变化/视口变化时重建。
export const markdownDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate) {
      // Lezer 是异步增量解析：打开较大文件时首次 syntaxTree 往往只解析了前一部分，
      // 后台解析推进时会 dispatch 一次「既非 docChanged 也非 selectionSet/viewportChanged」
      // 的 update，若此时不重建装饰，未解析部分会永远停在源码状态。
      // 通过比较新旧 state 的 syntaxTree 实例（解析推进时会返回不同的树）来捕获这种更新。
      if (
        update.docChanged ||
        update.selectionSet ||
        update.viewportChanged ||
        syntaxTree(update.state) !== syntaxTree(update.startState)
      ) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
    // 让链接点击等原子替换生效；atomicRanges 使方向键跳过被隐藏区间。
    provide: (plugin) =>
      EditorView.atomicRanges.of((view) => {
        return view.plugin(plugin)?.decorations ?? Decoration.none;
      }),
  }
);
