import exifr from 'exifr';

export async function extractTimestamp(file: File): Promise<string | null> {
  try {
    const tags = await exifr.parse(file, {
      pick: ['DateTimeOriginal', 'CreateDate', 'GPSDateStamp'],
    });

    const date = tags?.DateTimeOriginal ?? tags?.CreateDate ?? tags?.GPSDateStamp;
    if (date instanceof Date) {
      return date.toISOString();
    }
    if (typeof date === 'string') {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
    }

    return null;
  } catch {
    return null;
  }
}
