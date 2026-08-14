import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  size = 14,
  className,
}: {
  value: number;
  count?: number;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            width={size}
            height={size}
            className={cn(
              i <= Math.round(value) ? "fill-primary text-primary" : "text-muted-foreground/40",
            )}
          />
        ))}
      </div>
      {count != null && <span className="text-xs text-muted-foreground">({count})</span>}
    </div>
  );
}
