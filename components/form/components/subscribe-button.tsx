import type { VariantProps } from "class-variance-authority";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import type { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useFormContext } from "../hooks/use-form-context";

interface SubscribeButtonProps<TMeta = unknown>
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  label: string;
  icon?: IconName;
  asChild?: boolean;
  meta?: TMeta;
}

export function SubscribeButton<TMeta = unknown>({
  label,
  icon = "save",
  variant = "default",
  size,
  className,
  asChild,
  meta,
  ...props
}: SubscribeButtonProps<TMeta>) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => {
        const isDisabled = !canSubmit || isSubmitting;

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className={className}>
                  <Button
                    type="submit"
                    disabled={isDisabled}
                    variant={variant}
                    size={size}
                    className={className}
                    asChild={asChild}
                    onClick={() => {
                      void form.handleSubmit(meta);
                    }}
                    {...props}
                  >
                    <DynamicIcon name={icon} />
                    {label}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent className={cn({ hidden: !isDisabled })}>
                <span>Por favor completa todos los campos requeridos.</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }}
    </form.Subscribe>
  );
}
