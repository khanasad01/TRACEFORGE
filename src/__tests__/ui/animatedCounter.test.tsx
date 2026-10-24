import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { AnimatedCounter } from '../../components/AnimatedCounter';

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'matchMedia');
});

function mockMatchMedia(matches: boolean) {
  const mq = (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  });
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: mq });
}

describe('AnimatedCounter', () => {
  it('renders the initial value immediately', () => {
    render(<AnimatedCounter value={7} />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('shows the new value instantly when matchMedia is unavailable', () => {
    const { rerender } = render(<AnimatedCounter value={1} />);
    rerender(<AnimatedCounter value={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('shows the new value instantly with prefers-reduced-motion', () => {
    mockMatchMedia(true);
    const { rerender } = render(<AnimatedCounter value={1} />);
    rerender(<AnimatedCounter value={99} />);
    expect(screen.getByText('99')).toBeInTheDocument();
  });

  it('animates and ends at exactly the real value', async () => {
    mockMatchMedia(false);
    const { rerender } = render(<AnimatedCounter value={0} durationMs={40} />);
    rerender(<AnimatedCounter value={25} durationMs={40} />);
    await waitFor(() => expect(screen.getByText('25')).toBeInTheDocument(), { timeout: 2000 });
  });

  it('applies the format prop', () => {
    render(<AnimatedCounter value={5} format={(n) => `${n} ops`} />);
    expect(screen.getByText('5 ops')).toBeInTheDocument();
  });
});
