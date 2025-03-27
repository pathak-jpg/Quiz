'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/app/components/ui/Button';

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
}

interface QuizData {
  id: string;
  title: string;
  questions: Question[];
}

export default function TakeQuiz({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [optionSwitches, setOptionSwitches] = useState<Record<string, string[]>>({});
  const [startTime] = useState<Record<string, number>>({});
  const [quizStartTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`/api/student/quizzes/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch quiz');
        }
        const data = await response.json();
        setQuiz(data);
        // Initialize start times for each question
        const times: Record<string, number> = {};
        data.questions.forEach((q: Question) => {
          times[q.id] = Date.now();
        });
        Object.assign(startTime, times);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quiz');
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [params.id]);

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [questionId]: optionId,
    }));

    setOptionSwitches(prev => ({
      ...prev,
      [questionId]: [...(prev[questionId] || []), optionId],
    }));
  };

  const handleSkip = () => {
    const currentQuestion = quiz?.questions[currentQuestionIndex];
    if (currentQuestion) {
      setSelectedOptions(prev => ({
        ...prev,
        [currentQuestion.id]: 'skipped',
      }));
    }
    handleNext();
  };

  const handleNext = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    const unansweredQuestions = quiz.questions.filter(
      q => !selectedOptions[q.id] || selectedOptions[q.id] === 'skipped'
    );

    if (unansweredQuestions.length > 0 && 
        !window.confirm('You have unanswered questions. Are you sure you want to submit?')) {
      return;
    }

    setIsSubmitting(true);

    try {
      const answers = quiz.questions.map(question => ({
        questionId: question.id,
        selectedOptionId: selectedOptions[question.id] === 'skipped' ? null : selectedOptions[question.id],
        timeSpent: Math.round((Date.now() - startTime[question.id]) / 1000),
        isSkipped: selectedOptions[question.id] === 'skipped',
      }));

      const response = await fetch('/api/student/quizzes/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: quiz.id,
          answers,
          timeSpent: Math.round((Date.now() - quizStartTime) / 1000),
          optionSwitches: Object.entries(optionSwitches).map(([questionId, switches]) => ({
            questionId,
            switches,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      const { attemptId } = await response.json();
      router.push(`/student/results/${attemptId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="text-center">Loading quiz...</div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="container py-8">
        <div className="text-center text-red-500">{error || 'Failed to load quiz'}</div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="mb-2">{quiz.title}</h1>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
          <span>
            {Object.values(selectedOptions).filter(opt => opt === 'skipped').length} skipped
          </span>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 text-xl font-medium">
          {currentQuestion.text}
        </h2>

        <div className="space-y-3">
          {currentQuestion.options.map(option => (
            <button
              key={option.id}
              onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
              className={`w-full rounded-lg border p-4 text-left transition ${
                selectedOptions[currentQuestion.id] === option.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              {option.text}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            Previous
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={handleSkip}
              variant="secondary"
            >
              Skip
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                isLoading={isSubmitting}
              >
                Submit Quiz
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex flex-wrap gap-2">
          {quiz.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`h-8 w-8 rounded-full ${
                index === currentQuestionIndex
                  ? 'bg-blue-500 text-white'
                  : selectedOptions[quiz.questions[index].id]
                  ? selectedOptions[quiz.questions[index].id] === 'skipped'
                    ? 'bg-gray-200'
                    : 'bg-green-500 text-white'
                  : 'bg-gray-100'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 