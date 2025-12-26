"use client";

import { useDebouncer } from "@tanstack/react-pacer";
import { LoaderIcon, Search as SearchIcon, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { cleanEmptyParams } from "@/lib/utils/search-utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../ui/input-group";
import { Kbd, KbdGroup } from "../ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { ErrorMessage } from "../validate/message/error-message";
import { useKeyboardShortcut } from "./hooks/use-keyboard-shortcut";

interface SearchProps {
  isShowIcon?: boolean;
  searchParamKey?: string;
  placeholder?: string;
  className?: string;
  classNameInput?: string;
  "aria-label"?: string;
  wait?: number;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  shouldFocus?: boolean;
}

export function SearchBar({
  isShowIcon = true,
  searchParamKey = "search",
  placeholder = "Buscar...",
  className,
  classNameInput,
  "aria-label": ariaLabel = "Campo de búsqueda",
  wait = 250,
  value: controlledValue,
  onChange: controlledOnChange,
  shouldFocus = false,
}: SearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState(controlledValue ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleDebouncedSearch = useCallback(
    async (value: string) => {
      setIsLoading(true);
      try {
        // Get current search params
        const params = new URLSearchParams(searchParams.toString());

        // Update or remove the search param
        if (value) {
          params.set(searchParamKey, value);
        } else {
          params.delete(searchParamKey);
        }

        // Clean empty params
        const cleanedParams = cleanEmptyParams(
          Object.fromEntries(params.entries()),
        );

        // Build new URL with cleaned params
        const newParams = new URLSearchParams(cleanedParams);
        const queryString = newParams.toString();
        const newUrl = queryString
          ? `?${queryString}`
          : window.location.pathname;

        // Navigate without scroll reset
        router.replace(newUrl, { scroll: false });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    },
    [router, searchParams, searchParamKey],
  );

  // Use TanStack Pacer for debouncing
  const searchDebouncer = useDebouncer(handleDebouncedSearch, { wait });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setSearchValue(newValue);
    controlledOnChange?.(event);
    searchDebouncer.maybeExecute(newValue);
  };

  const handleClearSearch = () => {
    const syntheticEvent = {
      target: { value: "" },
      currentTarget: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>;
    handleSearchChange(syntheticEvent);
  };

  // Cancel debouncer on unmount
  useEffect(() => {
    return () => searchDebouncer.cancel();
  }, [searchDebouncer]);

  // Sync with controlled value if provided
  useEffect(() => {
    if (controlledValue !== undefined && controlledValue !== searchValue) {
      setSearchValue(controlledValue);
    }
  }, [controlledValue, searchValue]);

  // Handle Ctrl+K or Cmd+K keyboard shortcut to focus search
  useKeyboardShortcut({
    key: "k",
    callback: () => {
      inputRef.current?.focus();
    },
    modifiers: {
      ctrl: true,
      meta: true,
    },
  });

  return (
    <section
      className={cn(
        "flex flex-col w-auto lg:w-md items-start space-x-2",
        className,
      )}
    >
      <div className="relative w-full">
        <InputGroup className="bg-background">
          <InputGroupInput
            ref={inputRef}
            autoFocus={shouldFocus}
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder={placeholder}
            aria-label={ariaLabel}
            className={cn(classNameInput, {
              "ring-red-500": error,
            })}
          />
          <Activity mode={isShowIcon ? "visible" : "hidden"}>
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
          </Activity>

          <InputGroupAddon align="inline-end">
            <Activity mode={isLoading ? "visible" : "hidden"}>
              <LoaderIcon className="animate-spin" />
            </Activity>

            <Activity mode={searchValue ? "visible" : "hidden"}>
              <InputGroupButton
                aria-label="Clear search"
                title="Clear search"
                size="icon-xs"
                onClick={handleClearSearch}
              >
                <X />
              </InputGroupButton>
            </Activity>

            <Activity mode={searchValue || isLoading ? "hidden" : "visible"}>
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-1">
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="flex items-center gap-2">
                    Puedes usar el atajo de teclado
                    <KbdGroup>
                      <Kbd>Ctrl</Kbd>
                      <Kbd>K</Kbd>
                    </KbdGroup>{" "}
                    para enfocar el input de búsqueda
                  </div>
                </TooltipContent>
              </Tooltip>
            </Activity>
          </InputGroupAddon>
        </InputGroup>
      </div>

      <Activity mode={error ? "visible" : "hidden"}>
        <ErrorMessage message={error?.message} className="mt-1" />
      </Activity>
    </section>
  );
}
