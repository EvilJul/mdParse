import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { FileProvider, useFileContext } from '../FileContext';

describe('FileContext', () => {
  it('starts with empty files', () => {
    const { result } = renderHook(() => useFileContext(), {
      wrapper: FileProvider,
    });
    expect(result.current.files).toHaveLength(0);
    expect(result.current.activeFileId).toBeNull();
    expect(result.current.folderPath).toBeNull();
    expect(result.current.currentTab).toBe('editor');
  });

  it('adds a file', () => {
    const { result } = renderHook(() => useFileContext(), {
      wrapper: FileProvider,
    });

    act(() => result.current.addFile({
      id: '1',
      name: 'test.md',
      content: '# Hello',
      isDirty: false,
    }));

    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0].name).toBe('test.md');
  });

  it('removes a file', () => {
    const { result } = renderHook(() => useFileContext(), {
      wrapper: FileProvider,
    });

    act(() => {
      result.current.addFile({ id: '1', name: 'a.md', content: '', isDirty: false });
      result.current.addFile({ id: '2', name: 'b.md', content: '', isDirty: false });
    });

    act(() => result.current.removeFile('1'));

    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0].id).toBe('2');
  });

  it('updates a file', () => {
    const { result } = renderHook(() => useFileContext(), {
      wrapper: FileProvider,
    });

    act(() => {
      result.current.addFile({ id: '1', name: 'old.md', content: '', isDirty: false });
    });

    act(() => result.current.updateFile('1', { name: 'new.md', isDirty: true }));

    expect(result.current.files[0].name).toBe('new.md');
    expect(result.current.files[0].isDirty).toBe(true);
  });

  it('sets active file', () => {
    const { result } = renderHook(() => useFileContext(), {
      wrapper: FileProvider,
    });

    act(() => {
      result.current.addFile({ id: '1', name: 'a.md', content: '', isDirty: false });
      result.current.addFile({ id: '2', name: 'b.md', content: '', isDirty: false });
    });

    act(() => result.current.setActiveFile('2'));

    expect(result.current.activeFileId).toBe('2');
  });

  it('sets current tab', () => {
    const { result } = renderHook(() => useFileContext(), {
      wrapper: FileProvider,
    });

    act(() => result.current.setCurrentTab('guide'));
    expect(result.current.currentTab).toBe('guide');
  });

  it('manages folder state', () => {
    const { result } = renderHook(() => useFileContext(), {
      wrapper: FileProvider,
    });

    act(() => result.current.setFolderPath('/test/path'));
    expect(result.current.folderPath).toBe('/test/path');

    act(() => result.current.setFolderFiles([{ name: 'f.md', path: '/test/path/f.md' }]));
    expect(result.current.folderFiles).toHaveLength(1);
    expect(result.current.folderFiles[0].name).toBe('f.md');
  });

  it('throws when used outside provider', () => {
    expect(() => renderHook(() => useFileContext())).toThrow(
      'useFileContext must be used within FileProvider'
    );
  });
});
