"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import {
  GoshuinRecord,
  PaginatedGoshuinResponse,
  goshuinFormSchema,
  GoshuinFormInput,
} from "@/lib/goshuin";
import { Spot } from "@/lib/spots";
import {
  ApiRequestError,
  authedFetch,
  fetchJson,
  parseErrorResponse,
} from "@/lib/server-api";

export interface ActionState {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

const mapValidationErrors = (input: Record<string, string[] | undefined>) => {
  return Object.entries(input).reduce<Record<string, string[]>>(
    (accumulator, [key, value]) => {
      if (value && value.length) {
        accumulator[key] = value;
      }
      return accumulator;
    },
    {},
  );
};

export const fetchSpotDetail = async (spotId: string) => {
  try {
    return await fetchJson<Spot>(`/api/spots/${spotId}`);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      notFound();
    }
    throw error;
  }
};

export const fetchGoshuinRecordsForSpot = async (spotId: string) => {
  try {
    return await fetchJson<PaginatedGoshuinResponse>(
      `/api/goshuin?spot_id=${spotId}&size=100&sort_order=desc`,
    );
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return { items: [], total: 0, page: 1, size: 100 } satisfies PaginatedGoshuinResponse;
    }
    throw error;
  }
};

const parseFormData = (formData: FormData): GoshuinFormInput | null => {
  const parsed = goshuinFormSchema.safeParse({
    visit_date: formData.get("visit_date"),
    acquisition_method: formData.get("acquisition_method"),
    status: formData.get("status"),
    rating: formData.get("rating"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    throw parsed.error.flatten().fieldErrors;
  }

  return parsed.data;
};

const buildPayload = (values: GoshuinFormInput) => {
  return {
    visit_date: values.visit_date,
    acquisition_method: values.acquisition_method,
    status: values.status,
    rating: values.rating ?? null,
    notes: values.notes ?? null,
  } satisfies Partial<GoshuinRecord>;
};

const uploadImages = async (recordId: string, images: File[]) => {
  if (!images.length) {
    return;
  }

  for (const image of images) {
    if (typeof image === "string" || image.size === 0) {
      continue;
    }

    const body = new FormData();
    body.append("file", image);

    const response = await authedFetch(
      `/api/goshuin/${recordId}/images/uploads`,
      {
        method: "POST",
        body,
      },
    );

    if (!response.ok) {
      const message = await parseErrorResponse(response);
      throw new Error(message);
    }
  }
};

export const createGoshuinRecord = async (
  spotId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> => {
  let values: GoshuinFormInput;
  try {
    values = parseFormData(formData) as GoshuinFormInput;
  } catch (error) {
    return {
      success: false,
      fieldErrors: mapValidationErrors(error as Record<string, string[]>),
      message: "Please correct the highlighted fields.",
    };
  }

  const payload = buildPayload(values);

  try {
    const response = await authedFetch(`/api/spots/${spotId}/goshuin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const message = await parseErrorResponse(response);
      return { success: false, message };
    }

    const record = (await response.json()) as GoshuinRecord;

    const files = formData.getAll("images") as File[];
    try {
      await uploadImages(record.id, files);
    } catch (uploadError) {
      return {
        success: false,
        message:
          uploadError instanceof Error
            ? uploadError.message
            : "Failed to upload images.",
      };
    }

    revalidatePath(`/dashboard/spots/${spotId}`);
    return { success: true, message: "Goshuin record created." };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create goshuin record.",
    };
  }
};

export const updateGoshuinRecord = async (
  spotId: string,
  recordId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> => {
  let values: GoshuinFormInput;
  try {
    values = parseFormData(formData) as GoshuinFormInput;
  } catch (error) {
    return {
      success: false,
      fieldErrors: mapValidationErrors(error as Record<string, string[]>),
      message: "Please correct the highlighted fields.",
    };
  }

  const payload = buildPayload(values);

  try {
    const response = await authedFetch(`/api/goshuin/${recordId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const message = await parseErrorResponse(response);
      return { success: false, message };
    }

    const files = formData.getAll("images") as File[];
    if (files.length) {
      try {
        await uploadImages(recordId, files);
      } catch (uploadError) {
        return {
          success: false,
          message:
            uploadError instanceof Error
              ? uploadError.message
              : "Failed to upload images.",
        };
      }
    }

    revalidatePath(`/dashboard/spots/${spotId}`);
    return { success: true, message: "Goshuin record updated." };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update goshuin record.",
    };
  }
};

export const deleteGoshuinRecord = async (
  spotId: string,
  recordId: string,
  _prevState: ActionState,
  _formData: FormData,
): Promise<ActionState> => {
  void _prevState;
  void _formData;
  try {
    const response = await authedFetch(`/api/goshuin/${recordId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const message = await parseErrorResponse(response);
      return { success: false, message };
    }

    revalidatePath(`/dashboard/spots/${spotId}`);
    return { success: true, message: "Goshuin record deleted." };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete goshuin record.",
    };
  }
};
