import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ParserService } from './parser.service';
import { TranslationService } from './translation.service';
import { StorageService } from '../storage/storage.service';

@Controller('documents')
export class DocumentController {
  constructor(
    private parserService: ParserService,
    private translationService: TranslationService,
    private storageService: StorageService,
  ) {}

  @Post()
  async createDocument(@Body('url') url: string) {
    if (!url) {
      throw new HttpException('URL is required', HttpStatus.BAD_REQUEST);
    }

    // 이미 존재하는지 확인
    if (this.storageService.existsByUrl(url)) {
      const id = this.storageService.getIdFromUrl(url);
      return { id, message: 'Document already exists' };
    }

    // URL 파싱
    const parsed = await this.parserService.parseUrl(url);

    // 문서 저장
    const id = this.storageService.createDocument(
      url,
      parsed.title,
      parsed.hash,
      parsed.content,
    );

    // 번역 및 섹션 분류
    const sections = await this.translationService.translateAndSplit(
      parsed.content,
    );
    this.storageService.saveTranslation(id, { sections });

    return { id, title: parsed.title };
  }

  @Get()
  listDocuments() {
    return this.storageService.listDocuments();
  }

  @Get(':id')
  getDocument(@Param('id') id: string) {
    const meta = this.storageService.getDocumentMeta(id);
    if (!meta) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }

    const translation = this.storageService.getTranslation(id);
    return { meta, translation };
  }

  @Get(':id/check-update')
  async checkUpdate(@Param('id') id: string) {
    const meta = this.storageService.getDocumentMeta(id);
    if (!meta) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }

    const parsed = await this.parserService.parseUrl(meta.url);
    const hasUpdate = parsed.hash !== meta.hash;

    return { hasUpdate, currentHash: meta.hash, newHash: parsed.hash };
  }

  @Post(':id/refresh')
  async refreshDocument(@Param('id') id: string) {
    const meta = this.storageService.getDocumentMeta(id);
    if (!meta) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }

    const parsed = await this.parserService.parseUrl(meta.url);

    // 해시 및 원본 업데이트
    this.storageService.updateHash(id, parsed.hash, parsed.content);

    // 재번역
    const sections = await this.translationService.translateAndSplit(
      parsed.content,
    );
    this.storageService.saveTranslation(id, { sections });

    return { id, title: parsed.title, updated: true };
  }

  @Delete(':id')
  deleteDocument(@Param('id') id: string) {
    const meta = this.storageService.getDocumentMeta(id);
    if (!meta) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }

    this.storageService.deleteDocument(id);
    return { deleted: true };
  }
}
