import { Download, ImageOff, ZoomIn, ZoomOut } from "lucide-react";
import { Activity, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ModalImageViewerProps {
  imageUrl?: string;
  imageAlt?: string;
  title?: string;
  description?: string;
  showDownloadButton?: boolean;
  children: React.ReactNode;
  fallbackImageUrl?: string;
}

export function ModalImageViewer({
  imageUrl,
  imageAlt = "Imagen",
  title = "Vista de imagen",
  description,
  showDownloadButton = false,
  children,
  fallbackImageUrl,
}: ModalImageViewerProps) {
  const isValidUrl = imageUrl && imageUrl.trim() !== "";
  const [zoom, setZoom] = useState(100);
  const [imageError, setImageError] = useState(!isValidUrl);
  const [currentImageUrl, setCurrentImageUrl] = useState(
    isValidUrl ? imageUrl : fallbackImageUrl ?? ""
  );

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const downloadImage = async () => {
    try {
      // Intenta descargar la imagen como blob para evitar problemas de CORS
      const response = await fetch(currentImageUrl);
      const blob = await response.blob();

      // Crea una URL temporal del blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Crea y dispara el link de descarga
      const link = document.createElement("a");
      link.href = blobUrl;

      // Genera nombre de archivo basado en imageAlt o title
      const fileName = imageAlt || title || "imagen";
      const extension = blob.type.split("/")[1] || "jpg";
      link.download = `${fileName
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}.${extension}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpia la URL temporal del blob
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      const link = document.createElement("a");
      link.href = currentImageUrl;
      link.download = imageAlt || title || "imagen";
      link.target = "_blank"; // Abre en nueva pestaña si no puede descargar
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownload = () => {
    void downloadImage();
  };

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      if (fallbackImageUrl) {
        setCurrentImageUrl(fallbackImageUrl);
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setZoom(100);
      setImageError(!isValidUrl);
      setCurrentImageUrl(isValidUrl ? imageUrl : fallbackImageUrl ?? "");
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <Activity mode={description ? "visible" : "hidden"}>
            <DialogDescription>{description}</DialogDescription>
          </Activity>
        </DialogHeader>

        {!imageError && (
          <div className="flex items-center justify-between gap-2 py-2 border-y">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                title="Alejar"
              >
                <ZoomOut className="size-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">
                {zoom}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                title="Acercar"
              >
                <ZoomIn className="size-4" />
              </Button>
            </div>

            {showDownloadButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                title="Descargar imagen"
              >
                <Download className="size-4" />
                <span className="hidden sm:inline">Descargar</span>
              </Button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-auto bg-muted/30 rounded-md p-4 flex items-center justify-center min-h-[300px]">
          {imageError ? (
            <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <ImageOff className="size-24" />
              <p className="text-sm text-center">No se pudo cargar la imagen</p>
              {fallbackImageUrl && currentImageUrl !== imageUrl && (
                <p className="text-xs text-center max-w-md">
                  Se intentó cargar desde una fuente alternativa
                </p>
              )}
            </div>
          ) : (
            <img
              src={currentImageUrl}
              alt={imageAlt}
              className={cn(
                "object-contain max-w-full h-auto transition-transform duration-200"
              )}
              style={{ transform: `scale(${zoom / 100})` }}
              loading="lazy"
              onError={handleImageError}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
