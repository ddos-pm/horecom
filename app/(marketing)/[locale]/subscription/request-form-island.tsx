import { createClient } from "@/lib/supabase/server";
import { SubscriptionRequestForm } from "./request-form";
import type { PickerProduct } from "@/components/product-picker";

/**
 * Suspense-streamed island for the subscription request form.
 *
 * Owns the cookies / auth check so the parent page can stay fully
 * cacheable under `export const revalidate = 300`. The fallback below
 * shows a stable skeleton while this island streams in — most users
 * never notice the gap because the static lede + chart + comparison
 * block is already painted by then.
 */
export async function RequestFormIsland({
  products,
  initialProductIds,
}: {
  products: PickerProduct[];
  initialProductIds: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <SubscriptionRequestForm
      products={products}
      isAuthed={!!user}
      initialProductIds={initialProductIds}
    />
  );
}

export function RequestFormSkeleton() {
  return (
    <div
      className="rounded-lg border border-border bg-card p-5"
      style={{ minHeight: 420 }}
      aria-busy="true"
    >
      <div style={{ height: 20, width: 180, background: "var(--c-bg-muted)", borderRadius: 6, marginBottom: 12 }} />
      <div style={{ height: 14, width: "70%", background: "var(--c-bg-muted)", borderRadius: 4, marginBottom: 24 }} />
      <div style={{ height: 44, background: "var(--c-bg-muted)", borderRadius: 8, marginBottom: 12 }} />
      <div style={{ height: 44, background: "var(--c-bg-muted)", borderRadius: 8, marginBottom: 12 }} />
      <div style={{ height: 44, background: "var(--c-bg-muted)", borderRadius: 8 }} />
    </div>
  );
}
