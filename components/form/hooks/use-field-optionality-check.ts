import { useMemo } from "react";
import { ZodOptional, type ZodSchema } from "zod";

const TEMPORARY_REPLACEMENT_PLACEHOLDER = "__PLACEHOLDER__";
const ZOD_OBJECT_FIELD_PATH = ".shape.";
const ZOD_ARRAY_FIELD_PATH = "._def.type";

/**
 * Custom implementation of lodash's get function for nested object access
 * @param obj - The object to query
 * @param path - The path of the property to get
 * @returns The resolved value or undefined
 */
function getNestedValue(obj: unknown, path: string): unknown {
  const keys = path.split(".");
  let result: unknown = obj;

  for (const key of keys) {
    if (result === null || result === undefined) {
      return undefined;
    }
    result = (result as Record<string, unknown>)[key];
  }

  return result;
}

export const generateZodFieldPath = (fieldName: string) => {
  return fieldName
    .replaceAll(/\.\d+/g, TEMPORARY_REPLACEMENT_PLACEHOLDER)
    .replaceAll(/\./g, ZOD_OBJECT_FIELD_PATH)
    .replaceAll(
      new RegExp(TEMPORARY_REPLACEMENT_PLACEHOLDER, "g"),
      ZOD_ARRAY_FIELD_PATH,
    );
};

const handleNotFoundField = (fieldName: string) => {
  throw new Error(
    `Field ${fieldName} not found in schema. Make sure the field exists in the schema or do not
pass the schema inside the Form - in this case you could manually set the required property for FormLabel.`,
  );
};

export interface UseFieldOptionalityCheckOptions {
  /** Hide the required indicator when the field is disabled */
  hideWhenDisabled?: boolean;
  /** Whether the field is currently disabled */
  disabled?: boolean;
}

export type UseFieldOptionalityCheck = (
  fieldName: string,
  schema?: ZodSchema,
  options?: UseFieldOptionalityCheckOptions,
) => boolean | null;

export const useFieldOptionalityCheck: UseFieldOptionalityCheck = (
  fieldName,
  schema,
  options,
) => {
  return useMemo(() => {
    // If hideWhenDisabled is enabled and the field is disabled, return null to hide the indicator
    if (options?.hideWhenDisabled && options?.disabled) {
      return null;
    }

    if (!schema) {
      return null;
    }
    const zodFieldPath = generateZodFieldPath(fieldName);
    // @ts-expect-error - form schema is always object
    const zodField = getNestedValue(schema?.shape, zodFieldPath);
    if (!zodField) handleNotFoundField(fieldName);
    return zodField instanceof ZodOptional;
  }, [fieldName, schema, options?.hideWhenDisabled, options?.disabled]);
};
