import { useState, useRef, useCallback } from 'react';

interface FileUploaderProps {
  onFileLoaded: (content: string, fileName: string) => void;
  theme?: 'light' | 'dark';
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function FileUploader({ onFileLoaded, theme = 'light' }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';

  const handleFile = useCallback((file: File) => {
    setError(null);

    if (!file.name.endsWith('.md')) {
      setError('请选择 .md 文件');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('文件大小不能超过 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileLoaded(content, file.name);
    };
    reader.onerror = () => {
      setError('文件读取失败');
    };
    reader.readAsText(file);
  }, [onFileLoaded]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div
        className={`
          relative rounded-xl border-2 border-dashed p-10 text-center cursor-pointer
          transition-all duration-300
          ${isDragging 
            ? (isDark 
              ? 'border-emerald-500 bg-emerald-500/5 scale-[1.02]' 
              : 'border-emerald-400 bg-emerald-50/50 scale-[1.02]')
            : (isDark 
              ? 'border-gray-700/40 hover:border-gray-500/60 bg-gray-800/30 hover:bg-gray-800/50' 
              : 'border-gray-200/60 hover:border-gray-300/80 bg-white/50 hover:bg-white/80')
          }
          ${error ? (isDark ? 'border-red-500/50 bg-red-500/5' : 'border-red-400/50 bg-red-50') : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".md"
          className="hidden"
          onChange={handleInputChange}
        />

        <div className="flex flex-col items-center">
          <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center mb-4
            transition-all duration-300
            ${isDragging 
              ? 'bg-emerald-500 shadow-lg scale-110' 
              : (isDark 
                ? 'bg-gray-700/40 hover:bg-gray-700/60' 
                : 'bg-gray-100/80 hover:bg-gray-200/60')
            }
          `}>
            <svg 
              className={`w-8 h-8 transition-colors duration-300 ${
                isDragging 
                  ? 'text-white' 
                  : (isDark ? 'text-gray-500' : 'text-gray-400')
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isDragging ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              )}
            </svg>
          </div>

          <h3 className={`text-base font-semibold mb-1.5 transition-colors duration-300 ${
            isDragging 
              ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
              : (isDark ? 'text-gray-200' : 'text-gray-800')
          }`}>
            {isDragging ? '释放以上传文件' : '拖拽 Markdown 文件到此处'}
          </h3>

          <p className={`text-xs mb-5 transition-colors duration-300 ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>
            或点击选择文件
          </p>

          <div className="flex items-center gap-3 mb-5">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
              isDark ? 'bg-gray-700/40' : 'bg-gray-100/60'
            }`}>
              <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className={`text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                .md 格式
              </span>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
              isDark ? 'bg-gray-700/40' : 'bg-gray-100/60'
            }`}>
              <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className={`text-[11px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                最大 5MB
              </span>
            </div>
          </div>

          <button className={`
            px-5 py-2 rounded-lg font-medium text-xs text-white
            bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700
            transition-all duration-150
          `}>
            选择文件
          </button>
        </div>

        {error && (
          <div className={`
            mt-4 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
            ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}
          `}>
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
