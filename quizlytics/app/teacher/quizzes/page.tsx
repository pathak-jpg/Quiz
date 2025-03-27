import Link from 'next/link';
import { prisma } from '@/app/utils/db';
import { getCurrentUser } from '@/app/utils/auth';
import Button from '@/app/components/ui/Button';

export default async function TeacherQuizzes() {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }

  const quizzes = await prisma.quiz.findMany({
    where: {
      creatorId: user.id,
    },
    include: {
      _count: {
        select: {
          attempts: true,
          questions: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1>My Quizzes</h1>
        <Link href="/teacher/create-quiz">
          <Button>Create New Quiz</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium">{quiz.title}</h3>
                {quiz.description && (
                  <p className="mt-1 text-sm text-gray-500">{quiz.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {quiz.isActive ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                    Inactive
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <p>Questions: {quiz._count.questions}</p>
                <p>Attempts: {quiz._count.attempts}</p>
              </div>
              <div>
                <p>Code: {quiz.code}</p>
                <p>Created: {new Date(quiz.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="mt-4 flex space-x-2">
              <Link href={`/teacher/quizzes/${quiz.id}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </Link>
              <Link href={`/teacher/quizzes/${quiz.id}/analytics`} className="flex-1">
                <Button variant="outline" className="w-full">
                  Analytics
                </Button>
              </Link>
            </div>
          </div>
        ))}

        {quizzes.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p>You haven't created any quizzes yet.</p>
            <Link href="/teacher/create-quiz" className="mt-2 inline-block">
              <Button>Create Your First Quiz</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 