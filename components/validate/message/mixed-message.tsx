import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

export interface IMixedMessageItem {
  message: string;
  isError: boolean; // true para error, false para éxito
  id?: string; // Identificador único opcional
}

interface IProps {
  isShowIcon?: boolean;
  modeView?: "card" | "inline";
  messages: IMixedMessageItem[] | undefined;
  className?: string;
}

export function MixedMessage({
  isShowIcon = true,
  modeView = "inline",
  messages,
  className,
}: IProps) {
  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("overflow-y-auto text-left", className, {
        "rounded-md p-3 border border-gray-100 shadow-sm bg-white/80 dark:border-gray-700 dark:bg-gray-800":
          modeView === "card",
      })}
      aria-live="polite"
      aria-atomic="true"
    >
      <ul className="list-none text-sm space-y-2">
        {messages.map((item, index) => {
          const Icon = item.isError ? ExclamationCircleIcon : CheckCircleIcon;
          const textColor = item.isError ? "text-red-500" : "text-green-500";

          const key =
            item.id ??
            `${item.message}-${item.isError ? "error" : "success"}-${index}`;

          return (
            <li key={key} className="flex flex-row gap-2 items-start">
              <Icon
                className={cn(`size-5 ${textColor} shrink-0`, {
                  hidden: !isShowIcon,
                })}
              />
              <p className={`w-auto ${textColor}`}>{item.message}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
