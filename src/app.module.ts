import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { LLMModule } from './llm/llm.module';
import { DocumentModule } from './document/document.module';
import { StorageModule } from './storage/storage.module';
import { ChatModule } from './chat/chat.module';
import { QuizModule } from './quiz/quiz.module';
import { ViewModule } from './view/view.module';

@Module({
  imports: [
    ConfigModule,
    LLMModule,
    DocumentModule,
    StorageModule,
    ChatModule,
    QuizModule,
    ViewModule,
  ],
})
export class AppModule {}
