import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { AnimatedCounter } from '../../components/AnimatedCounter';

beforeEach(() => cleanup());

function mockMatchMedia(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: reduce,
    media: q,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('AnimatedCounter', () => {
  it('renders the initial value immediately', () => {
    render(<AnimatedCounter value={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });
  it('renders 0 immediately', () => {
    render(<AnimatedCounter value={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
  it('ends at the exact new value', async () => {
    const { container, rerender } = render(<AnimatedCounter value={0} />);
    rerender(<AnimatedCounter value={50} />);
    await waitFor(() => {
      expect(container.querySelector('span')?.textContent).toBe('50');
    });
  });
  it('applies the format prop', () => {
    render(<AnimatedCounter value={7} format={(n) => `count:${n}`} />);
    expect(screen.getByText('count:7')).toBeInTheDocument();
  });
  it('shows new value instantly when reduced motion enabled', () => {
    mockMatchMedia(true);
    const { container, rerender } = render(<AnimatedCounter value={5} />);
    rerender(<AnimatedCounter value={99} />);
    expect(container.querySelector('span')?.textContent).toBe('99');
  });
  it('shows new value instantly when matchMedia unavailable', () => {
    const original = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', { value: undefined, configurable: true });
    const { container, rerender } = render(<AnimatedCounter value={10} />);
    rerender(<AnimatedCounter value={250} />);
    expect(container.querySelector('span')?.textContent).toBe('250');
    Object.defineProperty(window, 'matchMedia', { value: original, configurable: true });
  });
});
