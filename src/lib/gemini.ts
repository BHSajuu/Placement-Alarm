import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyAgF0luPrKjSmNnIH-IxKb62pyusI9mihM");

export async function parseCompanyEmail(subject: string, body: string) {
  const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-001",
        generationConfig: {
          temperature: 0.4,
          topP: 0.9,
        },
      });

  const prompt = `
    You are an email parser for a college placement cell. 
    Extract the following details from this email into a JSON object.
    
    Email Subject: ${subject}
    Email Body: ${body}

    Required JSON Structure:
    {
      "name": "Company Name",
      "role": "Job Role (e.g. SDE, Analyst)",
      "package": "CTC/Package (e.g. 12 LPA)",
      "deadline": "ISO 8601 Date string if found, else null",
      "type": "Intern or FTE or Intern + FTE",
      "driveType": "On-Campus or Off-Campus",
      "link": "Application link if found, else empty string",
      "eligible-branch": "Eligible Branches (e.g. CSE, ECE) or 'All Branches'",
    }

    Rules:
    1. If specific details are missing, use "Not mentioned".
    2. Convert relative dates (like "tomorrow") to estimated absolute ISO dates based on today.
    3. Return ONLY the JSON string, no markdown formatting.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    // Clean up markdown code blocks if Gemini adds them
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini parsing failed:", error);
    return null;
  }
}