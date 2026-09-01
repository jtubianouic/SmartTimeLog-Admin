import "server-only";

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const workInputSchema = z.string().trim().min(1).max(10_000);
const summarySchema = z.string().trim().min(1).max(2_000);

export async function summarizeWorkInput(input: string) {
  const employeeInput = workInputSchema.parse(input);
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) {
    throw new Error("AI summarization is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: employeeInput,
    config: {
      httpOptions: { timeout: 15_000 },
      maxOutputTokens: 300,
      temperature: 0.2,
      systemInstruction:
        "Rewrite the employee's work input as one concise, professional paragraph. Preserve every material fact, do not invent accomplishments, and return only the summary.",
    },
  });

  return summarySchema.parse(response.text);
}