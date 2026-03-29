export interface GpsPoint {
  timestamp: string;
  lat: number;
  lng: number;
  label: string;
}

export interface ScheduleEntry {
  startTime: string;
  endTime: string;
  activity: string;
  location: string;
  imageKey: string;
}

export interface DiaryPage {
  pageNumber: number;
  imageUrl: string;
  illustrationUrl: string;
  text: string;
  timeRange: string;
  activity: string;
}

export interface Diary {
  childName: string;
  date: string;
  pages: DiaryPage[];
  gpsTrace: GpsPoint[];
}

export interface GenerateDiaryRequest {
  date: string;
  childName?: string;
}

export interface GenerateDiaryResponse {
  diary: Diary;
}

export interface UploadedPhoto {
  url: string;
  label: string;
  time: string;
}

export interface GenerateFromPhotosRequest {
  childName: string;
  date: string;
  photos: UploadedPhoto[];
  schedule?: ScheduleEntry[];
}
