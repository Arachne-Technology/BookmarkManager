import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders loading spinner', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has spinning animation class', () => {
    render(<LoadingSpinner />);
    const loader = screen.getByRole('status').querySelector('svg');
    expect(loader).toHaveClass('animate-spin');
  });
});
