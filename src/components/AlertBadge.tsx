import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertPriority } from "@/types";
import { cn } from "@/lib/utils";

interface AlertBadgeProps {
  priority: AlertPriority;
  className?: string;
}

const AlertBadge: React.FC<AlertBadgeProps> = ({ priority, className }) => {
  const getVariantAndColor = (priority: AlertPriority) => {
    switch (priority) {
      case "high":
        return {
          variant: "destructive" as const,
          className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
        };
      case "medium":
        return {
          variant: "secondary" as const,
          className:
            "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200",
        };
      case "low":
        return {
          variant: "outline" as const,
          className:
            "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
        };
      default:
        return {
          variant: "secondary" as const,
          className: "",
        };
    }
  };

  const { variant, className: priorityClassName } =
    getVariantAndColor(priority);

  return (
    <Badge variant={variant} className={cn(priorityClassName, className)}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
};

export default AlertBadge;
