"use client";

import { FormEvent, useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { ActionState } from "@/components/actions/goshuin-actions";
import {
  GoshuinRecord,
  goshuinAcquisitionMethodLabels,
  goshuinStatusLabels,
} from "@/lib/goshuin";
import { renderMarkdown } from "@/lib/markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoshuinForm } from "./goshuin-form";

const deleteInitialState: ActionState = { success: false };

const DeleteButton = ({ label }: { label: string }) => {
  const { pending } = useFormStatus();
  return (
    <Button variant="destructive" type="submit" disabled={pending} className="w-full md:w-auto">
      {pending ? "Deleting..." : label}
    </Button>
  );
};

interface GoshuinCardProps {
  record: GoshuinRecord;
  updateAction: (state: ActionState, formData: FormData) => Promise<ActionState>;
  deleteAction: (state: ActionState, formData: FormData) => Promise<ActionState>;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

export const GoshuinCard = ({ record, updateAction, deleteAction }: GoshuinCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteState, deleteFormAction] = useActionState(
    deleteAction,
    deleteInitialState,
  );

  const markdown = useMemo(() => {
    if (!record.notes) {
      return "";
    }
    return renderMarkdown(record.notes);
  }, [record.notes]);

  const handleDeleteSubmit = (event: FormEvent<HTMLFormElement>) => {
    const confirmed = window.confirm(
      "Delete this goshuin record? This action cannot be undone.",
    );
    if (!confirmed) {
      event.preventDefault();
    }
  };

  if (isEditing) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Edit goshuin record</CardTitle>
          <CardDescription>
            Update visit details, notes, and upload additional images.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <GoshuinForm
            key={record.id}
            action={updateAction}
            submitLabel="Save changes"
            initialValues={{
              visit_date: record.visit_date,
              acquisition_method: record.acquisition_method,
              status: record.status,
              rating: record.rating,
              notes: record.notes,
            }}
            enableImageUpload
            confirmMessage="Save updates to this goshuin record?"
            onSuccess={() => setIsEditing(false)}
            className="border-none bg-transparent p-0 shadow-none"
          />
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="space-y-2 pb-4">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base font-semibold">
            {dateFormatter.format(new Date(record.visit_date))}
          </CardTitle>
          <Badge variant="secondary">{goshuinStatusLabels[record.status]}</Badge>
        </div>
        <CardDescription>
          Acquired via {goshuinAcquisitionMethodLabels[record.acquisition_method]}
          {record.rating ? ` · Rated ${record.rating}/5` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {record.notes ? (
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: markdown }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No notes recorded for this visit.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setIsEditing(true)}
          >
            Edit record
          </Button>
          <form
            action={deleteFormAction}
            onSubmit={handleDeleteSubmit}
            className="w-full sm:w-auto"
          >
            <DeleteButton label="Delete" />
          </form>
        </div>
        {deleteState.message && (
          <p
            className={`text-sm ${
              deleteState.success ? "text-green-600" : "text-red-500"
            }`}
          >
            {deleteState.message}
          </p>
        )}
      </CardFooter>
    </Card>
  );
};
