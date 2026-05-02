import type { QuizVraag, QuizVraagOpen } from '@/config/opdrachten';

export function isQuizVraagOpen(v: QuizVraag): v is QuizVraagOpen {
  return (v as { type?: string }).type === 'open';
}

export function quizVraagIsBeantwoord(v: QuizVraag, waarde: number | string): boolean {
  if (isQuizVraagOpen(v)) {
    return typeof waarde === 'string' && waarde.trim().length > 0;
  }
  return typeof waarde === 'number' && waarde >= 0;
}
