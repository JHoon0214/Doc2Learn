import { Injectable } from '@nestjs/common';
import { LLMService } from '../llm/llm.service';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '../config/config.service';
import { ChatMessage } from '../storage/storage.types';

@Injectable()
export class ChatService {
  constructor(
    private llmService: LLMService,
    private storageService: StorageService,
    private configService: ConfigService,
  ) {}

  async chat(
    docId: string,
    sectionId: number,
    userMessage: string,
  ): Promise<string> {
    const translation = this.storageService.getTranslation(docId);
    if (!translation) {
      throw new Error('Document translation not found');
    }

    const section = translation.sections.find((s) => s.id === sectionId);
    if (!section) {
      throw new Error('Section not found');
    }

    // 기존 채팅 기록 가져오기
    const existingChat = this.storageService.getChat(docId, sectionId);
    const messages: ChatMessage[] = existingChat?.messages ?? [];

    // 새 메시지 추가
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    messages.push(newUserMessage);

    const language = this.configService.getLanguage();

    // LLM 호출
    const systemPrompt = `You are a helpful study assistant. Answer questions about the following section content.
Always respond in ${language}.

Section Title: ${section.title}
Section Content:
${section.content}`;

    const llmMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const response = await this.llmService.generate(llmMessages);

    // 응답 저장
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: response,
      createdAt: new Date().toISOString(),
    };
    messages.push(assistantMessage);

    this.storageService.saveChat(docId, sectionId, messages);

    return response;
  }

  getChatHistory(docId: string, sectionId: number): ChatMessage[] {
    const chat = this.storageService.getChat(docId, sectionId);
    return chat?.messages ?? [];
  }

  clearChat(docId: string, sectionId: number): void {
    this.storageService.saveChat(docId, sectionId, []);
  }
}
