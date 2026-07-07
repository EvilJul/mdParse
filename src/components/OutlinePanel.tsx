import { useMemo, useState, useCallback } from 'react';

interface HeadingItem {
  level: number;
  text: string;
  index: number;
}

interface TreeNode {
  item: HeadingItem;
  children: TreeNode[];
  collapsed: boolean;
}

function buildTree(headings: HeadingItem[]): TreeNode[] {
  const root: TreeNode[] = [];
  const stack: TreeNode[] = [];

  for (const item of headings) {
    const node: TreeNode = { item, children: [], collapsed: false };

    let parent: TreeNode | undefined;
    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      if (item.level > top.item.level) {
        parent = top;
        break;
      }
      stack.pop();
    }

    if (parent) {
      parent.children.push(node);
    } else {
      root.push(node);
    }

    stack.push(node);
  }

  return root;
}

interface OutlinePanelProps {
  content: string;
  theme: 'light' | 'dark';
  onScrollToHeading: (index: number) => void;
}

export function OutlinePanel({ content, theme, onScrollToHeading }: OutlinePanelProps) {
  const isDark = theme === 'dark';

  const headings = useMemo(() => {
    const items: HeadingItem[] = [];
    const regex = /^(#{1,6})\s+(.+)$/gm;
    let match: RegExpExecArray | null;
    let index = 0;
    while ((match = regex.exec(content)) !== null) {
      items.push({
        level: match[1].length,
        text: match[2].trim(),
        index: index++,
      });
    }
    return items;
  }, [content]);

  const tree = useMemo(() => buildTree(headings), [headings]);

  const [collapsedSet, setCollapsedSet] = useState<Set<number>>(new Set());

  const toggleCollapse = useCallback((index: number) => {
    setCollapsedSet(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  if (headings.length === 0) return null;

  return (
    <div
      className={`w-[220px] flex-shrink-0 border-l overflow-y-auto ${
        isDark ? 'border-border-dark bg-surface-dark' : 'border-border bg-surface'
      }`}
    >
      <div className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-wider ${
        isDark ? 'text-gray-500' : 'text-text-muted'
      }`}>
        大纲
      </div>
      <div className="px-1 pb-2 text-[13px]">
        <TreeNodeList
          nodes={tree}
          collapsedSet={collapsedSet}
          onToggle={toggleCollapse}
          onScrollToHeading={onScrollToHeading}
          isDark={isDark}
        />
      </div>
    </div>
  );
}

interface TreeNodeListProps {
  nodes: TreeNode[];
  collapsedSet: Set<number>;
  onToggle: (index: number) => void;
  onScrollToHeading: (index: number) => void;
  isDark: boolean;
  depth?: number;
}

function TreeNodeList({ nodes, collapsedSet, onToggle, onScrollToHeading, isDark, depth = 0 }: TreeNodeListProps) {
  return (
    <>
      {nodes.map(node => (
        <div key={node.item.index}>
          <div
            className={`flex items-center gap-0.5 cursor-pointer rounded-sm transition-colors ${
              isDark
                ? 'hover:bg-sidebar-item-dark text-gray-300'
                : 'hover:bg-sidebar text-text-secondary'
            }`}
            style={{ paddingLeft: `${8 + depth * 12}px` }}
          >
            {node.children.length > 0 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(node.item.index);
                }}
                className={`flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-sm transition-colors ${
                  isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                }`}
              >
                <svg
                  className={`w-2.5 h-2.5 transition-transform ${collapsedSet.has(node.item.index) ? '' : 'rotate-90'}`}
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M6 4l4 4-4 4" />
                </svg>
              </button>
            ) : (
              <span className="flex-shrink-0 w-4 h-4" />
            )}

            <button
              onClick={() => onScrollToHeading(node.item.index)}
              className={`flex-1 text-left truncate py-1 ${
                node.item.level <= 2 ? 'font-medium' : ''
              }`}
              title={node.item.text}
            >
              {node.item.text}
            </button>
          </div>

          {node.children.length > 0 && !collapsedSet.has(node.item.index) && (
            <TreeNodeList
              nodes={node.children}
              collapsedSet={collapsedSet}
              onToggle={onToggle}
              onScrollToHeading={onScrollToHeading}
              isDark={isDark}
              depth={depth + 1}
            />
          )}
        </div>
      ))}
    </>
  );
}
