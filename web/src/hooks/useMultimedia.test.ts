import { renderHook, act } from '@testing-library/react';
import { useMultimedia } from './useMultimedia';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useMultimedia Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('handles successful generation and polling', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ job_id: 'job_123' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'pending' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          status: 'completed', 
          result: { infographic_url: 'http://img.png', audio_url: 'http://aud.mp3', video_url: 'http://vid.mp4', topic: 'test' }
        })
      });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useMultimedia());

    await act(async () => {
      result.current.generateContent('test topic');
    });

    expect(result.current.loading).toBe(true);
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(result.current.content).not.toBeNull();
    expect(result.current.content?.infographic_url).toBe('http://img.png');
    expect(result.current.loading).toBe(false);
  });

  it('handles job failure', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ job_id: 'job_456' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'failed', error: 'Generation failed' })
      });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useMultimedia());

    await act(async () => {
      result.current.generateContent('test topic');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(result.current.error).toBe('Generation failed');
    expect(result.current.loading).toBe(false);
  });

  it('handles network error during generation start', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400
    }));

    const { result } = renderHook(() => useMultimedia());

    await act(async () => {
      result.current.generateContent('test topic');
    });

    expect(result.current.error).toBe('Failed to start generation job');
  });

  it('polls multiple times when pending', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ job_id: 'job_789' }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ status: 'pending' }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ status: 'pending' }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ status: 'pending' }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ status: 'completed', result: { infographic_url: 'ok' } }) });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useMultimedia());
    
    // Start generation
    await act(async () => { 
      await result.current.generateContent('test'); 
    });
    
    // 1st poll (pending)
    await act(async () => { 
      await vi.advanceTimersByTimeAsync(3000); 
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.content).toBeNull();
    
    // 2nd poll (pending)
    await act(async () => { 
      await vi.advanceTimersByTimeAsync(3000); 
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.content).toBeNull();

    // 3rd poll (completed)
    await act(async () => { 
      await vi.advanceTimersByTimeAsync(3000); 
    });
    expect(result.current.content?.infographic_url).toBe('ok');
    expect(result.current.loading).toBe(false);
  });

  it('handles non-Error objects in catch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('String Error'));
    const { result } = renderHook(() => useMultimedia());
    await act(async () => { result.current.generateContent('test'); });
    expect(result.current.error).toBe('An unknown error occurred');
  });

  it('handles polling failure', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ job_id: '123' }) })
      .mockResolvedValueOnce({ ok: false })
    );

    const { result } = renderHook(() => useMultimedia());
    await act(async () => { result.current.generateContent('test'); });
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });

    expect(result.current.error).toBe('Polling failed');
  });

  it('handles job failure without error message', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ job_id: '123' }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ status: 'failed' }) })
    );

    const { result } = renderHook(() => useMultimedia());
    await act(async () => { result.current.generateContent('test'); });
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });

    expect(result.current.error).toBe('Job failed');
  });

  it('handles non-Error objects in polling catch', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ job_id: '123' }) })
      .mockImplementationOnce(() => { throw 'String Error'; })
    );

    const { result } = renderHook(() => useMultimedia());
    await act(async () => { result.current.generateContent('test'); });
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });

    expect(result.current.error).toBe('Polling error');
  });
});
