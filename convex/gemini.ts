import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";



const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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
      Conduct a comprehensive, brutally honest, and strategically-focused analysis of this resume against the provided job description. Your evaluation should be:
      - Ruthlessly critical yet constructive
      - Highly specific with actionable recommendations
      - Industry-aware and role-appropriate
      - ATS-optimized for modern recruitment systems
      - Results-oriented with measurable improvement suggestions

      The output MUST be a single, valid JSON object with no markdown formatting.

      The JSON structure must be as follows:
      {
        "overall_score": number, // Holistic score (0-100) based on weighted analysis: Technical Skills (30%), Experience Relevance (25%), Impact & Results (20%), ATS Compatibility (15%), Cultural Fit (10%)
        "summary": string, // Executive summary (150-200 words) with clear verdict on candidacy strength, top 3 strengths, top 3 critical gaps, and hiring recommendation
        "first_impression": string, // Recruiter's 15-second scan impression - what immediately stands out (positive/negative), visual appeal, and initial screening decision
        "market_competitiveness": {
          "score": number, // 0-100 score for market competitiveness
          "analysis": string, // How this resume compares to typical candidates for this role
          "salary_bracket": string, // Estimated salary range this resume could command
          "improvement_potential": string // Potential score increase with improvements
        },
        "ats_compatibility": {
          "score": number, // ATS parsing and keyword optimization score (0-100)
          "parsing_issues": string[], // Specific formatting/structure issues that hurt ATS parsing
          "keyword_density": string, // Analysis of keyword usage vs. job requirements
          "suggestions": string[] // Specific ATS optimization recommendations
        },
        "categorical_scores": [
          { "category": "Technical Skills Match", "score": number, "explanation": string, "improvement_impact": string },
          { "category": "Experience Relevance", "score": number, "explanation": string, "improvement_impact": string },
          { "category": "Impact & Quantifiable Results", "score": number, "explanation": string, "improvement_impact": string },
          { "category": "Leadership & Soft Skills", "score": number, "explanation": string, "improvement_impact": string },
          { "category": "Education & Certifications", "score": number, "explanation": string, "improvement_impact": string },
          { "category": "Industry Knowledge", "score": number, "explanation": string, "improvement_impact": string }
        ],
        "critical_gaps": {
          "missing_keywords": string[], // High-impact keywords/skills missing from resume
          "experience_gaps": string[], // Required experience types not demonstrated
          "qualification_gaps": string[], // Missing certifications, education, or credentials
          "soft_skill_gaps": string[] // Leadership, communication, or cultural fit gaps
        },
        "competitive_advantages": string[], // Unique strengths that set this candidate apart
        "actionable_suggestions": [
          {
            "priority": string, // "HIGH", "MEDIUM", "LOW" - impact on hiring decision
            "area": string, // Specific resume section or aspect to improve
            "issue": string, // What's wrong or missing
            "suggestion": string, // Detailed, actionable improvement recommendation
            "impact": string, // Expected improvement in score/competitiveness
            "example": {
              "before": string, // Current text or "N/A" if adding new content
              "after": string // Specific improved version with exact wording
            }
          }
        ],
        "interview_preparation": {
          "likely_questions": string[], // 5 most likely interview questions based on gaps/strengths
          "story_suggestions": string[], // STAR method stories to prepare based on experience
          "technical_prep": string[] // Technical areas to brush up on for this role
        },
        "next_steps": string[] // Prioritized action plan for resume improvement (top 5 items)
      }

      EVALUATION CRITERIA:
      1. Technical Competency: Does the candidate demonstrate required technical skills with concrete examples?
      2. Experience Depth: Is the experience level and type aligned with job requirements?
      3. Impact Demonstration: Are achievements quantified with metrics, percentages, dollar amounts?
      4. Cultural Alignment: Do soft skills and work style match company culture indicators?
      5. Growth Trajectory: Does career progression show upward mobility and increasing responsibility?
      6. Industry Relevance: Is domain knowledge appropriate for the sector/company?
      7. Communication Skills: Is the resume well-written, clear, and professional?
      8. Differentiation: What makes this candidate unique compared to typical applicants?

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
      const response = await result.response;
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
        overallScore: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

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
