import Link from 'next/link';
import { getCurrentUser } from '../utils/auth';
import Button from './ui/Button';

const Navigation = async () => {
  const user = await getCurrentUser();

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex h-16 justify-between items-center">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Quizlytics
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                {user.role === 'teacher' ? (
                  <>
                    <Link href="/teacher/create-quiz">
                      <Button variant="primary" size="sm">Create Quiz</Button>
                    </Link>
                    <Link href="/teacher/quizzes">
                      <Button variant="outline" size="sm">My Quizzes</Button>
                    </Link>
                    <Link href="/teacher/analytics">
                      <Button variant="outline" size="sm">Analytics</Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/student/attempt-quiz">
                      <Button variant="primary" size="sm">Take Quiz</Button>
                    </Link>
                    <Link href="/student/results">
                      <Button variant="outline" size="sm">My Results</Button>
                    </Link>
                  </>
                )}
                <Link href="/api/auth/signout">
                  <Button variant="secondary" size="sm">Sign Out</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="outline" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="primary" size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 