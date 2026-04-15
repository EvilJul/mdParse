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

  // Theme-aware styles
  const containerClass = isDragging
    ? (isDark ? 'border-teal-500 bg-teal-900/20' : 'border-teal-400 bg-teal-50')
    : (isDark ? 'border-gray-600 hover:border-gray-500 bg-gray-800' : 'border-gray-200 hover:border-gray-300 bg-white');
  const iconBg = isDragging
    ? (isDark ? 'bg-teal-900' : 'bg-teal-100')
    : (isDark ? 'bg-gray-700' : 'bg-gray-100');
  const iconColor = isDragging
    ? 'text-teal-400'
    : (isDark ? 'text-gray-500' : 'text-gray-400');
  const titleColor = isDark ? 'text-gray-200' : 'text-gray-700';
  const hintColor = isDark ? 'text-gray-500' : 'text-gray-400';
  const badgeClass = isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-500';
  const errorClass = 'text-red-400';

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className={`
          relative rounded-xl border-2 border-dashed p-12 text-center cursor-pointer
          transition-all duration-200
          ${containerClass}
          ${error ? (isDark ? 'border-red-800' : 'border-red-300') : ''}
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
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${iconBg}`}>
            <svg className={`w-8 h-8 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          <p className={`text-lg font-medium mb-2 ${titleColor}`}>
            {isDragging ? '释放以上传文件' : '拖拽 Markdown 文件到此处'}
          </p>
          <p className={`text-sm mb-5 ${hintColor}`}>或点击选择文件</p>

          <span className={`text-sm px-4 py-2 rounded-lg ${badgeClass}`}>
            支持 .md 格式，最大 5MB
          </span>
        </div>

        {error && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm">
            <span className={errorClass}>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}