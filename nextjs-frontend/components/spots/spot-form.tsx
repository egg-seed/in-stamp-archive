"use client";

import type { ChangeEvent, DragEvent } from "react";
import { useCallback, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { geocodeAddress } from "@/lib/geocoding";
import { SPOT_TYPE_LABELS, Spot, SpotType } from "@/lib/spots";

const spotFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z.string().trim().min(1, "Slug is required"),
  spot_type: z.enum(["shrine", "temple", "museum", "other"] as [SpotType, ...SpotType[]]),
  description: z.string().optional().default(""),
  prefecture: z.string().optional().default(""),
  city: z.string().optional().default(""),
  address: z.string().optional().default(""),
  website_url: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? "")
    .refine(
      (value) => !value || /^https?:\/\//.test(value),
      "Website should be a valid URL",
    ),
  phone_number: z.string().optional().default(""),
  latitude: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? "")
    .refine(
      (value) => !value || !Number.isNaN(Number(value)),
      "Latitude must be a number",
    ),
  longitude: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? "")
    .refine(
      (value) => !value || !Number.isNaN(Number(value)),
      "Longitude must be a number",
    ),
});

export type SpotFormValues = z.infer<typeof spotFormSchema>;

interface SpotFormProps {
  spotId?: string;
  defaultValues?: Partial<Spot>;
  onCompleted?: (spot: Spot) => void;
}

const SPOT_TYPE_OPTIONS: SpotType[] = ["shrine", "temple", "museum", "other"];

export default function SpotForm({
  spotId,
  defaultValues,
  onCompleted,
}: SpotFormProps) {
  const form = useForm<SpotFormValues>({
    resolver: zodResolver(spotFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      slug: defaultValues?.slug ?? "",
      spot_type: (defaultValues?.spot_type as SpotType) ?? "shrine",
      description: defaultValues?.description ?? "",
      prefecture: defaultValues?.prefecture ?? "",
      city: defaultValues?.city ?? "",
      address: defaultValues?.address ?? "",
      website_url: defaultValues?.website_url ?? "",
      phone_number: defaultValues?.phone_number ?? "",
      latitude:
        typeof defaultValues?.latitude === "number"
          ? String(defaultValues.latitude)
          : "",
      longitude:
        typeof defaultValues?.longitude === "number"
          ? String(defaultValues.longitude)
          : "",
    },
  });

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeMessage, setGeocodeMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [watchAddress, watchCity, watchPrefecture] = form.watch([
    "address",
    "city",
    "prefecture",
  ]);

  const addressPreview = [watchAddress, watchCity, watchPrefecture]
    .filter((part) => part && part.trim())
    .join(" ");

  const addFiles = useCallback((files: FileList | File[]) => {
    const unique = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!unique.length) {
      return;
    }
    setPendingFiles((previous) => {
      const existingKeys = new Set(
        previous.map((file) => `${file.name}-${file.size}-${file.lastModified}`),
      );
      const nextFiles = unique.filter((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (existingKeys.has(key)) {
          return false;
        }
        existingKeys.add(key);
        return true;
      });
      return [...previous, ...nextFiles];
    });
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (event.dataTransfer?.files) {
        addFiles(event.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const handleFileInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
        addFiles(event.target.files);
      }
    },
    [addFiles],
  );

  async function uploadImages(spot: Spot) {
    if (!pendingFiles.length) {
      return;
    }

    for (const file of pendingFiles) {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/spots/${spot.id}/images`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Failed to upload image ${file.name}`);
      }
    }
  }

  const onSubmit = form.handleSubmit((values) => {
    setStatusMessage(null);
    setErrorMessage(null);

    const payload = {
      name: values.name,
      slug: values.slug,
      spot_type: values.spot_type,
      description: values.description || null,
      prefecture: values.prefecture || null,
      city: values.city || null,
      address: values.address || null,
      website_url: values.website_url || null,
      phone_number: values.phone_number || null,
      latitude: values.latitude ? Number(values.latitude) : null,
      longitude: values.longitude ? Number(values.longitude) : null,
    };

    startTransition(async () => {
      try {
        const response = await fetch(
          spotId ? `/api/spots/${spotId}` : "/api/spots",
          {
            method: spotId ? "PATCH" : "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) {
          const error = await response.json().catch(() => null);
          throw new Error(error?.detail ?? "Unable to save spot");
        }

        const savedSpot = (await response.json()) as Spot;

        await uploadImages(savedSpot);
        setPendingFiles([]);

        setStatusMessage(
          spotId ? "Spot updated successfully" : "Spot created successfully",
        );
        onCompleted?.(savedSpot);
      } catch (exception) {
        const message =
          exception instanceof Error ? exception.message : "Unable to save spot";
        setErrorMessage(message);
      }
    });
  });

  async function handleGeocode() {
    const query = addressPreview;
    if (!query) {
      setGeocodeMessage("Provide an address or city before geocoding.");
      return;
    }
    setIsGeocoding(true);
    setGeocodeMessage(null);
    try {
      const result = await geocodeAddress(query);
      if (!result) {
        setGeocodeMessage("No coordinates found for the provided address.");
        return;
      }
      form.setValue("latitude", result.latitude.toFixed(6));
      form.setValue("longitude", result.longitude.toFixed(6));
      setGeocodeMessage(`Coordinates updated from: ${result.displayName}`);
    } catch (exception) {
      const message =
        exception instanceof Error
          ? exception.message
          : "Failed to look up coordinates";
      setGeocodeMessage(message);
    } finally {
      setIsGeocoding(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-2xl border bg-background p-6 shadow"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Meiji Jingu" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input placeholder="meiji-jingu" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="spot_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Spot type</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPOT_TYPE_OPTIONS.map((value) => (
                        <SelectItem key={value} value={value}>
                          {SPOT_TYPE_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="website_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Add historical notes or highlights"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="prefecture"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prefecture</FormLabel>
                <FormControl>
                  <Input placeholder="Tokyo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Shibuya" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="1-1 Yoyogikamizono-cho" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone number</FormLabel>
                <FormControl>
                  <Input placeholder="+81 3-0000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">
              Geocoding helper
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleGeocode}
                disabled={isGeocoding}
              >
                {isGeocoding ? "Searching..." : "Auto-fill coordinates"}
              </Button>
            </div>
            {geocodeMessage ? (
              <p className="text-xs text-muted-foreground">{geocodeMessage}</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude</FormLabel>
                <FormControl>
                  <Input placeholder="35.6762" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude</FormLabel>
                <FormControl>
                  <Input placeholder="139.6503" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <section className="space-y-4">
          <header className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Image uploads</h2>
            <p className="text-sm text-muted-foreground">
              Drag and drop images or select files to upload after saving.
            </p>
          </header>
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/40 bg-muted/30 p-6 text-center"
          >
            <p className="text-sm text-muted-foreground">
              Drop images here or click to browse
            </p>
            <label className="cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm">
              Select files
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={handleFileInput}
              />
            </label>
          </div>
          {pendingFiles.length ? (
            <ul className="space-y-2 text-sm">
              {pendingFiles.map((file, index) => (
                <li
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  className="flex items-center justify-between rounded-md border bg-background px-3 py-2"
                >
                  <span className="truncate pr-2">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setPendingFiles((previous) =>
                        previous.filter((_, i) => i !== index),
                      )
                    }
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {errorMessage ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}
        {statusMessage ? (
          <div className="rounded-md border border-emerald-400/50 bg-emerald-100/60 p-3 text-sm text-emerald-700">
            {statusMessage}
          </div>
        ) : null}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : spotId ? "Update spot" : "Create spot"}
        </Button>
      </form>
    </Form>
  );
}
