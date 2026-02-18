import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { ZodType } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  LLMProvider,
  LLMMessage,
  LLMProviderName,
  DEFAULT_MODELS,
} from '../llm.types';

export class GeminiProvider implements LLMProvider {
  readonly name: LLMProviderName = 'gemini';
  private client: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string, model?: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.modelName = model ?? DEFAULT_MODELS.gemini;
  }

  async generate<T = string>(
    messages: LLMMessage[],
    schema?: ZodType<T>,
  ): Promise<T> {
    const systemMessage = messages.find((m) => m.role === 'system');
    const otherMessages = messages.filter((m) => m.role !== 'system');

    const generationConfig: any = {
      thinkingConfig: { thinkingBudget: 0 },
    };

    if (schema) {
      generationConfig.responseMimeType = 'application/json';
      generationConfig.responseSchema = this.toGeminiSchema(
        zodToJsonSchema(schema as any),
      );
    }

    const model = this.client.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemMessage?.content,
      generationConfig,
    });

    const contents = otherMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [
          { text: 'Please respond according to the system instruction.' },
        ],
      });
    }

    const result = await model.generateContent({ contents });
    const text = result.response.text();

    return (schema ? JSON.parse(text) : text) as T;
  }

  private toGeminiSchema(jsonSchema: any): any {
    if (!jsonSchema) return undefined;

    const typeMap: Record<string, SchemaType> = {
      object: SchemaType.OBJECT,
      array: SchemaType.ARRAY,
      string: SchemaType.STRING,
      number: SchemaType.NUMBER,
      integer: SchemaType.INTEGER,
      boolean: SchemaType.BOOLEAN,
    };

    const result: any = { type: typeMap[jsonSchema.type] };

    if (jsonSchema.properties) {
      result.properties = Object.fromEntries(
        Object.entries(jsonSchema.properties).map(([k, v]) => [
          k,
          this.toGeminiSchema(v),
        ]),
      );
    }
    if (jsonSchema.items) result.items = this.toGeminiSchema(jsonSchema.items);
    if (jsonSchema.required) result.required = jsonSchema.required;
    if (jsonSchema.description) result.description = jsonSchema.description;

    return result;
  }
}
