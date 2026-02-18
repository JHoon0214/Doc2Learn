import { Module } from '@nestjs/common';
import { LLMModule } from '../llm/llm.module';
import { StorageModule } from '../storage/storage.module';
import { ParserService } from './parser.service';
import { TranslationService } from './translation.service';
import { DocumentController } from './document.controller';

@Module({
  imports: [LLMModule, StorageModule],
  controllers: [DocumentController],
  providers: [ParserService, TranslationService],
  exports: [ParserService, TranslationService],
})
export class DocumentModule {}
