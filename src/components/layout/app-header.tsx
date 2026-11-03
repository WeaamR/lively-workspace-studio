import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Plus } from "lucide-react";
import { toast } from "sonner";

import { DemoBadge } from "@/components/common/status-badges";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useActions, useAppData } from "@/data/store";

export function AppHeader() {
  const { signOut } = useActions();
  const { profile } = useAppData();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
      <SidebarTrigger className="text-muted-foreground" aria-label="إظهار أو إخفاء القائمة" />
      <div className="h-5 w-px bg-border" />
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default">
            <DemoBadge label="التحليل تجريبي" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-center">
          بياناتك محفوظة في حسابك، لكن تحليل الطلبات وكشف التغييرات ناتج عن قواعد تجريبية وليس ذكاءً اصطناعيًا بعد.
        </TooltipContent>
      </Tooltip>
      <div className="ms-auto flex items-center gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground" aria-label="تسجيل الخروج">
              <LogOut />
              <span className="hidden md:inline">خروج</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تسجيل الخروج؟</AlertDialogTitle>
              <AlertDialogDescription dir="auto">{profile.email}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  await queryClient.cancelQueries();
                  queryClient.clear();
                  await signOut();
                  toast.success("تم تسجيل الخروج");
                  navigate({ to: "/auth", replace: true });
                }}
              >
                تسجيل الخروج
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button asChild size="sm">
          <Link to="/requests/new">
            <Plus />
            <span className="hidden sm:inline">طلب عميل جديد</span>
            <span className="sm:hidden">جديد</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
