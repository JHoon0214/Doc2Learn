import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { LLMService } from '../llm/llm.service';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '../config/config.service';
import { Quiz, QuizRecord, QuizResult } from '../storage/storage.types';

const QuizzesSchema = z.array(
  z.object({
    type: z.enum(['multiple_choice', 'short_answer', 'explanation']),
    question: z.string(),
    options: z.array(z.string()).optional(),
  }),
);

const GradeSchema = z.object({
  score: z.number(),
  feedback: z.string(),
});

@Injectable()
export class QuizService {
  constructor(
    private llmService: LLMService,
    private storageService: StorageService,
    private configService: ConfigService,
  ) {}

  async generateQuiz(docId: string, count: number = 5): Promise<Quiz[]> {
    const translation = this.storageService.getTranslation(docId);
    if (!translation) {
      throw new Error('Document translation not found');
    }

    const content = translation.sections
      .map((s) => `## ${s.title}\n${s.content}`)
      .join('\n\n');
    const language = this.configService.getLanguage();

    const prompt = `You are a quiz generator for study purposes.
Generate ${count} questions based on the following document content.
All questions must be in ${language}.

Mix different question types:
- multiple_choice: 4지선다 객관식
- short_answer: 단답형
- explanation: 설명형 (개념을 설명해보세요)

Rules:
- options는 multiple_choice일 때만 포함 (정확히 4개)
- Questions should test understanding, not just memorization

Document content:
${content}`;

    const quizzes = await this.llmService.generate(
      [
        { role: 'system', content: prompt },
        { role: 'user', content: `Generate ${count} quiz questions.` },
      ],
      QuizzesSchema,
    );

    const quizRecord: QuizRecord = { quizzes, results: [] };
    this.storageService.saveQuiz(docId, quizRecord);

    return quizzes;
  }

  async gradeAnswer(
    docId: string,
    quizIndex: number,
    userAnswer: string,
  ): Promise<QuizResult> {
    const quizRecord = this.storageService.getQuiz(docId);
    if (!quizRecord) {
      throw new Error('Quiz not found');
    }

    const quiz = quizRecord.quizzes[quizIndex];
    if (!quiz) {
      throw new Error('Quiz question not found');
    }

    const translation = this.storageService.getTranslation(docId);
    const content =
      translation?.sections
        .map((s) => `## ${s.title}\n${s.content}`)
        .join('\n\n') ?? '';
    const language = this.configService.getLanguage();

    const prompt = `You are a quiz grader. Evaluate the user's answer based on the document content.
Respond in ${language}.

Document content:
${content}

Question: ${quiz.question}
${quiz.options ? `Options: ${quiz.options.join(', ')}` : ''}
User's answer: ${userAnswer}

Grade the answer:
- score: 0-100 (how correct is the answer)
- feedback: Explain what's correct/incorrect, provide hints for improvement`;

    const grade = await this.llmService.generate(
      [
        { role: 'system', content: prompt },
        { role: 'user', content: 'Grade this answer.' },
      ],
      GradeSchema,
    );

    const result: QuizResult = {
      quizIndex,
      userAnswer,
      score: grade.score,
      feedback: grade.feedback,
    };

    quizRecord.results.push(result);
    this.storageService.saveQuiz(docId, quizRecord);

    return result;
  }

  getQuizRecord(docId: string): QuizRecord | null {
    return this.storageService.getQuiz(docId);
  }

  getAverageScore(docId: string): number {
    const quizRecord = this.storageService.getQuiz(docId);
    if (!quizRecord || quizRecord.results.length === 0) {
      return 0;
    }

    const total = quizRecord.results.reduce((sum, r) => sum + r.score, 0);
    return Math.round(total / quizRecord.results.length);
  }
}
