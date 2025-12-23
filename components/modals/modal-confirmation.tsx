import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface ModalConfirmationProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	onContinue?: () => void;
	onCancel?: () => void;
	title?: string;
	description?: string;
}

export function ModalConfirmation({
	open,
	setOpen,
	onContinue,
	onCancel,
	title = "¿Desea continuar?",
	description = "Si continúa, perderá los cambios realizados.",
}: ModalConfirmationProps) {
	const handleContinue = () => {
		onContinue?.();
		setOpen(false);
	};

	const handleCancel = () => {
		onCancel?.();
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader className="space-y-2">
					<DialogTitle className="flex items-center gap-2 text-xl font-semibold text-yellow-600">
						<AlertTriangle className="size-5" />
						{title}
					</DialogTitle>
					<DialogDescription className="sr-only">
						Advertencia: {description}
					</DialogDescription>
					<p className="text-sm text-muted-foreground">{description}</p>
				</DialogHeader>

				<DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-4">
					<Button
						variant="outline"
						onClick={handleCancel}
						className="w-full sm:w-auto"
					>
						Cancelar
					</Button>
					<Button
						variant="destructive"
						onClick={handleContinue}
						className="w-full sm:w-auto"
					>
						Continuar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
