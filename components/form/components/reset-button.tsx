import type { VariantProps } from "class-variance-authority";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import type { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFormContext } from "../hooks/use-form-context";

interface ResetButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  label: string;
  icon?: IconName;
  asChild?: boolean;
}

export function ResetButton({
  label,
  icon = "rotate-ccw",
  variant = "outline",
  size,
  className,
  asChild,
  ...props
}: ResetButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => [state.isSubmitting]}>
      {([isSubmitting]) => (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              type="reset"
              disabled={isSubmitting}
              variant={variant}
              size={size}
              className={className}
              asChild={asChild}
              onClick={(e) => {
                e.preventDefault();
                form.reset();
              }}
              {...props}
            >
              <DynamicIcon name={icon} />
              {label}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Restablece los valores del formulario a su estado original.</p>
          </TooltipContent>
        </Tooltip>
      )}
    </form.Subscribe>
  );
}
