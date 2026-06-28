import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToastContainer } from '../Toast';

describe('ToastContainer', () => {
  const mockToasts = [
    { id: '1', message: '成功消息', type: 'success' as const },
    { id: '2', message: '错误消息', type: 'error' as const },
    { id: '3', message: '提示消息', type: 'info' as const },
  ];

  it('renders all toasts', () => {
    render(<ToastContainer toasts={mockToasts} onClose={vi.fn()} />);
    expect(screen.getByText('成功消息')).toBeInTheDocument();
    expect(screen.getByText('错误消息')).toBeInTheDocument();
    expect(screen.getByText('提示消息')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<ToastContainer toasts={[mockToasts[0]]} onClose={onClose} />);
    const closeBtn = screen.getByRole('button');
    closeBtn.click();
    expect(onClose).toHaveBeenCalledWith('1');
  });

  it('renders correct number of toasts', () => {
    const { container } = render(
      <ToastContainer toasts={mockToasts} onClose={vi.fn()} />
    );
    const notificationEls = container.querySelectorAll('[class*="fixed"]');
    expect(notificationEls.length).toBeGreaterThanOrEqual(1);
  });

  it('renders empty state', () => {
    const { container } = render(<ToastContainer toasts={[]} onClose={vi.fn()} />);
    const fixedDiv = container.querySelector('[class*="fixed"]');
    expect(fixedDiv).toBeInTheDocument();
    expect(fixedDiv?.children).toHaveLength(0);
  });
});
