export interface GpsPoint {
  timestamp: string;
  lat: number;
  lng: number;
  label: string;
}

export interface ScheduleEntry {
  day: string;
  startTime: string;
  endTime: string;
  activity: string;
  location: string;
  imageKey: string;
}

export interface DiaryPage {
  pageNumber: number;
  imageUrl: string;
  placesImageUrl?: string;
  illustrationUrl: string;
  text: string;
  timeRange: string;
  activity: string;
}

export interface Diary {
  date: string;
  pages: DiaryPage[];
  gpsTrace: GpsPoint[];
}

export interface GenerateDiaryResponse {
  diary: Diary;
}

export interface PhotoWithTimestamp {
  url: string;
  timestamp: string;
  label?: string;
}

export interface GpsInputPoint {
  timestamp: string;
  lat: number;
  lng: number;
}

export interface StayCluster {
  centroid: { lat: number; lng: number };
  startTime: string;
  endTime: string;
  points: GpsInputPoint[];
  placeName?: string;
  placeTypes?: string[];
  photoRef?: string;
  placeSource?: 'preset' | 'google-places' | 'fallback';
}

export interface PresetLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusM: number;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateUnifiedRequest {
  date: string;
  gpsPoints: GpsInputPoint[];
  photos: PhotoWithTimestamp[];
  curriculum?: ScheduleEntry[];
}
