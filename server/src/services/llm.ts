import { readFileSync } from 'fs';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface PageContext {
  activity: string;
  location: string;
  timeRange: string;
  pageNumber: number;
  totalPages: number;
  curriculumHint?: string;
}

/**
 * Generate diary text for showcase mode (from schedule data, no photo).
 */
export async function generatePageText(context: PageContext): Promise<string> {
  const { activity, location, timeRange, curriculumHint } = context;

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('No OPENROUTER_API_KEY');

    const curriculumLine = curriculumHint
      ? `\nThe school curriculum says this period is: ${curriculumHint}. Use this as context to enrich the entry.`
      : '';

    const prompt = `Write 1-2 short sentences for a child's visual diary.
Speak in second person ("you"). Warm and gentle tone.
End with one simple question related to the activity to prompt the child to share.
Keep it brief — no more than 30 words. Do not use names or "dear".
Focus only on the given activity — do not assume meals or other activities based on time of day.

Activity: ${activity}
Time: ${timeRange}
Location: ${location}${curriculumLine}

Output only the diary text.`;

    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`OpenRouter returned ${res.status}`);

    const data: any = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Empty response');
    return text;
  } catch (err) {
    console.error('[LLM] generatePageText failed:', err);
    return fallbackText(context);
  }
}

interface ScheduleContext {
  activity?: string;
  timeRange?: string;
  location?: string;
}

/**
 * Generate diary text from a photo (multimodal). Schedule context is optional hint.
 */
export async function generatePageTextFromPhoto(
  imagePath: string,
  scheduleCtx?: ScheduleContext,
): Promise<{ text: string; activity: string; place: string }> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('No OPENROUTER_API_KEY');

    const imageBuffer = readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

    const scheduleHint = scheduleCtx?.activity
      ? `\nSchedule hint: this might be "${scheduleCtx.activity}"${scheduleCtx.timeRange ? ` (${scheduleCtx.timeRange})` : ''}. Use this as context but describe what you SEE.`
      : '';

    const prompt = `Look at this photo from a child's school day.${scheduleHint}

Do THREE things:

1. LABEL: a short place/room name (2-3 words) that describes WHERE this is happening. Think like a room name on a school map — e.g. "Reading Room", "Art Studio", "Music Hall", "Dining Hall", "Science Lab", "Craft Corner", "Play Yard". Do NOT just repeat the activity name.
2. ACTIVITY: a short activity description (2-4 words) of what is happening, e.g. "Story Time", "Painting Session", "Lunch Break".
3. TEXT: 1-2 short sentences for a visual diary. Speak in second person ("you"). Describe the scene generally — do not invent details not visible in the photo. End with one simple question. Keep it under 30 words. Do not use names or "dear".

Format exactly:
LABEL: ...
ACTIVITY: ...
TEXT: ...`;

    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        }],
      }),
    });

    if (!res.ok) throw new Error(`OpenRouter returned ${res.status}`);

    const data: any = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new Error('Empty response');

    const labelMatch = raw.match(/LABEL:\s*(.+)/i);
    const activityMatch = raw.match(/ACTIVITY:\s*(.+)/i);
    const textMatch = raw.match(/TEXT:\s*([\s\S]+)/i);

    const place = labelMatch?.[1]?.trim().replace(/\*+/g, '') || 'Activity Room';
    const activity = activityMatch?.[1]?.trim().replace(/\*+/g, '') || place;
    const text = textMatch?.[1]?.trim() || raw.replace(/LABEL:.*\n?/i, '').replace(/ACTIVITY:.*\n?/i, '').trim();

    return { activity, text, place };
  } catch {
    return {
      activity: 'Activity',
      place: 'Activity Room',
      text: 'Looks like a fun moment! What do you remember about this?',
    };
  }
}

/**
 * Parse a schedule image into structured entries using multimodal LLM.
 */
export async function parseScheduleImage(imagePath: string): Promise<{
  entries: { day: string; activity: string; startTime: string; endTime: string; location: string }[];
}> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('No OPENROUTER_API_KEY');

    const imageBuffer = readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

    const prompt = `You are looking at a photo of a school schedule or timetable.

Extract ALL classes/activities for ALL days of the week. For each one provide:
- day: day of the week (e.g. "Monday", "Tuesday", etc.)
- activity: class name
- startTime: HH:MM (24h)
- endTime: HH:MM (24h)
- location: if visible, otherwise empty string

If the schedule is a single daily schedule without day names, use "Everyday" as the day.
If only start times are listed, estimate end times based on the next activity's start time.

Return ONLY valid JSON array, no markdown fences:
[{"day":"Monday","activity":"...","startTime":"HH:MM","endTime":"HH:MM","location":"..."},...]

If you cannot parse it, return: []`;

    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        }],
      }),
    });

    if (!res.ok) throw new Error(`OpenRouter returned ${res.status}`);

    const data: any = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new Error('Empty response');

    const jsonStr = raw.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim();
    const entries = JSON.parse(jsonStr);
    return { entries: Array.isArray(entries) ? entries : [] };
  } catch (err) {
    console.error('[LLM] parseScheduleImage failed:', err);
    return { entries: [] };
  }
}

/**
 * Use Gemini to decide which photo is more suitable for a diary page:
 * the teacher's uploaded photo (primary) or a Google Places photo (secondary).
 * Returns 'uploaded' or 'places'. Defaults to 'uploaded' on any error.
 */
export async function selectBestPhoto(
  uploadedPhotoBase64: string,
  uploadedMimeType: string,
  placesPhotoBase64: string,
  placesMimeType: string,
  activity: string,
  location: string,
  curriculumHint?: string,
): Promise<'uploaded' | 'places'> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('No OPENROUTER_API_KEY');

    const currLine = curriculumHint ? `\nCurriculum: ${curriculumHint}` : '';

    const prompt = `You are choosing the best photo for a child's school diary page.

Activity: ${activity}
Location: ${location}${currLine}

Photo A is taken by the teacher during the school day.
Photo B is from Google Places showing the location.

Choose the photo that best represents this activity for a child's diary.
Photo A (teacher's photo) should be preferred unless it is clearly unrelated to the activity or of very poor quality.

Reply with ONLY the letter: A or B`;

    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${uploadedMimeType};base64,${uploadedPhotoBase64}` } },
            { type: 'image_url', image_url: { url: `data:${placesMimeType};base64,${placesPhotoBase64}` } },
          ],
        }],
      }),
    });

    if (!res.ok) throw new Error(`OpenRouter returned ${res.status}`);

    const data: any = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim()?.toUpperCase();
    if (raw?.includes('B')) return 'places';
    return 'uploaded'; // default to uploaded
  } catch {
    return 'uploaded'; // always prefer uploaded on error
  }
}

function fallbackText(context: PageContext): string {
  const { activity, location } = context;
  const templates = [
    `You visited ${location} today! What did you see there?`,
    `You had ${activity} at ${location}. What was the best part?`,
    `Time for ${activity}! What did you enjoy most?`,
    `You spent some time at ${location}. What was fun today?`,
    `You had ${activity}. Did you learn something new?`,
    `Another stop at ${location}! What was your favorite part?`,
  ];
  return templates[context.pageNumber % templates.length];
}
