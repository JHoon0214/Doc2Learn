import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('documents/:docId/sections/:sectionId/chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get()
  getChatHistory(
    @Param('docId') docId: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.chatService.getChatHistory(docId, parseInt(sectionId, 10));
  }

  @Post()
  async sendMessage(
    @Param('docId') docId: string,
    @Param('sectionId') sectionId: string,
    @Body('message') message: string,
  ) {
    const response = await this.chatService.chat(
      docId,
      parseInt(sectionId, 10),
      message,
    );
    return { response };
  }

  @Delete()
  clearChat(
    @Param('docId') docId: string,
    @Param('sectionId') sectionId: string,
  ) {
    this.chatService.clearChat(docId, parseInt(sectionId, 10));
    return { cleared: true };
  }
}
