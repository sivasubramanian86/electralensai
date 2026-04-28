/**
 * ElectraLensAI — Nano Banana Imagen client service.
 *
 * Orchestrates the generate-then-cache pattern for infographic generation:
 *   1. Check GCS for existing image (cache hit → return URL immediately)
 *   2. Call backend /v1/imagen/generate endpoint (wraps Vertex AI Imagen 3)
 *   3. Upload result Blob to Firebase Storage via gcpStorage.uploadImageBlob()
 *   4. Return the GCS download URL for frontend rendering
 *
 * Backend endpoint: POST /v1/imagen/generate
 * Request:  { concept: ConceptSlug, prompt: string, style?: string }
 * Response: { imageUrl?: string, gcsPath?: string, error?: string }
 *           OR a raw image/png stream (Content-Type: image/png)
 */

import { getImageUrl, uploadImageBlob, CONCEPT_IMAGE_MAP, type ConceptSlug } from './gcpStorage';
import { API_BASE } from '../constants';

// ─── Config ───────────────────────────────────────────────────────────────────

const IMAGEN_ENDPOINT = `${API_BASE}/v1/imagen/generate`;

// ─── Types ────────────────────────────────────────────────────────────────────

export type ImagenStyle = 'infographic' | 'comic' | 'diagram' | 'map' | 'chart';

export interface ImagenRequest {
  concept: ConceptSlug;
  style?: ImagenStyle;
  /** Override the canonical brief — use only for one-off custom visuals. */
  customPrompt?: string;
}

export interface ImagenResult {
  url: string;
  fromCache: boolean;
  concept: ConceptSlug;
  altText: string;
}

// ─── Core Service ─────────────────────────────────────────────────────────────

/**
 * Resolves an infographic URL for the given concept.
 *
 * Cache-first strategy:
 *   - GCS hit  → returns immediately (no Imagen API call)
 *   - GCS miss → generates via Imagen backend → uploads → returns URL
 *
 * @param request - The concept slug and optional style override
 * @returns       Image URL + metadata, or throws on unrecoverable error
 */
export async function resolveInfographic(request: ImagenRequest): Promise<ImagenResult> {
  const { concept, style = 'infographic', customPrompt } = request;
  const meta = CONCEPT_IMAGE_MAP[concept];

  // ─── 1. Cache check ────────────────────────────────────────────────────────
  const cachedUrl = await getImageUrl(concept);
  if (cachedUrl) {
    return {
      url: cachedUrl,
      fromCache: true,
      concept,
      altText: meta.altText,
    };
  }

  // ─── 2. Generate via Imagen backend ────────────────────────────────────────
  const prompt = customPrompt ?? meta.imageBrief;

  const response = await fetch(IMAGEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ concept, prompt, style }),
  });

  if (!response.ok) {
    throw new Error(`Imagen API error ${response.status}: ${await response.text()}`);
  }

  // ─── 3. Handle response (JSON URL or raw PNG stream) ──────────────────────
  const contentType = response.headers.get('content-type') ?? '';

  let downloadUrl: string;

  if (contentType.includes('application/json')) {
    // Backend pre-uploaded to GCS and returned a URL
    const json = (await response.json()) as { imageUrl?: string; gcsPath?: string };
    downloadUrl = json.imageUrl ?? '';
    if (!downloadUrl) throw new Error('Imagen API returned no image URL');
  } else if (contentType.includes('image/')) {
    // Backend streamed raw image bytes — we upload to GCS ourselves
    const blob = await response.blob();
    downloadUrl = await uploadImageBlob(concept, blob);
  } else {
    throw new Error(`Unexpected Imagen API content-type: ${contentType}`);
  }

  return {
    url: downloadUrl,
    fromCache: false,
    concept,
    altText: meta.altText,
  };
}

// ─── React Hook ───────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';

export interface UseInfographicResult {
  url: string | null;
  altText: string;
  loading: boolean;
  fromCache: boolean;
  error: string | null;
}

/**
 * React hook that resolves an infographic URL for a concept slug.
 * Handles loading, cache-hit indication, and error states.
 *
 * Usage:
 *   const { url, altText, loading, fromCache } = useInfographic('election-phases');
 */
export function useInfographic(concept: ConceptSlug, style?: ImagenStyle): UseInfographicResult {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = CONCEPT_IMAGE_MAP[concept];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    resolveInfographic({ concept, style })
      .then((result) => {
        if (cancelled) return;
        setUrl(result.url);
        setFromCache(result.fromCache);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [concept, style]);

  return { url, altText: meta.altText, loading, fromCache, error };
}
