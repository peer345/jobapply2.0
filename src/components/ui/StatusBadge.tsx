import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BadgeVariant = "direct" | "account" | "coming" | "internship" | "job" | "success" | "warning" | "error" | "neutral" | "processing";

const variantStyles: Record<BadgeVariant, string> = {
  direct: "bg-primary text-primary-foreground hover:bg-primary/90",
  account: "border-warning text-warning bg-transparent hover:bg-warning/10",
  coming: "border-dashed border-muted-foreground text-muted-foreground bg-transparent",
  internship: "bg-success/10 text-success border-success/20",
  job: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  error: "bg-destructive/10 text-destructive border-destructive/20",
  neutral: "bg-muted text-muted-foreground",
  processing: "bg-primary/10 text-primary border-primary/20 animate-pulse-soft",
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", variantStyles[variant], className)}>
      {children}
    </Badge>
  );
}
