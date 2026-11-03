import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useDataStatus } from "@/data/store";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { status, error, reload } = useDataStatus();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="min-w-0 bg-background">
          <AppHeader />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {status === "ready" ? (
              <Outlet />
            ) : status === "error" ? (
              <div className="surface-card mx-auto max-w-md space-y-3 p-6 text-center">
                <p className="font-medium">تعذّر تحميل بياناتك من قاعدة البيانات</p>
                <p className="text-sm text-muted-foreground" dir="auto">{error}</p>
                <Button onClick={reload}>إعادة المحاولة</Button>
              </div>
            ) : (
              <div className="flex justify-center py-20 text-muted-foreground">
                <Loader2 className="size-6 animate-spin" aria-label="جارٍ التحميل" />
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
