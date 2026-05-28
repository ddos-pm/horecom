import { createClient } from "@/lib/supabase/server";
import { GroupBuyWaitlistForm } from "./waitlist-form";
import type { PickerProduct } from "@/components/product-picker";

/**
 * Suspense-streamed island for the group-buying waitlist form.
 *
 * Same shape as RequestFormIsland on /subscription — auth cookies stay
 * in this child so the parent page can be fully ISR'd.
 */
export async function WaitlistIsland({
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
    <GroupBuyWaitlistForm
      products={products}
      defaultEmail={user?.email ?? null}
      initialProductIds={initialProductIds}
    />
  );
}

export function WaitlistSkeleton() {
  return (
    <div
      className="rounded-lg border border-border bg-card p-5"
      style={{ minHeight: 360 }}
      aria-busy="true"
    >
      <div style={{ height: 20, width: 160, background: "var(--c-bg-muted)", borderRadius: 6, marginBottom: 12 }} />
      <div style={{ height: 14, width: "75%", background: "var(--c-bg-muted)", borderRadius: 4, marginBottom: 24 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={{ height: 44, background: "var(--c-bg-muted)", borderRadius: 8 }} />
        <div style={{ height: 44, background: "var(--c-bg-muted)", borderRadius: 8 }} />
      </div>
      <div style={{ height: 44, background: "var(--c-bg-muted)", borderRadius: 8 }} />
    </div>
  );
}
