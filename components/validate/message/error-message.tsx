import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils/class-utils";

interface IProps {
	isShowIcon?: boolean;
	modeView?: "card" | "inline";
	message?: string[] | string | null;
	className?: string;
}

export function ErrorMessage({
	isShowIcon = true,
	modeView = "inline",
	message,
	className,
}: IProps) {
	if (!message || message.length === 0) {
		return null;
	}

	return (
		<section
			className={cn("overflow-y-auto text-left", className, {
				"rounded-md p-3 border border-gray-200 shadow-xs bg-white/80 dark:border-gray-700 dark:bg-gray-800":
					modeView === "card",
			})}
			aria-live="polite"
			aria-atomic="true"
		>
			{typeof message === "string" ? (
				<div className="flex flex-row gap-2 items-start">
					<ExclamationCircleIcon
						className={cn("size-5 text-destructive shrink-0", {
							hidden: !isShowIcon,
						})}
					/>
					<p className="w-auto text-sm text-destructive">{message}</p>
				</div>
			) : (
				<ul className="list-disc list-inside text-sm text-destructive">
					{message.map((msg) => (
						<li key={msg} className="flex flex-row gap-2 items-start">
							<ExclamationCircleIcon
								className={cn("size-5 text-destructive shrink-0", {
									hidden: !isShowIcon,
								})}
							/>
							{msg}
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
