import { NextResponse } from 'next/server';
import { prisma } from '@/app/utils/db';
import { getCurrentUser, generateQuizCode } from '@/app/utils/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { title, description, questions } = await request.json();

    // Validate input
    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { message: 'Invalid input' },
        { status: 400 }
      );
    }

    // Generate a unique quiz code
    let code = generateQuizCode();
    let existingQuiz = await prisma.quiz.findUnique({ where: { code } });
    while (existingQuiz) {
      code = generateQuizCode();
      existingQuiz = await prisma.quiz.findUnique({ where: { code } });
    }

    // Create quiz with questions and options
    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        code,
        creatorId: user.id,
        questions: {
          create: questions.map((q: any) => ({
            text: q.text,
            difficulty: q.difficulty,
            options: {
              create: q.options.map((opt: any) => ({
                text: opt.text,
                isCorrect: opt.isCorrect,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error('Create quiz error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 