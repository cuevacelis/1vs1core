import { Activity, type ReactNode } from "react";
import type { ZodObject } from "zod";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupTextarea } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { useFieldOptionalityCheck } from "../hooks/use-field-optionality-check";
import { useFieldContext } from "../hooks/use-form-context";
import { FormLabelOptionalitySuffix } from "./form-label-optionality-suffix";

interface TextareaFieldProps {
  label: ReactNode;
  name?: string;
  className?: string;
  labelProps?: React.ComponentProps<"label">;
  textareaProps?: React.ComponentProps<"textarea">;
  isHideErrorMessage?: boolean;
  schema?: ZodObject;
}

/**
 * TextareaField component for form input with label, error message, and required asterisk.
 * Shows required indicator based on prop or Zod schema.
 *
 * @example
 * <TextareaField label="Description" name="description" schema={mySchema} />
 */
export function TextareaField({
  label,
  name,
  className,
  labelProps,
  textareaProps,
  isHideErrorMessage,
  schema,
}: TextareaFieldProps) {
  const field = useFieldContext<string>();
  const fieldName = name ?? field.name?.split(".").pop() ?? field.name;
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const isOptional = useFieldOptionalityCheck(fieldName, schema, {
    hideWhenDisabled: true,
    disabled: textareaProps?.disabled,
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

        <InputGroup>
          <InputGroupTextarea
            id={field.name}
            name={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            placeholder="I'm having an issue with the login button on mobile."
            rows={6}
            className="min-h-24 resize-none"
            aria-invalid={isInvalid}
            {...textareaProps}
          />
        </InputGroup>
        <Activity
          mode={isInvalid && !isHideErrorMessage ? "visible" : "hidden"}
        >
          <FieldError errors={field.state.meta.errors} />
        </Activity>
      </Field>
    </section>
  );
}
