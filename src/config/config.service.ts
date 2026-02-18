import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  LLMSettings,
  LLMProviderName,
  LLMProviderConfig,
} from '../llm/llm.types';

export interface AppSettings {
  llm: LLMSettings;
  language: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  llm: {
    providers: {},
    order: ['gemini', 'openai', 'claude'],
  },
  language: 'ko',
};

@Injectable()
export class ConfigService {
  private readonly settings: AppSettings;

  constructor() {
    const settingsPath = path.join(process.cwd(), 'data', 'settings.json');
    this.settings = this.loadSettings(settingsPath);
  }

  private loadSettings(settingsPath: string): AppSettings {
    try {
      if (fs.existsSync(settingsPath)) {
        const content = fs.readFileSync(settingsPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch {
      // JSON 파싱 실패
    }
    console.warn('Settings file not found or invalid, using defaults');
    return DEFAULT_SETTINGS;
  }

  getSettings(): AppSettings {
    return this.settings;
  }

  getLLMSettings(): LLMSettings {
    return this.settings.llm;
  }

  getLLMOrder(): LLMProviderName[] {
    return this.settings.llm.order;
  }

  getProviderConfig(provider: LLMProviderName): LLMProviderConfig | undefined {
    return this.settings.llm.providers[provider];
  }

  getLanguage(): string {
    return this.settings.language;
  }
}
