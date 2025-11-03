export interface Spot {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  prefecture: string | null;
  spot_type: string;
  slug: string;
  city: string | null;
  website_url: string | null;
  phone_number: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}
