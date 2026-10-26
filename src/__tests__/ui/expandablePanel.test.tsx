import { afterEach, describe, it, expect } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpandablePanel } from '../../components/ExpandablePanel';

afterEach(cleanup);

function setup(defaultOpen = true) {
  render(
    <ExpandablePanel title="Test Results" id="test-panel" defaultOpen={defaultOpen}>
      <p>Evidence</p>
    </ExpandablePanel>,
  );
}

describe('ExpandablePanel', () => {
  it('is open by default', () => {
    setup(true);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });


  it('is closed when defaultOpen is false', () => {
    setup(false);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });

  it('clicking toggle closes open panel', async () => {
    const user = userEvent.setup();
    setup(true);
    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });

  it('clicking toggle opens closed panel', async () => {
    const user = userEvent.setup();
    setup(false);
    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });
});
