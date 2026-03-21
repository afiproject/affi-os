export type Crowdedness = 'empty' | 'normal' | 'crowded'
export type Atmosphere = 'quiet' | 'normal' | 'lively'
export type GenderRatio = 'male_heavy' | 'balanced' | 'female_heavy'
export type SpotCategory = 'bar' | 'cafe' | 'restaurant' | 'club' | 'other'

export interface Spot {
  id: string
  name: string
  category: SpotCategory
  latitude: number
  longitude: number
  address: string | null
  google_place_id: string | null
  created_at: string
}

export interface Report {
  id: string
  spot_id: string
  crowdedness: Crowdedness
  atmosphere: Atmosphere
  gender_ratio: GenderRatio
  comment: string | null
  created_at: string
  expires_at: string
}

export interface SpotWithReports extends Spot {
  reports: Report[]
  latest_report: Report | null
  report_count: number
}

export interface Database {
  public: {
    Tables: {
      spots: {
        Row: Spot
        Insert: Omit<Spot, 'id' | 'created_at'>
        Update: Partial<Omit<Spot, 'id' | 'created_at'>>
      }
      reports: {
        Row: Report
        Insert: Omit<Report, 'id' | 'created_at' | 'expires_at'>
        Update: Partial<Omit<Report, 'id' | 'created_at' | 'expires_at'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
