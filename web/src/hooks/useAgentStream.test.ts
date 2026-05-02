import { renderHook, act } from '@testing-library/react';
import { useAgentStream } from './useAgentStream';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useAgentStream Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('initializes with idle state', () => {
    const { result } = renderHook(() => useAgentStream());
    expect(result.current.status).toBe('idle');
    expect(result.current.output).toBe('');
  });

  it('handles successful streaming', async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"content": "Hello", "agent": "TestAgent"}\n'));
        controller.enqueue(new TextEncoder().encode('data: {"content": " World"}\n'));
        controller.close();
      }
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: mockStream
    }));

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.submit('test', 'IN', 'rumor_guard');
    });

    expect(result.current.output).toBe('Hello World');
    expect(result.current.activeAgent).toBe('TestAgent');
    expect(result.current.status).toBe('done');
  });

  it('handles translation events', async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"event": "translated_done", "content": "Translated Content"}\n'));
        controller.close();
      }
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: mockStream
    }));

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.submit('test', 'IN', 'rumor_guard');
    });

    expect(result.current.output).toBe('Translated Content');
  });

  it('handles fetch errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500
    }));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.submit('test', 'IN', 'rumor_guard');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.output).toContain('[Server error: The agent pipeline');
    consoleSpy.mockRestore();
  });

  it('handles abort correctly', async () => {
    // Mock a slow fetch
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));

    const { result } = renderHook(() => useAgentStream());
    
    act(() => {
      result.current.submit('test', 'IN', 'rumor_guard');
    });

    expect(result.current.status).toBe('loading');

    await act(async () => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.output).toBe('');
  });

  it('handles empty response body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body: null }));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useAgentStream());
    await act(async () => {
      await result.current.submit('test', 'IN', 'rumor_guard');
    });
    expect(result.current.status).toBe('error');
    expect(result.current.output).toContain('[Connection error: Please check your internet');
    consoleSpy.mockRestore();
  });

  it('handles AbortError silently', async () => {
    const abortError = new Error('Abort');
    abortError.name = 'AbortError';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));
    const { result } = renderHook(() => useAgentStream());
    await act(async () => {
      await result.current.submit('test', 'IN', 'rumor_guard');
    });
    expect(result.current.status).toBe('idle');
  });

  it('ignores malformed SSE lines', async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('not-data-line\n'));
        controller.enqueue(new TextEncoder().encode('data: {"content": "ok"}\n'));
        controller.close();
      }
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body: mockStream }));
    const { result } = renderHook(() => useAgentStream());
    await act(async () => {
      await result.current.submit('test', 'IN', 'rumor_guard');
    });
    expect(result.current.output).toBe('ok');
  });
  it('handles agent updates without content', async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"agent": "NewAgent"}\n'));
        controller.close();
      }
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body: mockStream }));
    const { result } = renderHook(() => useAgentStream());
    await act(async () => {
      await result.current.submit('test', 'IN', 'rumor_guard');
    });
    expect(result.current.activeAgent).toBe('NewAgent');
    expect(result.current.output).toBe('');
  });

  it('logs warning on invalid JSON in SSE', async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {invalid-json}\n'));
        controller.enqueue(new TextEncoder().encode('data: {"content": "recovered"}\n'));
        controller.close();
      }
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body: mockStream }));
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useAgentStream());
    await act(async () => {
      await result.current.submit('test', 'IN', 'rumor_guard');
    });
    expect(consoleSpy).toHaveBeenCalled();
    expect(result.current.output).toBe('recovered');
    consoleSpy.mockRestore();
  });
});
