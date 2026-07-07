import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import {
  EditorView,
  keymap,
  placeholder as cmPlaceholder,
  drawSelection,
  dropCursor,
  highlightActiveLine,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import {
  markdownDecorationPlugin,
  blockDecorationField,
} from './wysiwyg/markdownDecorations';
import { markdownTheme } from './wysiwyg/theme';
import {
  runEditorCommand,
  toggleBold,
  toggleItalic,
  insertLink,
} from './wysiwyg/editorCommands';

export interface WYSIWYGEditorHandle {
  execCommand: (cmd: string, value?: string) => void;
  focus: () => void;
  scrollToHeading: (index: number) => void;
}

interface WYSIWYGEditorProps {
  value: string;
  onChange: (value: string) => void;
  theme: 'light' | 'dark';
  placeholder?: string;
}

export const WYSIWYGEditor = forwardRef<WYSIWYGEditorHandle, WYSIWYGEditorProps>(
  function WYSIWYGEditor({ value, onChange, theme, placeholder }, ref) {
    const hostRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const onChangeRef = useRef(onChange);
    const themeCompartment = useRef(new Compartment());
    // 标记「文档变化来自外部 value 同步」，避免把外部同步又当作用户输入回传。
    const applyingExternal = useRef(false);
    // 用 ref 持有最新 props，供只挂载一次的 effect 读取初始值。
    const valueRef = useRef(value);
    const themeRef = useRef(theme);
    const placeholderRef = useRef(placeholder);
    valueRef.current = value;
    themeRef.current = theme;
    placeholderRef.current = placeholder;

    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    // 仅在挂载时创建一次 EditorView。
    useEffect(() => {
      const host = hostRef.current;
      if (!host) return;

      const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged && !applyingExternal.current) {
          onChangeRef.current(update.state.doc.toString());
        }
      });

      // 快捷键：Ctrl/Cmd+B 加粗、+I 斜体、+K 链接。复用命令逻辑。
      const shortcutKeymap = keymap.of([
        {
          key: 'Mod-b',
          run: (v) => {
            toggleBold(v);
            return true;
          },
        },
        {
          key: 'Mod-i',
          run: (v) => {
            toggleItalic(v);
            return true;
          },
        },
        {
          key: 'Mod-k',
          run: (v) => {
            const url = window.prompt('链接地址:');
            if (url) insertLink(v, url);
            return true;
          },
        },
      ]);

      const state = EditorState.create({
        doc: valueRef.current,
        extensions: [
          history(),
          drawSelection(),
          dropCursor(),
          highlightActiveLine(),
          EditorState.allowMultipleSelections.of(false),
          markdown({ base: markdownLanguage }),
          // block 级装饰（表格 / HTML 块）经 StateField 提供；inline/line 经 ViewPlugin。
          blockDecorationField,
          markdownDecorationPlugin,
          shortcutKeymap,
          keymap.of([...defaultKeymap, ...historyKeymap]),
          cmPlaceholder(placeholderRef.current || '开始编写 Markdown...'),
          EditorView.lineWrapping,
          updateListener,
          themeCompartment.current.of(markdownTheme(themeRef.current === 'dark')),
        ],
      });

      const view = new EditorView({ state, parent: host });
      viewRef.current = view;

      return () => {
        view.destroy();
        viewRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 受控同步：外部 value 变化且与当前文档不同才替换，避免回环重置光标。
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      const current = view.state.doc.toString();
      if (value === current) return;
      applyingExternal.current = true;
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
      applyingExternal.current = false;
    }, [value]);

    // 主题切换：通过 compartment 热替换主题扩展，无需重建编辑器。
    useEffect(() => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({
        effects: themeCompartment.current.reconfigure(
          markdownTheme(theme === 'dark')
        ),
      });
    }, [theme]);

    useImperativeHandle(ref, () => ({
      execCommand(cmd: string, val?: string) {
        const view = viewRef.current;
        if (!view) return;
        runEditorCommand(view, cmd, val);
      },
      focus() {
        viewRef.current?.focus();
      },
      scrollToHeading(index: number) {
        const view = viewRef.current;
        if (!view) return;
        // 扫描所有 ATX 标题行，取第 index 个（与 OutlinePanel 顺序一致）。
        const text = view.state.doc.toString();
        const regex = /^(#{1,6})\s+.+$/gm;
        let match: RegExpExecArray | null;
        let i = 0;
        let target = -1;
        while ((match = regex.exec(text)) !== null) {
          if (i === index) {
            target = match.index;
            break;
          }
          i++;
        }
        if (target < 0) return;
        const line = view.state.doc.lineAt(target);
        view.dispatch({
          effects: EditorView.scrollIntoView(line.from, { y: 'start' }),
        });
        view.focus();
      },
    }));

    return <div ref={hostRef} className="wysiwyg-cm-host" style={{ height: '100%', width: '100%' }} />;
  }
);
