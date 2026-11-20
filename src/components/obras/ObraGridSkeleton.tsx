/** Placeholder enquanto a lista de obras carrega (fallback do Suspense). */
export function ObraGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="obra-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="obra-skeleton" />
      ))}
    </div>
  );
}
