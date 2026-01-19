import { LanguageModel } from "ai";

export interface AIProvider {
  /**
   * Processes a list of files to extract content and generate a summary.
   */
  processNote(files: { url: string; mimeType: string }[]): Promise<{ content: string; summary: string }>;

  /**
   * Generates a quiz based on the provided note content.
   */
  generateQuiz(content: string): Promise<string>;

  /**
   * Returns the underlying model for use with Vercel AI SDK (streamText).
   */
  getModel(): LanguageModel;
}
