const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.GEMINI_API_KEY;
const languages = {
  hi: 'Hindi',
  bn: 'Bengali',
  or: 'Odia',
  ta: 'Tamil',
  mr: 'Marathi',
  gu: 'Gujarati',
  mai: 'Maithili'
};

const enJson = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));

async function translateJSON(targetLangName) {
  const prompt = `Translate all the string VALUES in this JSON object to ${targetLangName}. 
Keep the JSON keys EXACTLY the same (do not translate keys). 
Keep the JSON structure identical. 
Return ONLY valid JSON, no markdown, no code fences, no explanation.

JSON to translate:
${JSON.stringify(enJson, null, 2)}`;

  const response = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  const data = await response.json();
  let text = data.candidates[0].content.parts[0].text;
  text = text.replace(/```json|```/g, '').trim();
  return JSON.parse(text);
}

async function main() {
  for (const [code, name] of Object.entries(languages)) {
    console.log(`Translating to ${name}...`);
    try {
      const translated = await translateJSON(name);
      fs.writeFileSync(
        path.join('messages', `${code}.json`),
        JSON.stringify(translated, null, 2),
        'utf8'
      );
      console.log(`✅ ${code}.json created`);
    } catch (err) {
      console.log(`❌ Failed for ${name}:`, err.message);
    }
  }
  console.log('All done!');
}

main();