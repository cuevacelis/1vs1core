import { Activity, type ReactNode } from "react";
import type { ZodObject } from "zod";
import {
  ComboboxSingleSelection,
  type OptionComboboxSingleSelection,
} from "@/components/combobox/combobox-single-selection";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { useFieldOptionalityCheck } from "../hooks/use-field-optionality-check";
import { useFieldContext } from "../hooks/use-form-context";
import { FormLabelOptionalitySuffix } from "./form-label-optionality-suffix";

interface ComboboxSingleSelectionFieldProps {
  label?: ReactNode;
  name?: string;
  placeholder?: string;
  options?: OptionComboboxSingleSelection[];
  className?: string;
  disabled?: boolean;
  labelProps?: React.ComponentProps<"label">;
  comboboxProps?: React.ComponentProps<typeof ComboboxSingleSelection>;
  required?: boolean;
  isShowIconError?: boolean;
  isHideErrorMessage?: boolean;
  schema?: ZodObject;
}

/**
 * ComboboxSingleSelectionField component for form input with label, error message, and required asterisk.
 * Shows required indicator based on prop or Zod schema.
 *
 * @example
 * <ComboboxSingleSelectionField label="Country" name="country" options={options} schema={mySchema} />
 */
export function ComboboxSingleSelectionField({
  label,
  name,
  options,
  placeholder,
  className,
  disabled = false,
  labelProps,
  comboboxProps,
  isHideErrorMessage = false,
  schema,
}: ComboboxSingleSelectionFieldProps) {
  const field = useFieldContext<string>();
  const fieldName = name ?? field.name?.split(".").pop() ?? field.name;
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const isOptional = useFieldOptionalityCheck(fieldName, schema, {
    hideWhenDisabled: true,
    disabled: comboboxProps?.disabled,
  });

  return (
    <section className={cn(className)}>
      <Field className="gap-2" data-invalid={isInvalid}>
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
        <ComboboxSingleSelection
          options={options}
          value={field.state.value}
          onSelect={(value) => field.handleChange(value)}
          onBlur={() => field.handleBlur()}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(comboboxProps?.className, {
            "text-red-500": isInvalid,
            "border-red-500": isInvalid,
            "focus-visible:border-destructive": isInvalid,
          })}
          {...comboboxProps}
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
