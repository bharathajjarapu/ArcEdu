import type { ComponentProps, ReactElement, ReactNode } from "react";
import { Button as Base } from "@base-ui/react/button";
import { Tooltip } from "@base-ui/react/tooltip";

// Joins the truthy class names.
export const cn = (...names: (string | false | null | undefined)[]) => names.filter(Boolean).join(" ");

const variants = {
  default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
  outline: "border-border bg-background hover:bg-muted",
  ghost: "border-transparent hover:bg-muted",
};

const sizes = {
  default: "h-8 gap-1.5 px-2.5 text-sm",
  lg: "h-9 gap-1.5 px-3 text-sm",
  xl: "h-10 gap-1.5 px-6 text-sm",
  icon: "size-8",
  "icon-xs": "size-6",
  "icon-sm": "size-7",
  "icon-lg": "size-9",
  "icon-xl": "size-12",
};

interface Look {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

// Button classes, shared by buttons and links.
export function buttonVariants({ variant = "default", size = "default" }: Look = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-lg border font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    variants[variant],
    sizes[size],
  );
}

// Base UI button with the shadcn look.
export function Button({ variant, size, className, ...props }: Omit<Base.Props, "className"> & Look & { className?: string }) {
  return <Base className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

// Tooltip naming an icon-only control.
export function Tip({ label, children }: { label: string; children: ReactElement }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={children} />
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={6} className="z-50">
          <Tooltip.Popup className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0">
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

// Bordered surface.
export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-xl border", className)} {...props} />;
}

// Small pill label; callers set the size.
export function Badge({ variant = "outline", className, ...props }: ComponentProps<"span"> & { variant?: "outline" | "default" }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-4xl border font-medium whitespace-nowrap [&>svg]:size-3.5",
        variant === "default" && "border-transparent bg-primary text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}

// Dashed placeholder for an empty list.
export function Empty({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm text-balance">
      {icon && <span className="mb-2 flex size-8 items-center justify-center rounded-lg bg-muted [&_svg]:size-4">{icon}</span>}
      <p className="font-medium">{title}</p>
      {children}
    </div>
  );
}
