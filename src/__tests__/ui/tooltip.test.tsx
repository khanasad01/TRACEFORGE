import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip } from '../../components/Tooltip';

afterEach(cleanup);

function setup(onClick = vi.fn()) {
  render(
    <Tooltip label="Runs the selected algorithm">
      <button onClick={onClick}>Run</button>
    </Tooltip>,
  );
  return { button: screen.getByRole('button', { name: 'Run' }), onClick };
}

describe('Tooltip', () => {
  it('is closed by default', () => {
    const { button } = setup();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(button).not.toHaveAttribute('aria-describedby');
  });

  it('opens on hover and closes on mouse leave', async () => {
    const user = userEvent.setup();
    const { button } = setup();
    await user.hover(button);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Runs the selected algorithm');
    await user.unhover(button);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('opens on keyboard focus and links via aria-describedby', async () => {
    const user = userEvent.setup();
    const { button } = setup();
    await user.tab();
    expect(button).toHaveFocus();
    const tip = screen.getByRole('tooltip');
    expect(button.getAttribute('aria-describedby')).toBe(tip.id);
  });

  it('closes on Escape and keeps focus on the trigger', async () => {
    const user = userEvent.setup();
    const { button } = setup();
    await user.tab();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(button).not.toHaveAttribute('aria-describedby');
    expect(button).toHaveFocus();
  });

  it('closes on blur', async () => {
    const user = userEvent.setup();
    setup();
    await user.tab();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    await user.tab();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('does not overwrite the child onClick', async () => {
    const user = userEvent.setup();
    const { button, onClick } = setup();
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('merges an existing aria-describedby on the child', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip label="Hint">
        <button aria-describedby="existing">Go</button>
      </Tooltip>,
    );
    await user.tab();
    const tip = screen.getByRole('tooltip');
    expect(screen.getByRole('button', { name: 'Go' }).getAttribute('aria-describedby')).toBe(
      `existing ${tip.id}`,
    );
  });

  it('supports the placement prop (defaults to top)', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip label="Below" placement="bottom">
        <button>Down</button>
      </Tooltip>,
    );
    await user.tab();
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-placement', 'bottom');
  });

  it('uses an explicit id when provided', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip label="Custom id" id="my-tip">
        <button>Id</button>
      </Tooltip>,
    );
    await user.tab();
    expect(screen.getByRole('tooltip').id).toBe('my-tip');
    expect(screen.getByRole('button', { name: 'Id' })).toHaveAttribute('aria-describedby', 'my-tip');
  });
});
