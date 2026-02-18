import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { QuizService } from './quiz.service';

@Controller('documents/:docId/quiz')
export class QuizController {
  constructor(private quizService: QuizService) {}

  @Post('generate')
  async generateQuiz(
    @Param('docId') docId: string,
    @Query('count') count?: string,
  ) {
    const quizCount = count ? parseInt(count, 10) : 5;
    const quizzes = await this.quizService.generateQuiz(docId, quizCount);
    return { quizzes };
  }

  @Get()
  getQuiz(@Param('docId') docId: string) {
    const record = this.quizService.getQuizRecord(docId);
    const averageScore = this.quizService.getAverageScore(docId);
    return { record, averageScore };
  }

  @Post(':quizIndex/answer')
  async submitAnswer(
    @Param('docId') docId: string,
    @Param('quizIndex') quizIndex: string,
    @Body('answer') answer: string,
  ) {
    const result = await this.quizService.gradeAnswer(
      docId,
      parseInt(quizIndex, 10),
      answer,
    );
    return result;
  }
}
