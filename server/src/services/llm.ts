import { readFileSync } from 'fs';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface PageContext {
  activity: string;
  location: string;
  timeRange: string;
  pageNumber: number;
  totalPages: number;
}

/**
 * Generate diary text for showcase mode (from schedule data, no photo).
 */
export async function generatePageText(context: PageContext): Promise<string> {
  const { activity, location, timeRange } = context;

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('No OPENROUTER_API_KEY');

    const prompt = `Write 1-2 short sentences for a child's visual diary.
Speak in second person ("you"). Warm and gentle tone.
End with one simple question to prompt the child to share.
Keep it brief — no more than 30 words. Do not use names or "dear".

Activity: ${activity}
Time: ${timeRange}
Location: ${location}

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

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Empty response');
    return text;
  } catch {
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

    const data = await res.json();
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
  entries: { activity: string; startTime: string; endTime: string; location: string }[];
}> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('No OPENROUTER_API_KEY');

    const imageBuffer = readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

    const prompt = `You are looking at a photo of a school schedule or timetable.

Extract each class/activity. For each one provide:
- activity: class name
- startTime: HH:MM (24h)
- endTime: HH:MM (24h)
- location: if visible, otherwise empty string

If the schedule has multiple days, extract only the FIRST day (e.g. Monday).

Return ONLY valid JSON array, no markdown fences:
[{"activity":"...","startTime":"HH:MM","endTime":"HH:MM","location":"..."},...]

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

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new Error('Empty response');

    const jsonStr = raw.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim();
    const entries = JSON.parse(jsonStr);
    return { entries: Array.isArray(entries) ? entries : [] };
  } catch {
    return { entries: [] };
  }
}

function fallbackText(context: PageContext): string {
  const { activity, location } = context;
  const templates = [
    `You took a ride to school today! What did you see on the way?`,
    `You had ${activity} at ${location}. What was the best part?`,
    `Time for ${activity}! What did you work on today?`,
    `Lunchtime at ${location}! What was yummy today?`,
    `You had ${activity} this afternoon. Did you learn something new?`,
    `School's out! What was your favorite part of today?`,
  ];
  return templates[context.pageNumber % templates.length];
}
