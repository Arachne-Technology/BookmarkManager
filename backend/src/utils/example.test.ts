import { describe, expect, it } from 'vitest';

describe('Example Test Suite', () => {
  it('should pass basic test', () => {
    expect(2 + 2).toBe(4);
  });

  it('should handle string operations', () => {
    const result = 'hello world';
    expect(result).toContain('world');
  });
});
