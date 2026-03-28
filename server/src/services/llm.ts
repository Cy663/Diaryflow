import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }
  return genAI;
}

interface PageContext {
  childName: string;
  activity: string;
  location: string;
  timeRange: string;
  pageNumber: number;
  totalPages: number;
}

export async function generatePageText(context: PageContext): Promise<string> {
  const { childName, activity, location, timeRange } = context;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('No API key');
    }

    const model = getGenAI().getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are the warm narrator of an interactive visual diary. This diary is for a child named ${childName} and their parents to look at together.
Write 2-3 sentences in English, speaking directly to the child in second person ("you"), helping them recall today's activity and encouraging them to share how they felt.
The tone should be warm, gentle, and encouraging — like a kind friend chatting with the child.
Use simple, concrete descriptions to spark memories, and naturally ask a small question to prompt the child to share.
Do not use "dear" or overly formal language. Just use their name or "you".

Time: ${timeRange}
Location: ${location}
Activity: ${activity}

Output only the diary text. No title, no page number, no other formatting.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return text;
  } catch {
    return fallbackText(context);
  }
}

function fallbackText(context: PageContext): string {
  const { childName, activity, location } = context;
  const templates = [
    `${childName}, you rode the school bus to school today! Did you see anything fun along the way? Did you chat with the friend sitting next to you?`,
    `${childName}, you had ${activity} at the ${location} this morning. What book did you read today? Was there a story you really liked?`,
    `${childName}, what did you make during ${activity}? Did you use lots of colors? Tell me about your artwork!`,
    `Lunchtime! ${childName}, what yummy food did you have at the ${location} today? What games did you play with your friends during recess?`,
    `${childName}, you had ${activity} at the ${location} this afternoon. Did you learn something new today? Was there a problem you found really interesting?`,
    `${childName}, school's out! Did you have a good day? What was your favorite part? What would you like to have for a snack on the way home?`,
  ];
  return templates[context.pageNumber % templates.length];
}
