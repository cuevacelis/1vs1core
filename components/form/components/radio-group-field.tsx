import { Activity, type ReactNode } from "react";
import type { ZodObject } from "zod";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { useFieldOptionalityCheck } from "../hooks/use-field-optionality-check";
import { useFieldContext } from "../hooks/use-form-context";
import { FormLabelOptionalitySuffix } from "./form-label-optionality-suffix";

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupFieldProps {
  label?: ReactNode;
  name?: string;
  className?: string;
  labelProps?: React.ComponentProps<"label">;
  radioGroupProps?: React.ComponentProps<typeof RadioGroup>;
  options: RadioOption[];
  isShowIconError?: boolean;
  isHideErrorMessage?: boolean;
  schema?: ZodObject;
}

/**
 * RadioGroupField component for form input with radio options, label, and error message.
 * Shows required indicator based on prop or Zod schema.
 *
 * @example
 * <RadioGroupField
 *   label="Options"
 *   options={[
 *     { value: "option1", label: "Option 1" },
 *     { value: "option2", label: "Option 2" }
 *   ]}
 *   schema={mySchema}
 * />
 */
export function RadioGroupField({
  label,
  name,
  className,
  labelProps,
  options,
  radioGroupProps,
  isHideErrorMessage = false,
  schema,
}: RadioGroupFieldProps) {
  const field = useFieldContext<string>();
  const fieldName = name ?? field.name?.split(".").pop() ?? field.name;
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const isOptional = useFieldOptionalityCheck(fieldName, schema, {
    hideWhenDisabled: true,
    disabled: radioGroupProps?.disabled,
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

        <RadioGroup
          value={field.state.value}
          onValueChange={field.handleChange}
          className={cn("grid gap-2", {
            "border-red-500": isInvalid,
            "focus-within:border-destructive": isInvalid,
          })}
        >
          {options.map((option) => (
            <div
              key={option.value}
              className="flex items-center space-x-2 rounded-md border p-2 hover:bg-accent"
            >
              <RadioGroupItem
                value={option.value}
                id={`${isInvalid}-${option.value}`}
              />
              <Label
                htmlFor={`${isInvalid}-${option.value}`}
                className="flex-1 cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <Activity
          mode={isInvalid && !isHideErrorMessage ? "visible" : "hidden"}
        >
          <FieldError errors={field.state.meta.errors} />
        </Activity>
      </Field>
    </section>
  );
}
