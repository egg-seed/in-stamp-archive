"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface GoshuinImage {
  id: string;
  goshuin_record_id: string;
  image_url: string;
  thumbnail_url?: string;
  image_type: GoshuinImageType;
  display_order: number;
  created_at: string;
  updated_at: string;
}

type GoshuinImageType = "main" | "detail" | "other";

const GOSHUIN_IMAGE_TYPE_LABELS: Record<GoshuinImageType, string> = {
  main: "Main",
  detail: "Detail",
  other: "Other",
};

interface GoshuinGalleryManagerProps {
  recordId: string;
  images: GoshuinImage[];
  onUpdated?: (images: GoshuinImage[]) => void;
}

const IMAGE_TYPE_OPTIONS: GoshuinImageType[] = ["main", "detail", "other"];

export default function GoshuinGalleryManager({
  recordId,
  images,
  onUpdated,
}: GoshuinGalleryManagerProps) {
  const [imageList, setImageList] = useState<GoshuinImage[]>(images);
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [reorderDraft, setReorderDraft] = useState<GoshuinImage[]>(images);
  const [isMetadataDialogOpen, setIsMetadataDialogOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [metadataDraft, setMetadataDraft] = useState<Record<string, GoshuinImageType>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setImageList(images);
    setReorderDraft(images);
    setMetadataDraft(
      images.reduce<Record<string, GoshuinImageType>>((acc, image) => {
        acc[image.id] = image.image_type;
        return acc;
      }, {}),
    );
  }, [images]);

  const selectedImage = useMemo(
    () => imageList.find((image) => image.id === selectedImageId) ?? null,
    [imageList, selectedImageId],
  );

  function updateState(nextImages: GoshuinImage[]) {
    setImageList(nextImages);
    setReorderDraft(nextImages);
    setMetadataDraft(() => {
      const next: Record<string, GoshuinImageType> = {};
      nextImages.forEach((image) => {
        next[image.id] = image.image_type;
      });
      return next;
    });
    onUpdated?.(nextImages);
  }

  function moveImage(imageId: string, direction: "up" | "down") {
    const index = reorderDraft.findIndex((image) => image.id === imageId);
    if (index === -1) {
      return;
    }
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= reorderDraft.length) {
      return;
    }
    const nextDraft = [...reorderDraft];
    const [removed] = nextDraft.splice(index, 1);
    nextDraft.splice(targetIndex, 0, removed);
    setReorderDraft(nextDraft);
  }

  function handleOpenMetadataDialog(imageId: string) {
    setSelectedImageId(imageId);
    setIsMetadataDialogOpen(true);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function commitReorder() {
    startTransition(async () => {
      setErrorMessage(null);
      try {
        const response = await fetch(`/api/goshuin/${recordId}/images/reorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_ids: reorderDraft.map((image) => image.id) }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.detail ?? "Unable to reorder images");
        }
        const updatedImages = (await response.json()) as GoshuinImage[];
        updateState(updatedImages);
        setSuccessMessage("Image order updated");
        setIsReorderOpen(false);
      } catch (exception) {
        const message =
          exception instanceof Error ? exception.message : "Unable to reorder images";
        setErrorMessage(message);
      }
    });
  }

  async function commitMetadataUpdate() {
    if (!selectedImage) {
      return;
    }
    startTransition(async () => {
      setErrorMessage(null);
      try {
        const response = await fetch(
          `/api/goshuin/${recordId}/images/${selectedImage.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_type: metadataDraft[selectedImage.id] }),
          },
        );
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.detail ?? "Unable to update image");
        }
        const updatedImage = (await response.json()) as GoshuinImage;
        const nextImages = imageList.map((image) =>
          image.id === updatedImage.id ? updatedImage : image,
        );
        updateState(nextImages.sort((a, b) => a.display_order - b.display_order));
        setSuccessMessage("Image metadata updated");
        setIsMetadataDialogOpen(false);
      } catch (exception) {
        const message =
          exception instanceof Error ? exception.message : "Unable to update image";
        setErrorMessage(message);
      }
    });
  }

  async function deleteImage(imageId: string) {
    if (!confirm("Are you sure you want to delete this image?")) {
      return;
    }

    startTransition(async () => {
      setErrorMessage(null);
      try {
        const response = await fetch(`/api/goshuin/${recordId}/images/${imageId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.detail ?? "Unable to delete image");
        }
        const nextImages = imageList.filter((image) => image.id !== imageId);
        updateState(nextImages);
        setSuccessMessage("Image deleted");
      } catch (exception) {
        const message =
          exception instanceof Error ? exception.message : "Unable to delete image";
        setErrorMessage(message);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsReorderOpen(true);
            setSuccessMessage(null);
            setErrorMessage(null);
          }}
          disabled={imageList.length < 2}
        >
          Reorder images
        </Button>
        {successMessage ? (
          <span className="text-sm text-emerald-600">{successMessage}</span>
        ) : null}
        {errorMessage ? (
          <span className="text-sm text-destructive">{errorMessage}</span>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {imageList.map((image) => (
          <figure
            key={image.id}
            className="overflow-hidden rounded-xl border bg-background shadow-sm"
          >
            <img
              src={image.image_url}
              alt="Goshuin image"
              className="h-48 w-full object-cover"
            />
            <figcaption className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground">
              <div className="flex flex-col">
                <span>{GOSHUIN_IMAGE_TYPE_LABELS[image.image_type]}</span>
                <span className="text-xs">Order: {image.display_order + 1}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenMetadataDialog(image.id)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteImage(image.id)}
                  className="text-destructive hover:text-destructive"
                >
                  Delete
                </Button>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      <Dialog open={isReorderOpen} onOpenChange={setIsReorderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reorder gallery</DialogTitle>
            <DialogDescription>
              Use the controls to rearrange images. Changes will be saved when you
              confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            {reorderDraft.map((image, index) => (
              <div
                key={image.id}
                className="flex items-center justify-between rounded-lg border bg-muted/40 p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">#{index + 1}</span>
                  <span className="text-sm text-muted-foreground">
                    {GOSHUIN_IMAGE_TYPE_LABELS[image.image_type]}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => moveImage(image.id, "up")}
                    disabled={index === 0}
                  >
                    Up
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => moveImage(image.id, "down")}
                    disabled={index === reorderDraft.length - 1}
                  >
                    Down
                  </Button>
                </div>
              </div>
            ))}
            {!reorderDraft.length ? (
              <p className="text-sm text-muted-foreground">No images to reorder.</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReorderOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={commitReorder} disabled={isPending}>
              {isPending ? "Saving..." : "Save order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isMetadataDialogOpen} onOpenChange={setIsMetadataDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update image settings</DialogTitle>
            <DialogDescription>Adjust the image type metadata.</DialogDescription>
          </DialogHeader>
          {selectedImage ? (
            <div className="space-y-4">
              <img
                src={selectedImage.image_url}
                alt="Selected goshuin image"
                className="h-48 w-full rounded-lg object-cover"
              />
              <div className="space-y-2">
                <label className="text-sm font-medium">Image type</label>
                <Select
                  value={metadataDraft[selectedImage.id] ?? selectedImage.image_type}
                  onValueChange={(value) =>
                    setMetadataDraft((previous) => ({
                      ...previous,
                      [selectedImage.id]: value as GoshuinImageType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMAGE_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {GOSHUIN_IMAGE_TYPE_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsMetadataDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={commitMetadataUpdate} disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
