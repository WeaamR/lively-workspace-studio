import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { DemoBadge } from "@/components/common/status-badges";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function AppHeader() {
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
          البيانات المعروضة تجريبية ومحفوظة مؤقتًا في المتصفح، وتُفقد عند تحديث الصفحة.
        </TooltipContent>
      </Tooltip>
      <div className="ms-auto">
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
