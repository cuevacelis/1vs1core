"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";
import * as React from "react";
import { useMedia } from "react-use";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
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

interface Option {
  value: string;
  label: string;
}

interface ComboboxMultipleSelectionProps {
  options: Option[];
  onSelect: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  messageEmpty?: string;
}

export function ComboboxMultipleSelection({
  options,
  onSelect,
  placeholder = "Selecciona opciones...",
  className,
  messageEmpty = "No se encontró ninguna opción.",
}: ComboboxMultipleSelectionProps) {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMedia("(min-width: 768px)");
  const [selectedValues, setSelectedValues] = React.useState<string[]>([]);

  const handleSelect = (value: string) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    setSelectedValues(newSelectedValues);
    onSelect(newSelectedValues);
  };

  const handleRemove = (value: string) => {
    const newSelectedValues = selectedValues.filter((v) => v !== value);
    setSelectedValues(newSelectedValues);
    onSelect(newSelectedValues);
  };

  const trigger = (
    <Button
      variant="outline"
      role="img"
      aria-expanded={open}
      className="w-full justify-between"
    >
      {selectedValues.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {selectedValues.map((value) => (
            <Badge key={value} variant="secondary" className="mr-1">
              {options.find((option) => option.value === value)?.label}
              <button
                type="button"
                className="ml-1 ring-offset-background rounded-full outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRemove(value);
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => handleRemove(value)}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        placeholder
      )}
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  const content = (
    <Command>
      <CommandInput placeholder="Buscar opción..." />
      <CommandEmpty>{messageEmpty}</CommandEmpty>
      <CommandGroup>
        {options.map((option) => (
          <CommandItem
            key={option.value}
            value={option.value}
            onSelect={() => handleSelect(option.value)}
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                selectedValues.includes(option.value)
                  ? "opacity-100"
                  : "opacity-0",
              )}
            />
            {option.label}
          </CommandItem>
        ))}
      </CommandGroup>
    </Command>
  );

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild className={cn(className)}>
          <Button
            variant="outline"
            role="img"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {trigger}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">{content}</PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild className={cn(className)}>
        {trigger}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="py-0">
          <DrawerTitle>{placeholder}</DrawerTitle>
          <DrawerDescription className="sr-only">
            {placeholder}
          </DrawerDescription>
        </DrawerHeader>
        <div className="mt-4 border-t">{content}</div>
      </DrawerContent>
    </Drawer>
  );
}
