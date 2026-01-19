import { google } from "@ai-sdk/google";
import { LanguageModel } from "ai";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { AIProvider } from "./types";

export class GoogleGeminiProvider implements AIProvider {
  private model: LanguageModel;
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.model = google("gemini-1.5-flash");

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
    if (!apiKey) {
      console.warn("GOOGLE_GENERATIVE_AI_API_KEY is not set.");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  getModel(): LanguageModel {
    return this.model;
  }

  async processNote(files: { url: string; mimeType: string }[]): Promise<{ content: string; summary: string }> {
    const model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.OBJECT,
                properties: {
                    content: { type: SchemaType.STRING, description: "Full transcription of the note content in Markdown." },
                    summary: { type: SchemaType.STRING, description: "Concise summary of the note." }
                },
                required: ["content", "summary"]
            }
        }
    });

    const fileParts = await Promise.all(
      files.map(async (file) => {
        const response = await fetch(file.url);
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        return {
          inlineData: {
            data: base64,
            mimeType: file.mimeType,
          },
        };
      })
    );

    const prompt = "Analyze these files. Extract the full content (transcribe text, describe images) into the 'content' field using Markdown. Then provide a helpful 'summary'.";

    const result = await model.generateContent([prompt, ...fileParts]);
    const response = result.response;
    const text = response.text();

    try {
        const json = JSON.parse(text);
        return {
            content: json.content,
            summary: json.summary
        };
    } catch (e) {
        console.error("Failed to parse AI response", text);
        return {
            content: text, // Fallback
            summary: "Could not generate summary."
        };
    }
  }

  async generateQuiz(content: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Based on the following content, generate a quiz with 5 multiple-choice questions.
    Format the output as Markdown.
    Include the correct answer at the very end of the response (hidden or separated).

    Content:
    ${content.substring(0, 50000)}... (truncated if too long)
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}
