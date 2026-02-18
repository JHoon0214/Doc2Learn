import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { LLMService } from '../llm/llm.service';
import { ConfigService } from '../config/config.service';
import { Section } from '../storage/storage.types';

const SectionsSchema = z.array(
  z.object({
    id: z.number(),
    title: z.string(),
    content: z.string(),
  }),
);

@Injectable()
export class TranslationService {
  constructor(
    private llmService: LLMService,
    private configService: ConfigService,
  ) {}

  async translateAndSplit(content: string): Promise<Section[]> {
    const language = this.configService.getLanguage();

    const prompt = `You are a document translator that preserves Markdown formatting.

Your task:
1. Translate the following Markdown document into ${language}
2. Split it into logical sections based on headings or topics
3. Each section should have a clear topic

CRITICAL RULES for formatting:
- PRESERVE ALL MARKDOWN FORMATTING exactly as-is:
  - Headings (#, ##, ###)
  - Code blocks (\`\`\`language ... \`\`\`) - DO NOT translate code inside
  - Inline code (\`code\`)
  - Lists (-, *, 1.)
  - Links [text](url)
  - Bold (**text**) and italic (*text*)
  - Blockquotes (>)
  - Line breaks and paragraph spacing
- Keep code blocks COMPLETELY INTACT - never translate code
- Preserve technical terms (API names, library names, etc.)
- Section titles should be concise and descriptive in ${language}
- id should start from 0 and increment

Document to translate:
${content}`;

    const sections = await this.llmService.generate(
      [
        { role: 'system', content: prompt },
        { role: 'user', content: 'Please translate and split the document while preserving all Markdown formatting.' },
      ],
      SectionsSchema,
    );

    return sections;
  }
}