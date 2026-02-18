import { Module } from '@nestjs/common';
import { LLMModule } from '../llm/llm.module';
import { StorageModule } from '../storage/storage.module';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';

@Module({
  imports: [LLMModule, StorageModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
