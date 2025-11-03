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
import { SPOT_IMAGE_TYPE_LABELS, SpotImage, SpotImageType } from "@/lib/spots";

interface SpotGalleryManagerProps {
  spotId: string;
  images: SpotImage[];
  onUpdated?: (images: SpotImage[]) => void;
}

const IMAGE_TYPE_OPTIONS: SpotImageType[] = [
  "exterior",
  "interior",
  "map",
  "other",
];

export default function SpotGalleryManager({
  spotId,
  images,
  onUpdated,
}: SpotGalleryManagerProps) {
  const [imageList, setImageList] = useState<SpotImage[]>(images);
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [reorderDraft, setReorderDraft] = useState<SpotImage[]>(images);
  const [isPrimaryDialogOpen, setIsPrimaryDialogOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [metadataDraft, setMetadataDraft] = useState<Record<string, SpotImageType>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setImageList(images);
    setReorderDraft(images);
    setMetadataDraft(
      images.reduce<Record<string, SpotImageType>>((acc, image) => {
        acc[image.id] = image.image_type;
        return acc;
      }, {}),
    );
  }, [images]);

  const selectedImage = useMemo(
    () => imageList.find((image) => image.id === selectedImageId) ?? null,
    [imageList, selectedImageId],
  );

  function updateState(nextImages: SpotImage[]) {
    setImageList(nextImages);
    setReorderDraft(nextImages);
    setMetadataDraft(() => {
      const next: Record<string, SpotImageType> = {};
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

  function handleOpenPrimaryDialog(imageId: string) {
    setSelectedImageId(imageId);
    setIsPrimaryDialogOpen(true);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function commitReorder() {
    startTransition(async () => {
      setErrorMessage(null);
      try {
        const response = await fetch(`/api/spots/${spotId}/images/reorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_ids: reorderDraft.map((image) => image.id) }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.detail ?? "Unable to reorder images");
        }
        const updatedImages = (await response.json()) as SpotImage[];
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

  async function commitPrimarySelection() {
    if (!selectedImage) {
      return;
    }
    startTransition(async () => {
      setErrorMessage(null);
      try {
        const response = await fetch(
          `/api/spots/${spotId}/images/${selectedImage.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_primary: true, image_type: metadataDraft[selectedImage.id] }),
          },
        );
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.detail ?? "Unable to update image");
        }
        const updatedImage = (await response.json()) as SpotImage;
        const nextImages = imageList.map((image) =>
          image.id === updatedImage.id
            ? updatedImage
            : { ...image, is_primary: false },
        );
        updateState(nextImages.sort((a, b) => a.display_order - b.display_order));
        setSuccessMessage("Primary image updated");
        setIsPrimaryDialogOpen(false);
      } catch (exception) {
        const message =
          exception instanceof Error ? exception.message : "Unable to update image";
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
              alt="Spot gallery item"
              className="h-48 w-full object-cover"
            />
            <figcaption className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground">
              <div className="flex flex-col">
                <span>{SPOT_IMAGE_TYPE_LABELS[image.image_type]}</span>
                <span className="text-xs">Order: {image.display_order + 1}</span>
              </div>
              <div className="flex items-center gap-2">
                {image.is_primary ? (
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    Primary
                  </span>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenPrimaryDialog(image.id)}
                >
                  Manage
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
                    {SPOT_IMAGE_TYPE_LABELS[image.image_type]}
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

      <Dialog open={isPrimaryDialogOpen} onOpenChange={setIsPrimaryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update image settings</DialogTitle>
            <DialogDescription>
              Choose the primary image and adjust its type metadata.
            </DialogDescription>
          </DialogHeader>
          {selectedImage ? (
            <div className="space-y-4">
              <img
                src={selectedImage.image_url}
                alt="Selected spot image"
                className="h-48 w-full rounded-lg object-cover"
              />
              <div className="space-y-2">
                <label className="text-sm font-medium">Image type</label>
                <Select
                  value={metadataDraft[selectedImage.id] ?? selectedImage.image_type}
                  onValueChange={(value) =>
                    setMetadataDraft((previous) => ({
                      ...previous,
                      [selectedImage.id]: value as SpotImageType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMAGE_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {SPOT_IMAGE_TYPE_LABELS[option]}
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
              onClick={() => setIsPrimaryDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={commitPrimarySelection} disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
