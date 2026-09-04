import type { TextareaHTMLAttributes } from "react";
import { fieldClasses } from "@/components/ui/input";
import { cn } from "@/lib/cn";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(fieldClasses, "resize-none px-3.5 py-2.5", className)} {...props} />
  );
}
