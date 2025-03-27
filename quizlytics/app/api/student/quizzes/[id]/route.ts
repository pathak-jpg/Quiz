import { NextResponse } from 'next/server';
import { prisma } from '@/app/utils/db';
import { getCurrentUser } from '@/app/utils/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        questions: {
          select: {
            id: true,
            text: true,
            difficulty: true,
            options: {
              select: {
                id: true,
                text: true,
              },
            },
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

    if (!quiz.questions || quiz.questions.length === 0) {
      return NextResponse.json(
        { message: 'Quiz has no questions' },
        { status: 400 }
      );
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Get quiz error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 