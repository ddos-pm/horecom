import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "./user-menu";

export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white">
      <div className="container-tight flex h-14 items-center justify-between gap-4">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <Image
            src="/logos/logo-header.png"
            alt="Horecom"
            width={120}
            height={64}
            className="h-7 w-auto"
            priority
          />
        </Link>

        <div className="flex items-center gap-1">
          <Link href="/cart" aria-label="Корзина">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </Link>
          <UserMenu email={user?.email ?? null} />
        </div>
      </div>
    </header>
  );
}
