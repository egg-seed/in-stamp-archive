"use client";

import { useCallback, useState, useTransition, ChangeEvent, DragEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GoshuinRecord } from "@/lib/spots";

const ACQUISITION_METHODS = ["in_person", "mail", "proxy", "other"] as const;
const STATUSES = ["received", "pending", "not_available", "other"] as const;

const ACQUISITION_METHOD_LABELS: Record<typeof ACQUISITION_METHODS[number], string> = {
  in_person: "In Person",
  mail: "By Mail",
  proxy: "Proxy",
  other: "Other",
};

const STATUS_LABELS: Record<typeof STATUSES[number], string> = {
  received: "Received",
  pending: "Pending",
  not_available: "Not Available",
  other: "Other",
};

const goshuinSchema = z.object({
  visit_date: z.string().min(1, "Visit date is required"),
  acquisition_method: z.enum(ACQUISITION_METHODS),
  status: z.enum(STATUSES),
  rating: z.string().optional(),
  cost: z.string().optional(),
  notes: z.string().optional(),
});

type GoshuinFormValues = z.infer<typeof goshuinSchema>;

interface GoshuinFormProps {
  spotId: string;
  recordId?: string;
  defaultValues?: Partial<GoshuinFormValues>;
  onCompleted?: (record: GoshuinRecord) => void;
}

export function GoshuinForm({
  spotId,
  recordId,
  defaultValues,
  onCompleted,
}: GoshuinFormProps) {
  const form = useForm<GoshuinFormValues>({
    resolver: zodResolver(goshuinSchema),
    defaultValues: {
      visit_date: defaultValues?.visit_date || new Date().toISOString().split("T")[0],
      acquisition_method: defaultValues?.acquisition_method || "in_person",
      status: defaultValues?.status || "received",
      rating: defaultValues?.rating || "",
      cost: defaultValues?.cost || "",
      notes: defaultValues?.notes || "",
    },
  });

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  async function uploadImages(record: GoshuinRecord) {
    if (!pendingFiles.length) {
      return;
    }

    for (const file of pendingFiles) {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/goshuin/${record.id}/images/uploads`, {
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
      visit_date: values.visit_date,
      acquisition_method: values.acquisition_method,
      status: values.status,
      rating: values.rating ? Number(values.rating) : null,
      cost: values.cost ? Number(values.cost) : null,
      notes: values.notes || null,
    };

    startTransition(async () => {
      try {
        const response = await fetch(
          recordId ? `/api/goshuin/${recordId}` : `/api/spots/${spotId}/goshuin`,
          {
            method: recordId ? "PATCH" : "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) {
          const error = await response.json().catch(() => null);
          throw new Error(error?.detail ?? "Unable to save goshuin record");
        }

        const savedRecord = (await response.json()) as GoshuinRecord;

        await uploadImages(savedRecord);
        setPendingFiles([]);

        setStatusMessage(
          recordId
            ? "Goshuin record updated successfully"
            : "Goshuin record created successfully",
        );
        onCompleted?.(savedRecord);
      } catch (exception) {
        const message =
          exception instanceof Error ? exception.message : "Unable to save goshuin record";
        setErrorMessage(message);
      }
    });
  });

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-2xl border bg-background p-6 shadow"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="visit_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visit Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="acquisition_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Acquisition Method</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACQUISITION_METHODS.map((value) => (
                        <SelectItem key={value} value={value}>
                          {ACQUISITION_METHOD_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {STATUS_LABELS[value]}
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
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating (1-5)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    placeholder="Optional"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cost (¥)</FormLabel>
              <FormControl>
                <Input type="number" min="0" placeholder="Optional" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Add any notes about this goshuin"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
          {isPending
            ? "Saving..."
            : recordId
              ? "Update goshuin record"
              : "Create goshuin record"}
        </Button>
      </form>
    </Form>
  );
}
