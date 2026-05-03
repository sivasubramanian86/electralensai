import { useState, useCallback } from 'react';
import { API_BASE } from '../constants';

export interface MultimediaContent {
  infographic_url: string;
  audio_url: string;
  video_url: string;
  topic: string;
}

export interface UseMultimediaResult {
  generateContent: (topic: string, language?: string) => Promise<void>;
  content: MultimediaContent | null;
  loading: boolean;
  error: string | null;
}

export const useMultimedia = (): UseMultimediaResult => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<MultimediaContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`${API_BASE}/v1/multimedia/jobs/${jobId}`);
      if (!response.ok) throw new Error('Polling failed');
      
      const data = await response.json();
      if (data.status === 'completed') {
        setContent(data.result);
        setLoading(false);
      } else if (data.status === 'failed') {
        throw new Error(data.error || 'Job failed');
      } else {
        // Continue polling
        setTimeout(() => pollJobStatus(jobId), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Polling error');
      setLoading(false);
    }
  }, []);

  const generateContent = useCallback(async (topic: string, language: string = 'en') => {
    setLoading(true);
    setError(null);
    setContent(null);
    try {
      const response = await fetch(`${API_BASE}/v1/multimedia/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, language }),
      });

      if (!response.ok) throw new Error('Failed to start generation job');

      const { job_id } = await response.json();
      pollJobStatus(job_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setLoading(false);
    }
  }, [pollJobStatus]);

  return { generateContent, content, loading, error };
};
