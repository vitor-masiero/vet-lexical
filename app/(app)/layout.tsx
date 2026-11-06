import { requireUser } from "@/lib/auth";
import { ToastProvider } from "@/components/toast";
import { AppShell } from "@/components/app-nav";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <ToastProvider>
      <AppShell>{children}</AppShell>
    </ToastProvider>
  );
}
