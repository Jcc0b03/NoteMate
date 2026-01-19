import { GoogleGeminiProvider } from "./google";
import { AIProvider } from "./types";

let provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!provider) {
    provider = new GoogleGeminiProvider();
  }
  return provider;
}
