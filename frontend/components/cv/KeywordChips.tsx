'use client';

interface KeywordChipsProps {
  keywordAnalysis: any;
}

export default function KeywordChips({ keywordAnalysis }: KeywordChipsProps) {
  if (!keywordAnalysis) return null;

  const { keyword_match_percentage, present_exact_match, critical_missing, present_wrong_phrasing } = keywordAnalysis;

  return (
    <div className="space-y-4">
      {/* Match percentage header */}
      {keyword_match_percentage != null && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground/80">Keyword Match</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            keyword_match_percentage >= 70
              ? 'bg-violet-500/15 text-violet-300'
              : keyword_match_percentage >= 50
                ? 'bg-amber-500/15 text-amber-400'
                : 'bg-red-500/15 text-red-400'
          }`}>
            {keyword_match_percentage}%
          </span>
        </div>
      )}

      {/* Matched keywords */}
      {present_exact_match?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-violet-400 uppercase tracking-wider mb-2">Matched</p>
          <div className="flex flex-wrap gap-1.5">
            {present_exact_match.map((kw: string, i: number) => (
              <span key={i} className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 text-xs text-violet-300">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing keywords */}
      {critical_missing?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-red-400 uppercase tracking-wider mb-2">Missing</p>
          <div className="flex flex-wrap gap-1.5">
            {critical_missing.map((kw: string, i: number) => (
              <span key={i} className="rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-xs text-red-400">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Wrong phrasing */}
      {present_wrong_phrasing?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-2">Wrong Phrasing</p>
          <div className="flex flex-wrap gap-1.5">
            {present_wrong_phrasing.map((kw: any, i: number) => (
              <span key={i} className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs text-amber-400">
                {typeof kw === 'string' ? kw : `${kw.cv_phrase} → ${kw.jd_phrase}`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
