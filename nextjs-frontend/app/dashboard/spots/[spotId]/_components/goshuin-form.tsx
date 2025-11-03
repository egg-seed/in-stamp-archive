"use client";

import {
  ChangeEvent,
  FormEvent,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";

import { ActionState } from "@/components/actions/goshuin-actions";
import {
  GoshuinAcquisitionMethod,
  GoshuinStatus,
  goshuinAcquisitionMethodLabels,
  goshuinAcquisitionMethodValues,
  goshuinRatingOptions,
  goshuinStatusLabels,
  goshuinStatusValues,
} from "@/lib/goshuin";
import { renderMarkdown } from "@/lib/markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initialState: ActionState = { success: false };

interface GoshuinFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  initialValues?: {
    visit_date?: string;
    acquisition_method?: GoshuinAcquisitionMethod;
    status?: GoshuinStatus;
    rating?: number | null;
    notes?: string | null;
  };
  enableImageUpload?: boolean;
  confirmMessage?: string;
  onSuccess?: () => void;
  className?: string;
}

const SubmitButton = ({ label }: { label: string }) => {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="self-end">
      {pending ? "Saving..." : label}
    </Button>
  );
};

export const GoshuinForm = ({
  action,
  submitLabel,
  initialValues,
  enableImageUpload = false,
  confirmMessage,
  onSuccess,
  className,
}: GoshuinFormProps) => {
  const [state, formAction] = useActionState(action, initialState);
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setNotes(initialValues?.notes ?? "");
  }, [initialValues?.notes]);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setSelectedFiles([]);
      if (!initialValues?.notes) {
        setNotes("");
      }
      onSuccess?.();
    }
  }, [state.success, onSuccess, initialValues?.notes]);

  const preview = useMemo(() => {
    if (!notes) {
      return "";
    }
    return renderMarkdown(notes);
  }, [notes]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      event.preventDefault();
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) {
      setSelectedFiles([]);
      return;
    }
    setSelectedFiles(Array.from(files).map((file) => file.name));
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      className={cn(
        "space-y-6 rounded-lg border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900",
        className,
      )}
      encType={enableImageUpload ? "multipart/form-data" : undefined}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="visit_date">Visit date</Label>
          <Input
            id="visit_date"
            name="visit_date"
            type="date"
            required
            defaultValue={initialValues?.visit_date ?? ""}
          />
          {state.fieldErrors?.visit_date && (
            <p className="text-sm text-red-500">
              {state.fieldErrors.visit_date[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="acquisition_method">Acquisition method</Label>
          <select
            id="acquisition_method"
            name="acquisition_method"
            required
            defaultValue={initialValues?.acquisition_method ?? ""}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>
              Select method
            </option>
            {goshuinAcquisitionMethodValues.map((value) => (
              <option key={value} value={value}>
                {goshuinAcquisitionMethodLabels[value]}
              </option>
            ))}
          </select>
          {state.fieldErrors?.acquisition_method && (
            <p className="text-sm text-red-500">
              {state.fieldErrors.acquisition_method[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">Visit status</Label>
          <select
            id="status"
            name="status"
            required
            defaultValue={initialValues?.status ?? ""}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>
              Select status
            </option>
            {goshuinStatusValues.map((value) => (
              <option key={value} value={value}>
                {goshuinStatusLabels[value]}
              </option>
            ))}
          </select>
          {state.fieldErrors?.status && (
            <p className="text-sm text-red-500">
              {state.fieldErrors.status[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="rating">Rating</Label>
          <select
            id="rating"
            name="rating"
            defaultValue={
              typeof initialValues?.rating === "number"
                ? String(initialValues.rating)
                : ""
            }
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No rating</option>
            {goshuinRatingOptions.map((rating) => (
              <option key={rating} value={rating}>
                {rating} / 5
              </option>
            ))}
          </select>
          {state.fieldErrors?.rating && (
            <p className="text-sm text-red-500">
              {state.fieldErrors.rating[0]}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Markdown supported)</Label>
        <textarea
          id="notes"
          name="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={6}
          placeholder="Record highlights from your visit, prayer details, or reflections."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {state.fieldErrors?.notes && (
          <p className="text-sm text-red-500">
            {state.fieldErrors.notes[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Markdown preview</Label>
        {preview ? (
          <div
            className="prose prose-sm max-w-none rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Start writing notes to see a preview.
          </p>
        )}
      </div>

      {enableImageUpload && (
        <div className="space-y-2">
          <Label htmlFor="images">Upload goshuin images</Label>
          <input
            id="images"
            name="images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
          />
          {selectedFiles.length > 0 && (
            <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300">
              {selectedFiles.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {state.message && (
        <p
          className={`text-sm ${
            state.success ? "text-green-600" : "text-red-500"
          }`}
        >
          {state.message}
        </p>
      )}

      <div className="flex justify-end">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
};
