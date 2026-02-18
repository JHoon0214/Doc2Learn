import Anthropic from '@anthropic-ai/sdk';
import { ZodType } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  LLMProvider,
  LLMMessage,
  LLMProviderName,
  DEFAULT_MODELS,
} from '../llm.types';

export class ClaudeProvider implements LLMProvider {
  readonly name: LLMProviderName = 'claude';
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model ?? DEFAULT_MODELS.claude;
  }

  async generate<T = string>(
    messages: LLMMessage[],
    schema?: ZodType<T>,
  ): Promise<T> {
    const systemMessage = messages.find((m) => m.role === 'system');
    const otherMessages = messages.filter((m) => m.role !== 'system');

    const anthropicMessages =
      otherMessages.length > 0
        ? otherMessages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }))
        : [
            {
              role: 'user' as const,
              content: 'Please respond according to the system instruction.',
            },
          ];

    if (schema) {
      return this.generateWithSchema(
        systemMessage?.content,
        anthropicMessages,
        schema,
      );
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemMessage?.content,
      messages: anthropicMessages,
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    return (textBlock?.type === 'text' ? textBlock.text : '') as T;
  }

  private async generateWithSchema<T>(
    system: string | undefined,
    messages: Anthropic.MessageParam[],
    schema: ZodType<T>,
  ): Promise<T> {
    const jsonSchema = zodToJsonSchema(schema as any, {
      target: 'openApi3',
    }) as Record<string, any>;
    const inputSchema: Anthropic.Tool.InputSchema = {
      type: jsonSchema.type ?? 'object',
      properties: jsonSchema.properties,
      required: jsonSchema.required,
    };

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system,
      messages,
      tools: [
        {
          name: 'structured_output',
          description: 'Return the structured output according to the schema',
          input_schema: inputSchema,
        },
      ],
      tool_choice: { type: 'tool', name: 'structured_output' },
    });

    const toolUseBlock = response.content.find(
      (block) => block.type === 'tool_use',
    );
    if (toolUseBlock?.type === 'tool_use') {
      return toolUseBlock.input as T;
    }

    throw new Error('No tool_use block found in Claude response');
  }
}
