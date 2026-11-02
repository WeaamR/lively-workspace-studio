import { Link } from "@tanstack/react-router";
import { Plus, RotateCcw } from "lucide-react";
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
import { useActions } from "@/data/store";

export function AppHeader() {
  const { resetDemoData } = useActions();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
      <SidebarTrigger className="text-muted-foreground" aria-label="إظهار أو إخفاء القائمة" />
      <div className="h-5 w-px bg-border" />
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default">
            <DemoBadge label="وضع العرض التجريبي" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-center">
          البيانات تجريبية ومحفوظة في هذا المتصفح فقط، والتحليلات ناتجة عن قواعد تجريبية وليست ذكاءً اصطناعيًا.
        </TooltipContent>
      </Tooltip>
      <div className="ms-auto flex items-center gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground" aria-label="إعادة ضبط البيانات التجريبية">
              <RotateCcw />
              <span className="hidden md:inline">إعادة ضبط</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>إعادة ضبط البيانات التجريبية؟</AlertDialogTitle>
              <AlertDialogDescription>
                ستُحذف كل التغييرات التي أجريتها في هذا المتصفح وتعود البيانات التجريبية الأصلية.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  resetDemoData();
                  toast.success("أُعيدت البيانات التجريبية الأصلية");
                }}
              >
                إعادة الضبط
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
