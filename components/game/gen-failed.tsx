import { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GenFailedProps {
  icon: LucideIcon;
  message: string;
  detail?: string;
  onRetry: () => void;
  className?: string;
}

export function GenFailed({
  icon: Icon,
  message,
  detail,
  onRetry,
  className,
}: GenFailedProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4 text-center", className)}>
      <div className="rounded-full bg-destructive/10 p-3">
        <Icon className="h-6 w-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-destructive">{message}</p>
        {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      </div>
      <Button
        onClick={onRetry}
        variant="primary"
        size="md"
        className="rounded-lg px-4 py-2"
      >
        Retry Generation
      </Button>
    </div>
  );
}
