export type PlaceCategory =
  | 'station'
  | 'izakaya'
  | 'club'
  | 'aiseki'
  | 'cabaret'
  | 'host';

export interface Place {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: PlaceCategory;
}

export interface PlaceStatus {
  id: string;
  place_id: string;
  male_count: number;
  female_count: number;
  age_group: string;
  crowd_level: 'empty' | 'normal' | 'crowded';
  vibe_level: 'quiet' | 'normal' | 'hype';
  created_at: string;
}
