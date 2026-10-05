import { beforeEach, describe, expect, it, vi } from "vitest";

const googleGenAiMocks = vi.hoisted(() => ({
  generateContent: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn(function GoogleGenAI() {
    return { models: { generateContent: googleGenAiMocks.generateContent } };
  }),
}));

import { summarizeWithOmniRoute, summarizeWorkInput } from "./summary";

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("summarizeWithOmniRoute", () => {
  it("calls the configured OpenAI-compatible endpoint and returns its summary", async () => {
    vi.stubEnv("OMNI_API_KEY", "test-omni-key");
    vi.stubEnv("OMNI_ROUTE_URL", "https://omniroute.example/v1");
    vi.stubEnv("OMNI_MODEL", "auto");

    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        choices: [{ message: { content: JSON.stringify({ summary: "Finished the assigned work." }) } }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(summarizeWithOmniRoute("Finished the assigned work")).resolves.toBe(
      "Finished the assigned work.",
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://omniroute.example/v1/chat/completions");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      Authorization: "Bearer test-omni-key",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: "auto",
      messages: [
        { role: "system" },
        { role: "user", content: "<employee_work_report>Finished the assigned work</employee_work_report>" },
      ],
      response_format: { type: "json_object" },
    });
  });

  it("reports an OmniRoute HTTP failure so the next provider can run", async () => {
    vi.stubEnv("OMNI_API_KEY", "test-omni-key");
    vi.stubEnv("OMNI_ROUTE_URL", "https://omniroute.example/v1/chat/completions");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    await expect(summarizeWithOmniRoute("Work report")).rejects.toThrow(
      "OmniRoute request failed with status 503.",
    );
  });
});

describe("summary provider routing", () => {
  it("keeps OmniRoute as the primary route", async () => {
    vi.stubEnv("OMNI_API_KEY", "test-omni-key");
    vi.stubEnv("OMNI_ROUTE_URL", "https://omniroute.example/v1");
    vi.stubEnv("AI_API_KEY", "test-gemini-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      Response.json({
        choices: [{ message: { content: JSON.stringify({ summary: "OmniRoute summary" }) } }],
      }),
    ));

    await expect(summarizeWorkInput("Work report")).resolves.toBe("OmniRoute summary");
    expect(googleGenAiMocks.generateContent).not.toHaveBeenCalled();
  });

  it("falls back from OmniRoute to Gemini, then Groq", async () => {
    const calls: string[] = [];
    vi.stubEnv("OMNI_API_KEY", "test-omni-key");
    vi.stubEnv("OMNI_ROUTE_URL", "https://omniroute.example/v1");
    vi.stubEnv("AI_API_KEY", "test-gemini-key");
    vi.stubEnv("GROQ_API_KEY", "test-groq-key");

    googleGenAiMocks.generateContent.mockImplementationOnce(async () => {
      calls.push("gemini");
      throw new Error("Gemini unavailable");
    });

    const fetchMock = vi.fn()
      .mockImplementationOnce(async () => {
        calls.push("omniroute");
        return new Response(null, { status: 503 });
      })
      .mockImplementationOnce(async () => {
        calls.push("groq");
        return Response.json({
          choices: [{ message: { content: JSON.stringify({ summary: "Groq summary" }) } }],
        });
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(summarizeWorkInput("Work report")).resolves.toBe("Groq summary");
    expect(calls).toEqual(["omniroute", "gemini", "groq"]);
  });
});
