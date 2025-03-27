import { NextResponse } from 'next/server';
import { prisma } from '@/app/utils/db';
import { getCurrentUser } from '@/app/utils/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get quiz with attempts and related data
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          include: {
            options: true,
            answers: {
              include: {
                attempt: {
                  include: {
                    optionSwitches: true,
                  },
                },
              },
            },
          },
        },
        attempts: {
          include: {
            answers: true,
            optionSwitches: true,
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

    if (quiz.creatorId !== user.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Calculate analytics
    const totalAttempts = quiz.attempts.length;
    const averageScore = totalAttempts > 0
      ? quiz.attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / totalAttempts
      : 0;
    const averageTimeSpent = totalAttempts > 0
      ? quiz.attempts.reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0) / totalAttempts
      : 0;
    const averageEfficiency = totalAttempts > 0
      ? quiz.attempts.reduce((sum, attempt) => sum + (attempt.efficiency || 0), 0) / totalAttempts
      : 0;

    // Calculate difficulty breakdown
    const difficultyBreakdown = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 },
    };

    quiz.questions.forEach(question => {
      const difficulty = question.difficulty as keyof typeof difficultyBreakdown;
      const correctOptionId = question.options.find(opt => opt.isCorrect)?.id;
      
      question.answers.forEach(answer => {
        difficultyBreakdown[difficulty].total++;
        if (answer.selectedOptionId === correctOptionId) {
          difficultyBreakdown[difficulty].correct++;
        }
      });
    });

    // Calculate skipped questions
    const skippedQuestions = quiz.attempts.reduce(
      (sum, attempt) => sum + (attempt.skippedCount || 0),
      0
    );

    // Analyze option switching behavior
    const optionSwitchingData = {
      lowSwitching: 0,    // 0-2 switches per question
      mediumSwitching: 0, // 3-5 switches per question
      highSwitching: 0,   // 6+ switches per question
    };

    quiz.attempts.forEach(attempt => {
      const questionsCount = quiz.questions.length;
      const switchesPerQuestion = attempt.optionSwitches.length / questionsCount;

      if (switchesPerQuestion <= 2) optionSwitchingData.lowSwitching++;
      else if (switchesPerQuestion <= 5) optionSwitchingData.mediumSwitching++;
      else optionSwitchingData.highSwitching++;
    });

    // Calculate time distribution
    const timeRanges = [
      { max: 15, label: '0-15 min' },
      { max: 30, label: '15-30 min' },
      { max: 45, label: '30-45 min' },
      { max: 60, label: '45-60 min' },
      { max: Infinity, label: '60+ min' },
    ];

    const timeDistribution = timeRanges.map(range => ({
      label: range.label,
      count: quiz.attempts.filter(attempt => {
        const minutes = (attempt.timeSpent || 0) / 60;
        return minutes <= range.max && minutes > (range.max === timeRanges[0].max ? 0 : timeRanges[timeRanges.indexOf(range) - 1].max);
      }).length,
    }));

    return NextResponse.json({
      quiz: {
        title: quiz.title,
        description: quiz.description,
        code: quiz.code,
      },
      totalAttempts,
      averageScore,
      averageTimeSpent,
      averageEfficiency,
      difficultyBreakdown,
      skippedQuestions,
      optionSwitchingData,
      timeDistribution,
    });
  } catch (error) {
    console.error('Quiz analytics error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 