import { Check, ChevronsUpDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMedia } from "react-use";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface OptionComboboxSingleSelection {
  value: string;
  label: string;
}

const EMPTY_OPTIONS: OptionComboboxSingleSelection[] = [];

export interface ComboboxSingleSelectionProps {
  options?: OptionComboboxSingleSelection[];
  onSelect: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  value: string;
  className?: string;
  messageEmpty?: React.ReactNode;
  /**
   * Valor por defecto a seleccionar automáticamente cuando:
   * 1. No hay un valor seleccionado (value es vacío)
   * 2. Las opciones están disponibles
   * 3. El defaultValue existe en las opciones
   */
  defaultValue?: string;
}

export function ComboboxSingleSelection({
  options = EMPTY_OPTIONS,
  value,
  disabled = false,
  placeholder = "Selecciona una opción...",
  messageEmpty = "No se encontró ninguna opción.",
  onSelect,
  onBlur,
  className,
  defaultValue,
}: ComboboxSingleSelectionProps) {
  const [open, setOpen] = useState<boolean>(false);
  const isDesktop = useMedia("(min-width: 768px)");
  const hasInitialized = useRef(false);

  // Efecto para seleccionar el valor por defecto automáticamente
  useEffect(() => {
    // Solo ejecutar si:
    // 1. Se proporcionó un defaultValue
    // 2. No hay un valor seleccionado actualmente
    // 3. Hay opciones disponibles
    // 4. No se ha inicializado antes (evitar loops)
    if (
      defaultValue &&
      !value &&
      options.length > 0 &&
      !hasInitialized.current
    ) {
      // Verificar que el defaultValue existe en las opciones
      const defaultExists = options.some(
        (option) => option.value === defaultValue,
      );

      if (defaultExists) {
        hasInitialized.current = true;
        onSelect(defaultValue);
      }
    }

    // Si no hay opciones y había un valor seleccionado, resetear
    if (options.length === 0 && value) {
      hasInitialized.current = false;
    }
  }, [defaultValue, value, options, onSelect]);

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? placeholder;

  const handleSelect = useCallback(
    (selectedValue: string) => {
      onSelect(value === selectedValue ? "" : selectedValue);
      setOpen(false);
    },
    [onSelect, value],
  );

  const TriggerButton = (
    <Button
      variant="outline"
      aria-expanded={open}
      aria-label={selectedLabel}
      tabIndex={0}
      className="w-full justify-between flex items-center gap-2 overflow-hidden"
      disabled={disabled}
      onBlur={onBlur}
    >
      <span
        className={cn("max-w-full truncate text-muted-foreground", {
          "text-accent-foreground": value,
        })}
      >
        {selectedLabel}
      </span>
      <ChevronsUpDown className="size-4 shrink-0 opacity-60" />
    </Button>
  );

  const ContentList = (
    <Command loop>
      <CommandInput placeholder="Buscar opción..." />
      <CommandList>
        <CommandEmpty>{messageEmpty}</CommandEmpty>
        <CommandGroup>
          {options.map((option) => (
            <CommandItem
              key={option.value}
              value={option.value}
              keywords={[option.label, option.value]}
              onSelect={handleSelect}
              className="w-full"
              aria-selected={value === option.value}
            >
              <Check
                className={cn("size-4", {
                  "opacity-100": value === option.value,
                  "opacity-0": value !== option.value,
                })}
              />
              {option.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild className={className}>
          {TriggerButton}
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          style={{ width: "var(--radix-popover-trigger-width)" }}
        >
          {ContentList}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild className={className}>
        {TriggerButton}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{placeholder}</DrawerTitle>
          <DrawerDescription className="sr-only">
            {placeholder}
          </DrawerDescription>
        </DrawerHeader>
        <div className="border-t">{ContentList}</div>
      </DrawerContent>
    </Drawer>
  );
}
