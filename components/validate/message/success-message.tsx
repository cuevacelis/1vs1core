import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils/class-utils";

interface IProps {
	isShowIcon?: boolean;
	modeView?: "card" | "inline";
	message: string[] | string | undefined;
	className?: string;
}

export function SuccessMessage({
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
				"rounded-md p-3 border border-green-200 dark:border-green-800 shadow-xs bg-green-50 dark:bg-green-950/50":
					modeView === "card",
			})}
			aria-live="polite"
			aria-atomic="true"
		>
			{typeof message === "string" ? (
				<div className="flex flex-row gap-2 items-start">
					<CheckCircleIcon
						className={cn(
							"size-5 text-green-500 dark:text-green-400 shrink-0",
							{
								hidden: !isShowIcon,
							},
						)}
					/>
					<p className="w-auto text-sm text-green-500 dark:text-green-400">
						{message}
					</p>
				</div>
			) : (
				<ul className="list-none text-sm text-green-500 dark:text-green-400">
					{message.map((msg) => (
						<li key={msg} className="flex flex-row gap-2 items-start">
							<CheckCircleIcon
								className={cn(
									"size-5 text-green-500 dark:text-green-400 shrink-0",
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
