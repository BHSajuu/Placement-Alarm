import { GoogleGenerativeAI } from "@google/generative-ai";


export async function parseCompanyEmail(subject: string, body: string) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY is missing in Convex Environment Variables.");
    return null;
  }

  // Debug log to verify the key is actually loaded (printing first 4 chars only)
  console.log(`Initializing Gemini with Key: ${apiKey.substring(0, 4)}...`);

  const genAI = new GoogleGenerativeAI(apiKey);
  
  const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-001",
        generationConfig: {
          temperature: 0.1,
          topP: 0.9,
        },
      });
  
  const currentYear = new Date().getFullYear();

  const prompt = `
    You are an email parser for a college placement cell. 
    Extract the following details from this email into a JSON object.
    
    Current Year Context: ${currentYear}
    Email Subject: ${subject}
    Email Body: ${body}

    Required JSON Structure:
    {
      "name": "Company Name",
      "role": "Job Role (e.g. SDE, Analyst)",
      "package": "CTC/Package (e.g. 12 LPA)",
      "deadline": "ISO 8601 Date string",
      "type": "Intern or FTE or Intern + FTE",
      "driveType": "On-Campus or Off-Campus",
      "link": "Application link if found, else empty string",
      "eligible-branch": "Eligible Branches (e.g. CSE, ECE) or 'All Branches'",
      "eligibility-criteria": "Minimum CGPA or other criteria mentioned, else 'Not mentioned'"
    }
    
    Rules for 'deadline':
    1. If a specific time is mentioned (e.g., "5:00 PM", "10 AM"), the ISO string MUST include that time.
    2. If "EOD" or "End of Day" is mentioned, set the time to 23:59:59 (11:59:59 PM) of that date.
    3. If NO time is mentioned (just a date), return just the date in ISO format (YYYY-MM-DD) or default to end of day if context implies it.
    4. Convert relative dates (like "tomorrow") to absolute ISO dates based on today's date.
    
    Rules for 'type':
    1. You should extract from the email subject line only. Look for keywords like "FTE", "Full-Time Employment", "Intern", "Internship", "6M + PPO", "6M + FTE".
    
    General Rules:
    1. If specific details are missing, use "Not mentioned".
    2. If the drive type is not specified, default to "On-Campus".
    3. Return ONLY the JSON string, no markdown formatting.
  `;

  try {
    console.log("Gemini API Key Loaded:", !!process.env.GEMINI_API_KEY);
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Clean up markdown code blocks if Gemini adds them
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error("Gemini did not return a valid JSON object. Raw text:", text);
      return null;
    }

    const jsonStr = jsonMatch[0];
    console.log("Extracted JSON String from Gemini:", jsonStr);
    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("Gemini parsing failed:", error);
    return null;
  }
}