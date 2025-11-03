import { z } from "zod";

export const goshuinStatusValues = [
  "planned",
  "collected",
  "missed",
] as const;

export type GoshuinStatus = (typeof goshuinStatusValues)[number];

export const goshuinStatusLabels: Record<GoshuinStatus, string> = {
  planned: "Planned",
  collected: "Collected",
  missed: "Missed",
};

export const goshuinAcquisitionMethodValues = [
  "in_person",
  "by_mail",
  "event",
  "online",
] as const;

export type GoshuinAcquisitionMethod =
  (typeof goshuinAcquisitionMethodValues)[number];

export const goshuinAcquisitionMethodLabels: Record<
  GoshuinAcquisitionMethod,
  string
> = {
  in_person: "In person",
  by_mail: "By mail",
  event: "Event",
  online: "Online",
};

export const goshuinRatingOptions = [1, 2, 3, 4, 5] as const;

const ratingSchema = z
  .string()
  .optional()
  .refine((value) => {
    if (!value || value.trim() === "") {
      return true;
    }
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5;
  }, "Rating must be between 1 and 5")
  .transform((value) => {
    if (!value || value.trim() === "") {
      return undefined;
    }
    return Number(value);
  });

export const goshuinFormSchema = z
  .object({
    visit_date: z
      .string()
      .min(1, { message: "Visit date is required" })
      .regex(/\d{4}-\d{2}-\d{2}/, {
        message: "Visit date must be in YYYY-MM-DD format",
      })
      .refine((value) => {
        const visitDate = new Date(value);
        if (Number.isNaN(visitDate.getTime())) {
          return false;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return visitDate <= today;
      }, { message: "Visit date cannot be in the future" }),
    acquisition_method: z.enum(goshuinAcquisitionMethodValues, {
      required_error: "Acquisition method is required",
    }),
    status: z.enum(goshuinStatusValues, {
      required_error: "Status is required",
    }),
    rating: ratingSchema,
    notes: z
      .string()
      .optional()
      .transform((value) => {
        if (!value) {
          return undefined;
        }
        const trimmed = value.trim();
        return trimmed.length ? trimmed : undefined;
      }),
  })
  .strict();

export type GoshuinFormInput = z.infer<typeof goshuinFormSchema>;

export interface GoshuinRecord {
  id: string;
  user_id: string;
  spot_id: string;
  visit_date: string;
  acquisition_method: GoshuinAcquisitionMethod;
  status: GoshuinStatus;
  rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedGoshuinResponse {
  items: GoshuinRecord[];
  total: number;
  page: number;
  size: number;
}
