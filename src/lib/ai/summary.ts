import "server-only";

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const workInputSchema = z.string().trim().min(1).max(10_000);
const summarySchema = z.string().trim().min(1).max(2_000);
const systemInstruction =
  "Rewrite the employee's work input as one concise, professional paragraph. Preserve every material fact, do not invent accomplishments, and return only the summary.";

async function summarizeWithGemini(employeeInput: string) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error("Gemini is not configured.");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
    contents: employeeInput,
    config: {
      httpOptions: { timeout: 15_000 },
      maxOutputTokens: 300,
      temperature: 0.2,
      systemInstruction,
    },
  });

  return summarySchema.parse(response.text);
}

const groqResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({ content: z.string() }),
    }),
  ).min(1),
});

async function summarizeWithGroq(employeeInput: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Groq is not configured.");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: employeeInput },
      ],
      max_completion_tokens: 300,
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) throw new Error(`Groq request failed with status ${response.status}.`);
  const result = groqResponseSchema.parse(await response.json());
  return summarySchema.parse(result.choices[0].message.content);
}

export async function summarizeWorkInput(input: string) {
  const employeeInput = workInputSchema.parse(input);
  const providerErrors: unknown[] = [];

  try {
    return await summarizeWithGemini(employeeInput);
  } catch (error) {
    providerErrors.push(error);
  }

  try {
    return await summarizeWithGroq(employeeInput);
  } catch (error) {
    providerErrors.push(error);
  }

  throw new AggregateError(providerErrors, "All AI summary providers are unavailable.");
}