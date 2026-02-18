import { Module } from '@nestjs/common';
import { LLMModule } from '../llm/llm.module';
import { StorageModule } from '../storage/storage.module';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';

@Module({
  imports: [LLMModule, StorageModule],
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}
