import { Toaster } from "sonner";

/**
 * Standalone layout for auth pages (/login, future /register, /reset-password).
 * Intentionally minimal — no AppHeader, no AppSidebar, no marketing chrome.
 * The page content provides its own logo + form; the layout just gives a
 * neutral background and the Toaster for any feedback.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="flex min-h-screen flex-col">{children}</main>
      <Toaster richColors position="bottom-right" />
    </>
  );
}
