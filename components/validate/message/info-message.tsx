import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils/class-utils";

interface IProps {
	isShowIcon?: boolean;
	modeView?: "card" | "inline";
	message: string[] | string | undefined;
	className?: string;
}

export function InfoMessage({
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
				"rounded-md p-3 border border-blue-200 shadow-xs bg-white/80":
					modeView === "card",
			})}
			aria-live="polite"
			aria-atomic="true"
		>
			{typeof message === "string" ? (
				<div className="flex flex-row gap-2 items-start">
					<InformationCircleIcon
						className={cn("size-5 text-blue-500 shrink-0", {
							hidden: !isShowIcon,
						})}
					/>
					<p className="w-auto text-sm text-blue-500">{message}</p>
				</div>
			) : (
				<ul className="list-none text-sm text-blue-500">
					{message.map((msg) => (
						<li key={msg} className="flex flex-row gap-2 items-start">
							<InformationCircleIcon
								className={cn("size-5 text-blue-500 shrink-0", {
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
