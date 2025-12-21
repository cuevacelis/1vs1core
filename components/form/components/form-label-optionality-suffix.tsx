interface FormLabelOptionalitySuffixProps {
  isOptional: boolean | null;
}

export function FormLabelOptionalitySuffix({
  isOptional,
}: FormLabelOptionalitySuffixProps) {
  // Si no hay schema o no se pudo determinar, no mostrar nada
  if (isOptional === null) {
    return null;
  }

  // Si el campo es requerido, mostrar asterisco
  if (!isOptional) {
    return <span className="text-destructive">*</span>;
  }

  return null;
}
