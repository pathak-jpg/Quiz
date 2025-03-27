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

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { message: 'Quiz code is required' },
        { status: 400 }
      );
    }

    const quiz = await prisma.quiz.findUnique({
      where: { code },
    });

    if (!quiz) {
      return NextResponse.json(
        { message: 'Invalid quiz code' },
        { status: 404 }
      );
    }

    if (!quiz.isActive) {
      return NextResponse.json(
        { message: 'This quiz is no longer active' },
        { status: 400 }
      );
    }

    // Check if student has already attempted this quiz
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId: quiz.id,
        userId: user.id,
        completedAt: { not: null },
      },
    });

    if (existingAttempt) {
      return NextResponse.json(
        { message: 'You have already completed this quiz' },
        { status: 400 }
      );
    }

    return NextResponse.json({ quizId: quiz.id });
  } catch (error) {
    console.error('Validate quiz error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 