export default function CatalogLoading() {
  return (
    <div className="container-tight py-6 md:py-8">
      <div className="mb-4 h-7 w-32 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 aspect-square animate-pulse rounded-md bg-muted" />
            <div className="mb-2 h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="mb-2 h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
