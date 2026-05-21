"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function UserMenu({ email }: { email: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signing, setSigning] = useState(false);

  if (!email) {
    return (
      <Link href="/login">
        <Button variant="ghost" size="sm">
          Войти
        </Button>
      </Link>
    );
  }

  async function handleSignOut() {
    setSigning(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="gap-1.5"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      >
        <span className="hidden max-w-[180px] truncate text-sm sm:inline">{email}</span>
        <ChevronDown className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-md border border-border bg-white shadow-md">
          <Link
            href="/profile"
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
            onMouseDown={(e) => e.preventDefault()}
          >
            <User className="h-4 w-4 text-muted-foreground" />
            Профиль
          </Link>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleSignOut}
            disabled={signing}
            className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
            {signing ? "Выхожу…" : "Выйти"}
          </button>
        </div>
      )}
    </div>
  );
}
