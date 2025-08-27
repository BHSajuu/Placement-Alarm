import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";



const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const AIResponseFormat = `
      interface Feedback {
      overallScore: number; //max 100
      ATS: {
        score: number; //rate based on ATS suitability
        tips: {
          type: "good" | "improve";
          tip: string; //give 3-4 tips
        }[];
      };
      toneAndStyle: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      content: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      structure: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      skills: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
    }`;


export const analyzeResume = action({
  args: {
    resumeText: v.string(),
    jobDescriptionText: v.string(),
  },
  handler: async (ctx, { resumeText, jobDescriptionText }) => {
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.6,
          topP: 0.9,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      });

    const prompt = `
      You are an elite career strategist and principal technical recruiter at a Fortune 500 company with 25+ years of experience in talent acquisition across FAANG, unicorn startups, and enterprise organizations.
      
      Your expertise spans:
      - Technical role evaluation (Software Engineering, Data Science, Product Management, etc.)
      - Executive and leadership position assessment
      - Industry-specific requirements (Tech, Finance, Healthcare, Consulting, etc.)
      - ATS optimization and modern recruitment practices
      - Global hiring standards and cultural fit assessment
      
      ANALYSIS MISSION:
      Please analyze and rate this resume and suggest how to improve it.
      The rating can be low if the resume is bad.
      Be thorough and detailed. Don't be afraid to point out any mistakes or areas for improvement.
      If there is a lot to improve, don't hesitate to give low scores. This is to help the user to improve their resume.
      If available, use the job description for the job user is applying to to give more detailed feedback.
      If provided, take the job description into consideration.
     
      FORMAT:
      Provide the feedback using the following format:
      ${AIResponseFormat}
      Return the analysis as an JSON object, without any other text and without the backticks.
      Do not include any other text or comments.

      ANALYSIS INSTRUCTIONS:
      - Be ruthlessly honest but constructive
      - Provide specific, actionable feedback with exact examples
      - Consider both immediate fit and growth potential
      - Factor in current job market conditions and competition
      - Prioritize suggestions by impact on hiring decision
      - Include industry-specific insights and benchmarks

      --- RESUME ---
      ${resumeText}
      ---

      --- JOB DESCRIPTION ---
      ${jobDescriptionText}
      ---

      Deliver a comprehensive, strategic analysis that will genuinely help this candidate compete effectively in today's job market.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const jsonResponse = response.text();
      return JSON.parse(jsonResponse);
    } catch (error) {
      console.error("Error analyzing with Gemini:", error);
      throw new Error("Failed to get analysis from Gemini API.");
    }
  },
});

export const saveAnalysis = mutation({
    args: {
        jobDescription: v.string(),
        resumeText: v.string(),
        analysis: v.any(),
        overallScore: v.number(), // Re-add this line
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        // The ...args spread will now correctly include overallScore
        await ctx.db.insert("analyses", {
            userId: identity.subject,
            ...args,
        });
    },
});

export const getAnalysisHistory = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        return await ctx.db
            .query("analyses")
            .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
            .order("desc")
            .take(10); // Get the 10 most recent analyses
    },
});

export const getAnalysisById = query({
    args: { id: v.id("analyses") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const analysis = await ctx.db.get(args.id);

        if (analysis?.userId !== identity.subject) {
            return null;
        }

        return analysis;
    },
});