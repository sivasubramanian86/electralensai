import { describe, it, expect, vi } from 'vitest';

describe('Constants', () => {
  it('API_BASE should be defined', async () => {
    const { API_BASE } = await import('./constants');
    expect(API_BASE).toBeDefined();
  });

  it('API_BASE should use VITE_API_URL if provided', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_API_URL', 'https://api.example.com');
    const { API_BASE } = await import('./constants');
    expect(API_BASE).toBe('https://api.example.com');
  });

  it('API_BASE should fallback to localhost if env is missing', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_API_URL', undefined as unknown as string);
    const { API_BASE } = await import('./constants');
    expect(API_BASE).toBe('http://localhost:8082');
  });
});
