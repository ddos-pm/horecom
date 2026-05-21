import { AppHeader } from "@/components/app/header";
import { AppSidebar } from "@/components/app/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <div className="flex flex-1">
        <AppSidebar />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>
    </>
  );
}
