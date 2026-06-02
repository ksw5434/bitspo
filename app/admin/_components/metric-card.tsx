import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  title,
  value,
  description,
  icon,
  className,
}: Readonly<{
  title: string;
  value: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
}>) {
  return (
    <Card className={cn("py-5", className)}>
      <CardHeader className="px-5 pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {icon ? (
            <div className="text-muted-foreground" aria-hidden>
              {icon}
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="px-5">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

