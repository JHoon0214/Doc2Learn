import { Injectable } from '@nestjs/common';
import { ZodType } from 'zod';
import { ConfigService } from '../config/config.service';
import { LLMProvider, LLMMessage, LLMProviderName } from './llm.types';
import { OpenAIProvider } from './providers/openai.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { GeminiProvider } from './providers/gemini.provider';

@Injectable()
export class LLMService {
  private providers: Map<LLMProviderName, LLMProvider> = new Map();
  private providerOrder: LLMProviderName[];

  constructor(private configService: ConfigService) {
    this.initProviders();
  }

  private initProviders(): void {
    const llmSettings = this.configService.getLLMSettings();
    this.providerOrder = llmSettings.order;

    for (const [name, config] of Object.entries(llmSettings.providers)) {
      if (!config?.apiKey) continue;

      const providerName = name as LLMProviderName;
      const provider = this.createProvider(
        providerName,
        config.apiKey,
        config.model,
      );
      if (provider) {
        this.providers.set(providerName, provider);
      }
    }
  }

  private createProvider(
    name: LLMProviderName,
    apiKey: string,
    model?: string,
  ): LLMProvider | null {
    switch (name) {
      case 'openai':
        return new OpenAIProvider(apiKey, model);
      case 'claude':
        return new ClaudeProvider(apiKey, model);
      case 'gemini':
        return new GeminiProvider(apiKey, model);
      default:
        return null;
    }
  }

  async generate<T = string>(
    messages: LLMMessage[],
    schema?: ZodType<T>,
  ): Promise<T> {
    for (const providerName of this.providerOrder) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;

      try {
        return await provider.generate(messages, schema);
      } catch (error) {
        console.warn(
          `${providerName} failed: ${error.message}, trying next...`,
        );
      }
    }

    throw new Error('All LLM providers failed');
  }

  hasAvailableProvider(): boolean {
    return this.providers.size > 0;
  }

  getAvailableProviders(): LLMProviderName[] {
    return Array.from(this.providers.keys());
  }
}
