
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AnalysisResponse, GroundingSource } from "../types";

export async function analyzeSupplierPair(
  lsName: string, 
  dbmName: string,
  extraMetadata: Record<string, string> = {}
): Promise<{ analysis: AnalysisResponse; sources: GroundingSource[] }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const metadataStr = Object.entries(extraMetadata)
    .filter(([key, value]) => value && !['LS Supplier Name', 'DBM Supplier Name', 'Needs for Review'].includes(key))
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  const prompt = `
    TASK: Determine if these two companies are actually the same one.
    
    COMPANIES TO CHECK:
    1. Name A (LS): "${lsName}"
    2. Name B (DBM): "${dbmName}"
    ${metadataStr ? `EXTRA CLUES (Address/Email/Other): ${metadataStr}` : ''}

    INSTRUCTIONS:
    1. USE GOOGLE SEARCH: Find their official identities, addresses, and emails.
    2. KEY EVIDENCE: If they have the same website, same building address, or same email, THEY ARE THE SAME.
    3. SIMPLE REASONING: Explain your finding in a very simple way (like explaining to a 5-year-old).
    4. DEFINITIVE VERDICT: You MUST end with "MATCH: Yes" or "MATCH: No".

    OUTPUT FORMAT (STRICT):
    MATCH: [Yes/No]
    DOMAIN_LS: [Simple Industry]
    DOMAIN_DBM: [Simple Industry]
    REASONING: [Kid-friendly explanation using the specific clues found]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, // Even more focused for definitive matching
      },
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources: GroundingSource[] = groundingChunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web?.title,
        uri: chunk.web?.uri
      }));

    // Robust parsing of Match
    let isMatch = false;
    const matchMatch = text.match(/MATCH:\s*(Yes|No|True|False)/i);
    if (matchMatch) {
      const val = matchMatch[1].toLowerCase();
      isMatch = val === 'yes' || val === 'true';
    } else {
      // Fallback: search for specific keywords if strict format missed
      const lower = text.toLowerCase();
      if (lower.includes("match: yes") || (lower.includes("are the same") && !lower.includes("not the same"))) {
        isMatch = true;
      }
    }

    const domainLSMatch = text.match(/DOMAIN_LS:\s*(.*)/i);
    const domainDBMMatch = text.match(/DOMAIN_DBM:\s*(.*)/i);
    const reasoningMatch = text.match(/REASONING:\s*([\s\S]*)/i);

    const analysis: AnalysisResponse = {
      isMatch,
      domainLS: domainLSMatch ? domainLSMatch[1].trim() : "Undetermined",
      domainDBM: domainDBMMatch ? domainDBMMatch[1].trim() : "Undetermined",
      reasoning: reasoningMatch ? reasoningMatch[1].trim() : text,
    };

    return { analysis, sources };
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
}
