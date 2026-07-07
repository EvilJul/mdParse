import { describe, it, expect } from 'vitest';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { forceParsing } from '@codemirror/language';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import {
  markdownDecorationPlugin,
  blockDecorationField,
} from '../markdownDecorations';

// 同时包含：markdown 表格、字面 HTML <table> 块、标题、列表、粗体等。
// 这是触发「Block decorations may not be specified via plugins」运行时崩溃的最小场景。
const DOC = [
  '# 标题一',
  '',
  '一段普通文字，含 **粗体** 和 `代码`。',
  '',
  '- 列表项 A',
  '- [ ] 未完成任务',
  '- [x] 已完成任务',
  '',
  '| 列1 | 列2 |',
  '| --- | --- |',
  '| a | b |',
  '',
  '<table width="100%">',
  '  <tr>',
  '    <td><a href="x"><img src="y.png"></a></td>',
  '    <td>PackyCode <strong>10% off</strong></td>',
  '  </tr>',
  '  <!-- 注释 -->',
  '  <tr><td>z</td></tr>',
  '</table>',
  '',
  '结尾段落。',
].join('\n');

function makeState() {
  return EditorState.create({
    doc: DOC,
    extensions: [
      markdown({ base: markdownLanguage }),
      blockDecorationField,
      markdownDecorationPlugin,
    ],
  });
}

describe('block decorations via StateField (回归：构造不崩溃)', () => {
  it('实例化 EditorView 不抛错（锁死 "Block decorations may not be specified via plugins"）并产出含 block replace 的 DecorationSet', () => {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    let view: EditorView | undefined;
    try {
      // 关键断言：过去把 block:true 放进 ViewPlugin 时，这一行会抛 RangeError。
      expect(() => {
        view = new EditorView({ state: makeState(), parent });
      }).not.toThrow();

      // Lezer 在 jsdom 下默认只解析 viewport 部分；forceParsing 同步推进到文档末尾，
      // 再 dispatch 一次（带 selection 让 tr.selection 触发 update 条件）重建块装饰。
      forceParsing(view!, view!.state.doc.length, 1000);
      view!.dispatch({ selection: view!.state.selection });
      const set = view!.state.field(blockDecorationField);
      // 至少应有 2 个块替换：markdown 表格 + HTML <table> 块。
      expect(set.size).toBeGreaterThanOrEqual(2);
    } finally {
      view?.destroy();
      parent.remove();
    }
  });

  it('光标进入表格块时不再对该块产生 block 替换（显示源码）', () => {
    // 把光标放到 markdown 表格首行（"| 列1 | 列2 |" 所在位置）。
    const idx = DOC.indexOf('| 列1');
    const state = EditorState.create({
      doc: DOC,
      selection: { anchor: idx + 2 },
      extensions: [
        markdown({ base: markdownLanguage }),
        blockDecorationField,
        markdownDecorationPlugin,
      ],
    });
    // EditorState.create 是同步的，Lezer 在该同步时刻未完成解析；用 EditorView
    // 触发一次 update 让 syntaxTree 推进并重建块装饰。
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    const view = new EditorView({ state, parent });
    try {
      // 强制推进 Lezer 到文档末尾，再 dispatch 一次（带 selection 让 tr.selection 触发
      // update 条件），重建块装饰。
      forceParsing(view, view.state.doc.length, 1000);
      view.dispatch({ selection: view.state.selection });
      const set = view.state.field(blockDecorationField);
      // 光标进入 markdown 表格 → 该块不替换；HTML <table> 块仍替换 → 仅 1 个块替换。
      expect(set.size).toBe(1);
    } finally {
      view.destroy();
      parent.remove();
    }
  });
});

describe('围栏代码块（fenced code block）— block widget 渲染', () => {
  // 用户实机反馈："源文本加上一个块"——围栏 ``` 仍可见 + 每行加 cm-md-codeblock
  // 边框/背景，导致围栏行看起来像"额外的块"。本组测试锁死：
  // (a) EditorView 构造不抛错；(b) 代码块进入 blockDecorationField，输出 1 个 block replace；
  // (c) 代码块不再产生每行的 line 装饰；(d) 光标进入时不替换、显示源码。
  const CODE_DOC = [
    'Some text before.',
    '',
    '```js',
    'const x = 1;',
    'console.log(x);',
    '```',
    '',
    'Some text after.',
  ].join('\n');

  function setupView(initialDoc: string, selection?: { anchor: number }) {
    const state = EditorState.create({
      doc: initialDoc,
      selection,
      extensions: [
        markdown({ base: markdownLanguage }),
        blockDecorationField,
        markdownDecorationPlugin,
      ],
    });
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    const view = new EditorView({ state, parent });
    forceParsing(view, view.state.doc.length, 1000);
    view.dispatch({ selection: view.state.selection });
    return { view, parent };
  }

  it('构造不抛错，且代码块以 block widget 渲染（field 包含 1 个 block replace）', () => {
    const { view, parent } = setupView(CODE_DOC);
    try {
      const set = view.state.field(blockDecorationField);
      // 文档只有一个代码块 → 期望恰好 1 个块替换。
      expect(set.size).toBe(1);
    } finally {
      view.destroy();
      parent.remove();
    }
  });

  it('ViewPlugin 不再为代码块每行产生 line 装饰（cm-md-codeblock-* 应不再命中）', () => {
    const { view, parent } = setupView(CODE_DOC);
    try {
      const viewDecos = view.plugin(markdownDecorationPlugin)!.decorations;
      const classes: string[] = [];
      viewDecos.between(0, view.state.doc.length, (_from, _to, value) => {
        const spec = (value as { spec?: { attributes?: { class?: string }; class?: string } }).spec;
        const cls = spec?.attributes?.class ?? spec?.class ?? '';
        if (cls) classes.push(cls);
      });
      // 代码块行的 cm-md-codeblock / -first / -last line 装饰不应再出现。
      expect(classes.some((c) => c.includes('cm-md-codeblock'))).toBe(false);
    } finally {
      view.destroy();
      parent.remove();
    }
  });

  it('光标进入代码块行时，该块不再替换（显示围栏源码）', () => {
    const idx = CODE_DOC.indexOf('const x');
    const { view, parent } = setupView(CODE_DOC, { anchor: idx + 2 });
    try {
      const set = view.state.field(blockDecorationField);
      expect(set.size).toBe(0);
    } finally {
      view.destroy();
      parent.remove();
    }
  });
});
