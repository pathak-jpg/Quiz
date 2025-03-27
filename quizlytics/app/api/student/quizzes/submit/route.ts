import { NextResponse } from 'next/server';
import { prisma } from '@/app/utils/db';
import { getCurrentUser } from '@/app/utils/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { quizId, answers, timeSpent, optionSwitches } = await request.json();

    // Validate input
    if (!quizId || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { message: 'Invalid input' },
        { status: 400 }
      );
    }

    // Get quiz with correct answers
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { message: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Calculate score
    let correctAnswers = 0;
    const totalQuestions = quiz.questions.length;

    answers.forEach(answer => {
      const question = quiz.questions.find(q => q.id === answer.questionId);
      if (question) {
        const correctOption = question.options.find(opt => opt.isCorrect);
        if (correctOption && answer.selectedOptionId === correctOption.id) {
          correctAnswers++;
        }
      }
    });

    const score = (correctAnswers / totalQuestions) * 100;
    const efficiency = timeSpent > 0 ? score / timeSpent : 0;
    const skippedCount = answers.filter(a => a.isSkipped).length;

    // Create quiz attempt with answers and option switches
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId: user.id,
        score,
        timeSpent,
        efficiency,
        skippedCount,
        completedAt: new Date(),
        answers: {
          create: answers.map(answer => ({
            questionId: answer.questionId,
            selectedOptionId: answer.selectedOptionId,
            timeSpent: answer.timeSpent,
            isSkipped: answer.isSkipped,
          })),
        },
        optionSwitches: {
          create: optionSwitches.flatMap(({ questionId, switches }: { questionId: string, switches: string[] }) =>
            switches.map((optionId: string, index: number) => ({
              optionId,
              timestamp: new Date(Date.now() + index), // Ensure unique timestamps
            }))
          ),
        },
      },
    });

    return NextResponse.json({ attemptId: attempt.id }, { status: 201 });
  } catch (error) {
    console.error('Submit quiz error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 