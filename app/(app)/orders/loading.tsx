export default function OrdersLoading() {
  return (
    <div className="container-tight py-6 md:py-10">
      <div className="mb-6 h-7 w-40 animate-pulse rounded bg-muted" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-card" />
        ))}
      </div>
    </div>
  );
}
