/**
 * ElectraLensAI — SSE streaming hook.
 * Connects to the /v1/query/stream endpoint and emits
 * tokens to the caller via a callback.
 */

import { useState, useCallback, useRef } from 'react';
import { API_BASE, type AgentMode } from '../constants';

export type StreamStatus = 'idle' | 'loading' | 'streaming' | 'done' | 'error';

export interface UseAgentStreamResult {
  output: string;
  status: StreamStatus;
  activeAgent: string;
  submit: (question: string, region: string, mode: AgentMode, language?: string) => void;
  reset: () => void;
}

/** Hook that streams agent responses via Server-Sent Events. */
export function useAgentStream(): UseAgentStreamResult {
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [activeAgent, setActiveAgent] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setOutput('');
    setStatus('idle');
    setActiveAgent('');
  }, []);

  const submit = useCallback(
    async (question: string, region: string, mode: AgentMode, language: string = 'en') => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setOutput('');
      setStatus('loading');
      setActiveAgent('ElectraLensOrchestrator');

      try {
        const res = await fetch(`${API_BASE}/v1/query/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, region, mode, language }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (!res.body) throw new Error('No response body');

        setStatus('streaming');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          
          // Keep the last partial line in the buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
            
            try {
              const data = JSON.parse(trimmedLine.slice(6)) as Record<string, unknown>;
              
              if (data.event === 'translated_done' && data.content) {
                setOutput(String(data.content));
              } else if (data.content) {
                setOutput((prev) => prev + String(data.content));
              }

              if (data.agent) {
                setActiveAgent(String(data.agent));
              }
            } catch (err) {
              console.warn('Failed to parse SSE data:', line, err);
            }
          }
        }
        setStatus('done');
      } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setStatus('idle');
        return;
      }
        console.error('Stream error:', err);
        setStatus('error');
        setOutput((prev) => prev + '\n\n[Connection error. Please try again.]');
      }
    },
    [],
  );

  return { output, status, activeAgent, submit, reset };
}
