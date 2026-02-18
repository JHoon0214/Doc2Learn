import { ZodType } from 'zod';

export type LLMProviderName = 'openai' | 'claude' | 'gemini';

// 사용 가능한 모델 목록 (추가 가능)
export const AVAILABLE_MODELS: Record<LLMProviderName, string[]> = {
  openai: ['gpt-4.1-mini'],
  claude: ['claude-sonnet-4-20250514'],
  gemini: ['gemini-2.5-flash'],
};

// 기본 모델
export const DEFAULT_MODELS: Record<LLMProviderName, string> = {
  openai: AVAILABLE_MODELS.openai[0],
  claude: AVAILABLE_MODELS.claude[0],
  gemini: AVAILABLE_MODELS.gemini[0],
};

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMProviderConfig {
  apiKey: string;
  model?: string; // 미지정시 DEFAULT_MODELS 사용
}

export interface LLMSettings {
  providers: Partial<Record<LLMProviderName, LLMProviderConfig>>;
  order: LLMProviderName[];
}

export interface LLMProvider {
  readonly name: LLMProviderName;
  generate<T = string>(messages: LLMMessage[], schema?: ZodType<T>): Promise<T>;
}
