import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/class-utils";

interface IProps {
	isShowIcon?: boolean;
	modeView?: "card" | "inline";
	message: string[] | string | undefined;
	className?: string;
}

export function LoadingMessage({
	isShowIcon = true,
	modeView = "inline",
	message,
	className,
}: IProps) {
	if (!message) {
		return null;
	}

	return (
		<section
			className={cn("overflow-y-auto text-left", className, {
				"rounded-md p-3 border border-yellow-200 shadow-xs bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800":
					modeView === "card",
			})}
			aria-live="polite"
			aria-atomic="true"
		>
			{typeof message === "string" ? (
				<div className="flex flex-row gap-2 items-center">
					<Loader2
						className={cn(
							"size-4 text-yellow-600 dark:text-yellow-400 shrink-0 animate-spin",
							{
								hidden: !isShowIcon,
							},
						)}
					/>
					<p className="w-auto text-sm text-yellow-600 dark:text-yellow-300">
						{message}
					</p>
				</div>
			) : (
				<ul className="list-none text-sm text-yellow-600 dark:text-yellow-300">
					{message.map((msg) => (
						<li key={msg} className="flex flex-row gap-2 items-center">
							<Loader2
								className={cn(
									"size-4 text-yellow-600 dark:text-yellow-400 shrink-0 animate-spin",
									{
										hidden: !isShowIcon,
									},
								)}
							/>
							{msg}
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
