const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Ek complaint submit hote hi uski priority, ek chhota AI summary, suggested
 * action, aur detected language nikalta hai — taaki dashboard pe har complaint
 * card pe priority turant dikhe, bina alag se "Analyze Cases" button click kiye.
 *
 * Fail-safe: agar Gemini call kisi bhi wajah se fail ho jaaye (invalid key,
 * rate limit, network issue), to complaint submission block nahi hota —
 * default MEDIUM priority assign ho jaati hai aur error sirf console mein log hota hai.
 */
async function analyzeComplaintPriority(title, description) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a government case prioritization AI. Analyze this citizen complaint and return ONLY a JSON object (no markdown, no extra text):

{
  "priority": "HIGH" | "MEDIUM" | "LOW",
  "summary": "one-sentence plain-English summary of the issue",
  "suggestedAction": "one short actionable next step for the department (10 words max)",
  "languageDetected": "the language the complaint was likely originally written/spoken in, e.g. Hindi, English, Bhojpuri, Maithili"
}

Priority Rules:
- HIGH: Urgent (safety, crime, health, infrastructure collapse risk)
- MEDIUM: Standard civic issues needing attention within days
- LOW: Minor or non-urgent issues

Complaint Title: ${title}
Complaint Description: ${description}`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      priority: parsed.priority || 'MEDIUM',
      summary: parsed.summary || null,
      suggestedAction: parsed.suggestedAction || null,
      languageDetected: parsed.languageDetected || null,
    };
  } catch (err) {
    console.error('AI priority analysis failed, defaulting to MEDIUM:', err.message);
    return {
      priority: 'MEDIUM',
      summary: null,
      suggestedAction: null,
      languageDetected: null,
    };
  }
}

module.exports = { analyzeComplaintPriority };