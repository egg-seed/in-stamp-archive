export type SpotType = "shrine" | "temple" | "museum" | "other";

export interface Spot {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  prefecture: string | null;
  spot_type: SpotType;
  slug: string;
  city: string | null;
  website_url: string | null;
  phone_number: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export type SpotImageType = "exterior" | "interior" | "map" | "other";

export interface SpotImage {
  id: string;
  image_url: string;
  image_type: SpotImageType;
  is_primary: boolean;
  display_order: number;
}

export type GoshuinStatus = "planned" | "collected" | "missed";
export type GoshuinAcquisitionMethod =
  | "in_person"
  | "by_mail"
  | "event"
  | "online";

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

export const SPOT_TYPE_LABELS: Record<SpotType, string> = {
  shrine: "Shrine",
  temple: "Temple",
  museum: "Museum",
  other: "Other",
};

export const SPOT_IMAGE_TYPE_LABELS: Record<SpotImageType, string> = {
  exterior: "Exterior",
  interior: "Interior",
  map: "Map",
  other: "Other",
};
