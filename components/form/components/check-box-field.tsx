import type { Checkbox as CheckboxPrimitive } from "radix-ui";
import { Activity, type ReactNode } from "react";
import type { ZodObject } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { useFieldOptionalityCheck } from "../hooks/use-field-optionality-check";
import { useFieldContext } from "../hooks/use-form-context";
import { FormLabelOptionalitySuffix } from "./form-label-optionality-suffix";

interface CheckBoxFieldProps {
  label?: ReactNode;
  name?: string;
  className?: string;
  labelProps?: React.ComponentProps<"label">;
  checkboxProps?: React.ComponentProps<typeof CheckboxPrimitive.Root>;
  isHideErrorMessage?: boolean;
  isShowIconError?: boolean;
  schema?: ZodObject;
}

/**
 * CheckBoxField component for form input with label, error message, and optional error icon.
 * Integrates with form context and supports custom label and checkbox props.
 *
 * @example
 * <CheckBoxField label="Accept terms" name="terms" />
 */
export function CheckBoxField({
  label,
  name,
  className,
  labelProps,
  checkboxProps,
  isHideErrorMessage,
  schema,
}: CheckBoxFieldProps) {
  const field = useFieldContext<boolean>();
  const fieldName = name ?? field.name?.split(".").pop() ?? field.name;
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const isOptional = useFieldOptionalityCheck(fieldName, schema, {
    hideWhenDisabled: true,
    disabled: checkboxProps?.disabled,
  });

  return (
    <section className={cn(className)}>
      <Field
        className="gap-2"
        orientation="horizontal"
        data-invalid={isInvalid}
      >
        <div className={cn("flex items-center space-x-2")}>
          <Checkbox
            id={fieldName}
            name={fieldName}
            checked={field.state.value}
            onCheckedChange={(checked) => {
              field.handleChange(Boolean(checked));
            }}
            aria-checked={field.state.value}
            aria-invalid={Boolean(isInvalid)}
            {...checkboxProps}
          />
          {label && (
            <>
              <span className="inline-flex items-center gap-0.5">
                <FieldLabel
                  htmlFor={fieldName}
                  className={labelProps?.className}
                  {...labelProps}
                >
                  {label}
                </FieldLabel>
                <FormLabelOptionalitySuffix isOptional={isOptional} />
              </span>
            </>
          )}
        </div>
        <Activity
          mode={isInvalid && !isHideErrorMessage ? "visible" : "hidden"}
        >
          <FieldError errors={field.state.meta.errors} />
        </Activity>
      </Field>
    </section>
  );
}
