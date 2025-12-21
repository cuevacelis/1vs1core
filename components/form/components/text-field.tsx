import { Activity, type ReactNode } from "react";
import type { ZodObject } from "zod";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useFieldOptionalityCheck } from "../hooks/use-field-optionality-check";
import { useFieldContext } from "../hooks/use-form-context";
import { FormLabelOptionalitySuffix } from "./form-label-optionality-suffix";

interface TextFieldProps {
  label: ReactNode;
  name?: string;
  className?: string;
  labelProps?: React.ComponentProps<"label">;
  inputProps?: React.ComponentProps<"input">;
  isHideErrorMessage?: boolean;
  schema?: ZodObject;
}

/**
 * TextField component for form input with label, error message, and required asterisk.
 * Shows required indicator based on prop or Zod schema.
 *
 * @example
 * <TextField label="Name" name="name" schema={mySchema} />
 */
export function TextField({
  label,
  name,
  className,
  labelProps,
  inputProps,
  isHideErrorMessage,
  schema,
}: TextFieldProps) {
  const field = useFieldContext<string>();
  const fieldName = name ?? field.name?.split(".").pop() ?? field.name;
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const isOptional = useFieldOptionalityCheck(fieldName, schema, {
    hideWhenDisabled: true,
    disabled: inputProps?.disabled,
  });

  return (
    <section className={cn(className)}>
      <Field className="gap-2" data-invalid={isInvalid}>
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
        <Input
          id={fieldName}
          name={fieldName}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
          autoComplete="off"
          {...inputProps}
        />
        <Activity
          mode={isInvalid && !isHideErrorMessage ? "visible" : "hidden"}
        >
          <FieldError errors={field.state.meta.errors} />
        </Activity>
      </Field>
    </section>
  );
}
