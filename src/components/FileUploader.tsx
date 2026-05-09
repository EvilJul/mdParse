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
    <div className="max-w-3xl mx-auto">
      <div
        className={`
          relative rounded-3xl border-2 border-dashed p-16 text-center cursor-pointer
          transition-all duration-300 transform
          ${isDragging 
            ? (isDark 
              ? 'border-emerald-500 bg-gradient-to-br from-emerald-900/30 to-teal-900/30 scale-105 shadow-2xl shadow-emerald-500/20' 
              : 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 scale-105 shadow-2xl shadow-emerald-500/20')
            : (isDark 
              ? 'border-gray-600 hover:border-gray-500 bg-gray-800/50 hover:bg-gray-800 hover:shadow-xl' 
              : 'border-gray-300 hover:border-gray-400 bg-white hover:shadow-xl')
          }
          ${error ? (isDark ? 'border-red-500/50 bg-red-900/10' : 'border-red-400/50 bg-red-50/50') : ''}
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
          {/* Animated Icon */}
          <div className={`
            w-24 h-24 rounded-3xl flex items-center justify-center mb-6
            transition-all duration-300 transform
            ${isDragging 
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl scale-110 rotate-6' 
              : (isDark 
                ? 'bg-gradient-to-br from-gray-700 to-gray-600 shadow-lg hover:scale-110 hover:rotate-3' 
                : 'bg-gradient-to-br from-gray-100 to-gray-200 shadow-md hover:scale-110 hover:rotate-3')
            }
          `}>
            <svg 
              className={`w-12 h-12 transition-colors duration-300 ${
                isDragging 
                  ? 'text-white' 
                  : (isDark ? 'text-gray-400' : 'text-gray-500')
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isDragging ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              )}
            </svg>
          </div>

          {/* Title */}
          <h3 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
            isDragging 
              ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
              : (isDark ? 'text-gray-200' : 'text-gray-800')
          }`}>
            {isDragging ? '🎉 释放以上传文件' : '拖拽 Markdown 文件到此处'}
          </h3>

          {/* Subtitle */}
          <p className={`text-base mb-6 transition-colors duration-300 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            或点击选择文件
          </p>

          {/* Features */}
          <div className="flex items-center gap-4 mb-6">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
              isDark ? 'bg-gray-700/50' : 'bg-gray-100'
            }`}>
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                .md 格式
              </span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
              isDark ? 'bg-gray-700/50' : 'bg-gray-100'
            }`}>
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                最大 5MB
              </span>
            </div>
          </div>

          {/* CTA Button */}
          <button className={`
            px-8 py-3 rounded-xl font-semibold text-white
            bg-gradient-to-r from-emerald-500 to-teal-600
            hover:from-emerald-600 hover:to-teal-700
            hover:shadow-lg hover:scale-105
            active:scale-95
            transition-all duration-200
          `}>
            选择文件
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`
            mt-6 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
            ${isDark ? 'bg-red-900/30 border border-red-500/50' : 'bg-red-50 border border-red-200'}
          `}>
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              {error}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}