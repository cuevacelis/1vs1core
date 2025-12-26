import { AlertCircle, User as UserIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ProfileInformationEmpty() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          Perfil de Usuario
        </CardTitle>
        <CardDescription>Información del perfil</CardDescription>
      </CardHeader>

      <CardContent className="py-12">
        <Alert variant="default" className="border-muted">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>No se encontró información del perfil</AlertTitle>
          <AlertDescription className="mt-2">
            No pudimos cargar tu información de perfil en este momento. Por
            favor, intenta recargar la página o contacta con soporte si el
            problema persiste.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
