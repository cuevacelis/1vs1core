"use client";

import { LoaderIcon, Search as SearchIcon, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../ui/input-group";
import { Kbd, KbdGroup } from "../ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { ErrorMessage } from "../validate/message/error-message";

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

/**
 * Custom debounce hook for Next.js
 */
function useDebounce<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number,
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Custom keyboard shortcut hook
 */
function useKeyboardShortcut({
  key,
  callback,
  modifiers = {},
}: {
  key: string;
  callback: () => void;
  modifiers?: {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { ctrl, meta, shift, alt } = modifiers;

      const ctrlMatch = ctrl ? event.ctrlKey : true;
      const metaMatch = meta ? event.metaKey : true;
      const shiftMatch = shift ? event.shiftKey : !event.shiftKey;
      const altMatch = alt ? event.altKey : !event.altKey;

      // For Ctrl+K or Cmd+K, we want either ctrl OR meta to be pressed
      const modifierMatch =
        ctrl || meta
          ? (event.ctrlKey || event.metaKey) && shiftMatch && altMatch
          : ctrlMatch && metaMatch && shiftMatch && altMatch;

      if (event.key.toLowerCase() === key.toLowerCase() && modifierMatch) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, callback, modifiers]);
}

/**
 * Clean empty params from search params object
 */
function cleanEmptyParams(
  params: Record<string, string | undefined>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  ) as Record<string, string>;
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
    (value: string) => {
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

  const debouncedSearch = useDebounce(handleDebouncedSearch, wait);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setSearchValue(newValue);
    controlledOnChange?.(event);
    debouncedSearch(newValue);
  };

  const handleClearSearch = () => {
    const syntheticEvent = {
      target: { value: "" },
      currentTarget: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>;
    handleSearchChange(syntheticEvent);
  };

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
