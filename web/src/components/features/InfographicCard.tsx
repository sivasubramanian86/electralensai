/**
 * InfographicCard — Renders a Nano Banana Imagen-generated infographic.
 *
 * Uses the useInfographic hook to:
 *   1. Check GCS cache for an existing image (instant load)
 *   2. Trigger generation via the backend Imagen API if cache miss
 *   3. Display with loading shimmer, cache badge, and fallback state
 *
 * Usage:
 *   <InfographicCard concept="election-phases" />
 *   <InfographicCard concept="polling-day" style="diagram" showBrief />
 */

import { ImageIcon, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { useInfographic, type ImagenStyle } from '../../lib/imagenService';
import type { ConceptSlug } from '../../lib/gcpStorage';

// ─── Props ────────────────────────────────────────────────────────────────────

interface InfographicCardProps {
  concept: ConceptSlug;
  style?: ImagenStyle;
  /** Show the generation prompt brief beneath the image */
  showBrief?: boolean;
  /** Override image height (default: h-64) */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InfographicCard({
  concept,
  style = 'infographic',
  showBrief = false,
  className = '',
}: InfographicCardProps) {
  const { url, altText, loading, fromCache, error } = useInfographic(concept, style);

  // ─── Loading shimmer ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`glass rounded-2xl border border-white/10 overflow-hidden ${className}`}>
        <div className="h-64 bg-white/5 animate-pulse flex flex-col items-center justify-center gap-3 text-slate-600">
          <RefreshCw className="w-8 h-8 animate-spin opacity-40" />
          <p className="text-xs font-medium uppercase tracking-widest opacity-40">Generating Infographic...</p>
          <p className="text-[10px] opacity-20">Nano Banana Imagen • GCS Cache Check</p>
        </div>
      </div>
    );
  }

  // ─── Error / fallback ──────────────────────────────────────────────────────
  if (error || !url) {
    return (
      <div className={`glass rounded-2xl border border-white/10 overflow-hidden ${className}`}>
        <div className="h-64 bg-white/3 flex flex-col items-center justify-center gap-3 text-slate-600 border-2 border-dashed border-white/5">
          <ImageIcon className="w-10 h-10 opacity-20" />
          <div className="text-center space-y-1 px-4">
            <p className="text-xs font-bold text-slate-500">Infographic Unavailable</p>
            <p className="text-[10px] text-slate-600 max-w-xs mx-auto">
              {error
                ? 'Backend Imagen API unreachable. Start the local FastAPI server.'
                : 'Image not yet generated. The backend will generate it on next request.'}
            </p>
          </div>
          {/* Show the image brief so developer can verify the prompt */}
          <div className="mx-4 p-2 rounded-lg bg-white/3 border border-white/5">
            <p className="text-[9px] font-mono text-slate-700 line-clamp-2">
              Brief: {altText}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Success state ─────────────────────────────────────────────────────────
  return (
    <div className={`glass rounded-2xl border border-white/10 overflow-hidden group ${className}`}>
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={url}
          alt={altText}
          className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
        {/* Cache badge */}
        <div className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold backdrop-blur-sm border ${
          fromCache
            ? 'bg-emerald-900/80 border-emerald-500/30 text-emerald-400'
            : 'bg-violet-900/80 border-violet-500/30 text-violet-400'
        }`}>
          {fromCache ? (
            <><CheckCircle2 className="w-2.5 h-2.5" /> GCS Cache</>
          ) : (
            <><Sparkles className="w-2.5 h-2.5" /> Imagen Generated</>
          )}
        </div>
      </div>

      {/* Alt text as caption */}
      <div className="p-3 border-t border-white/5">
        <p className="text-[10px] text-slate-500 leading-relaxed">{altText}</p>
        {showBrief && (
          <p className="text-[9px] font-mono text-slate-700 mt-1 line-clamp-2">
            Prompt: {useInfographic.length > 0 ? altText : ''}
          </p>
        )}
      </div>
    </div>
  );
}
