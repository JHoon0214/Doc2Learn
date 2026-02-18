import OpenAI from 'openai';
import { ZodType } from 'zod';
import {
  LLMProvider,
  LLMMessage,
  LLMProviderName,
  DEFAULT_MODELS,
} from '../llm.types';

export class OpenAIProvider implements LLMProvider {
  readonly name: LLMProviderName = 'openai';
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model ?? DEFAULT_MODELS.openai;
  }

  async generate<T = string>(
    messages: LLMMessage[],
    schema?: ZodType<T>,
  ): Promise<T> {
    const formattedMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: formattedMessages,
      response_format: schema ? { type: 'json_object' } : undefined,
    });

    const content = response.choices[0]?.message?.content ?? '';

    if (schema) {
      return JSON.parse(content) as T;
    }

    return content as T;
  }
}
