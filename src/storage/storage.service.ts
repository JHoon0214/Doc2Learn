import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  DocumentMeta,
  TranslatedDocument,
  SectionChat,
  ChatMessage,
  QuizRecord,
} from './storage.types';

@Injectable()
export class StorageService {
  private readonly dataDir: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data', 'documents');
    this.ensureDir(this.dataDir);
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private getDocPath(docId: string): string {
    return path.join(this.dataDir, docId);
  }

  private urlToId(url: string): string {
    return crypto.createHash('md5').update(url).digest('hex').slice(0, 12);
  }

  createDocument(
    url: string,
    title: string,
    hash: string,
    originalContent: string,
  ): string {
    const id = this.urlToId(url);
    const docPath = this.getDocPath(id);
    this.ensureDir(docPath);
    this.ensureDir(path.join(docPath, 'chats'));

    const meta: DocumentMeta = {
      id,
      url,
      title,
      hash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(
      path.join(docPath, 'meta.json'),
      JSON.stringify(meta, null, 2),
    );
    fs.writeFileSync(path.join(docPath, 'original.md'), originalContent);

    return id;
  }

  getIdFromUrl(url: string): string {
    return this.urlToId(url);
  }

  existsByUrl(url: string): boolean {
    const id = this.urlToId(url);
    return this.getDocumentMeta(id) !== null;
  }

  listDocuments(): DocumentMeta[] {
    if (!fs.existsSync(this.dataDir)) return [];

    const dirs = fs.readdirSync(this.dataDir);
    const documents: DocumentMeta[] = [];

    for (const dir of dirs) {
      const metaPath = path.join(this.dataDir, dir, 'meta.json');
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        documents.push(meta);
      }
    }

    return documents.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  getDocumentMeta(docId: string): DocumentMeta | null {
    const metaPath = path.join(this.getDocPath(docId), 'meta.json');
    if (!fs.existsSync(metaPath)) return null;
    return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  }

  getOriginal(docId: string): string | null {
    const originalPath = path.join(this.getDocPath(docId), 'original.md');
    if (!fs.existsSync(originalPath)) return null;
    return fs.readFileSync(originalPath, 'utf-8');
  }

  saveTranslation(docId: string, translated: TranslatedDocument): void {
    const docPath = this.getDocPath(docId);
    fs.writeFileSync(
      path.join(docPath, 'translated.json'),
      JSON.stringify(translated, null, 2),
    );
    this.updateTimestamp(docId);
  }

  getTranslation(docId: string): TranslatedDocument | null {
    const translatedPath = path.join(this.getDocPath(docId), 'translated.json');
    if (!fs.existsSync(translatedPath)) return null;
    return JSON.parse(fs.readFileSync(translatedPath, 'utf-8'));
  }

  saveChat(docId: string, sectionId: number, messages: ChatMessage[]): void {
    const chatPath = path.join(
      this.getDocPath(docId),
      'chats',
      `section-${sectionId}.json`,
    );
    const chat: SectionChat = { sectionId, messages };
    fs.writeFileSync(chatPath, JSON.stringify(chat, null, 2));
    this.updateTimestamp(docId);
  }

  getChat(docId: string, sectionId: number): SectionChat | null {
    const chatPath = path.join(
      this.getDocPath(docId),
      'chats',
      `section-${sectionId}.json`,
    );
    if (!fs.existsSync(chatPath)) return null;
    return JSON.parse(fs.readFileSync(chatPath, 'utf-8'));
  }

  saveQuiz(docId: string, quiz: QuizRecord): void {
    const quizPath = path.join(this.getDocPath(docId), 'quiz.json');
    fs.writeFileSync(quizPath, JSON.stringify(quiz, null, 2));
    this.updateTimestamp(docId);
  }

  getQuiz(docId: string): QuizRecord | null {
    const quizPath = path.join(this.getDocPath(docId), 'quiz.json');
    if (!fs.existsSync(quizPath)) return null;
    return JSON.parse(fs.readFileSync(quizPath, 'utf-8'));
  }

  updateHash(docId: string, newHash: string, newContent: string): void {
    const meta = this.getDocumentMeta(docId);
    if (!meta) return;

    meta.hash = newHash;
    meta.updatedAt = new Date().toISOString();

    const docPath = this.getDocPath(docId);
    fs.writeFileSync(
      path.join(docPath, 'meta.json'),
      JSON.stringify(meta, null, 2),
    );
    fs.writeFileSync(path.join(docPath, 'original.md'), newContent);
  }

  deleteDocument(docId: string): void {
    const docPath = this.getDocPath(docId);
    if (fs.existsSync(docPath)) {
      fs.rmSync(docPath, { recursive: true });
    }
  }

  private updateTimestamp(docId: string): void {
    const meta = this.getDocumentMeta(docId);
    if (!meta) return;

    meta.updatedAt = new Date().toISOString();
    const metaPath = path.join(this.getDocPath(docId), 'meta.json');
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  }
}
