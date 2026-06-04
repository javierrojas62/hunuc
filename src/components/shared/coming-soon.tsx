import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({
  icon: Icon,
  phase,
  description,
}: {
  icon: LucideIcon;
  phase: string;
  description: string;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="rounded-full bg-primary/10 p-4">
          <Icon className="size-8 text-primary" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{description}</p>
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          {phase}
        </span>
      </CardContent>
    </Card>
  );
}
