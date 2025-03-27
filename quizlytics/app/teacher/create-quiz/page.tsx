'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, FormField, FormInput } from '@/app/components/ui/Form';
import Button from '@/app/components/ui/Button';

interface Question {
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: { text: string; isCorrect: boolean }[];
}

export default function CreateQuiz() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    text: '',
    difficulty: 'medium',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  });

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = { ...newOptions[index], text: value };
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const handleCorrectOptionChange = (index: number) => {
    const newOptions = currentQuestion.options.map((option, i) => ({
      ...option,
      isCorrect: i === index,
    }));
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const addQuestion = () => {
    if (!currentQuestion.text || currentQuestion.options.some(opt => !opt.text)) {
      setError('Please fill in all fields for the question');
      return;
    }
    if (!currentQuestion.options.some(opt => opt.isCorrect)) {
      setError('Please select a correct answer');
      return;
    }
    setQuestions([...questions, currentQuestion]);
    setCurrentQuestion({
      text: '',
      difficulty: 'medium',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (questions.length === 0) {
      setError('Please add at least one question');
      return;
    }

    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    try {
      const response = await fetch('/api/teacher/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          questions,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create quiz');
      }

      const quiz = await response.json();
      router.push(`/teacher/quizzes/${quiz.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quiz');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="mb-8">Create New Quiz</h1>

      <Form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <FormField label="Quiz Title">
            <FormInput
              name="title"
              required
              placeholder="Enter quiz title"
            />
          </FormField>

          <FormField label="Description">
            <textarea
              name="description"
              className="form-input"
              rows={3}
              placeholder="Enter quiz description"
            />
          </FormField>
        </div>

        <div className="space-y-4">
          <h2>Questions</h2>
          
          {questions.map((q, i) => (
            <div key={i} className="card">
              <h3>Question {i + 1}</h3>
              <p className="mt-2">{q.text}</p>
              <p className="mt-1 text-sm text-gray-500">Difficulty: {q.difficulty}</p>
              <ul className="mt-2 space-y-1">
                {q.options.map((opt, j) => (
                  <li key={j} className={opt.isCorrect ? 'text-green-600 font-medium' : ''}>
                    {opt.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="card">
            <h3>Add Question</h3>
            
            <div className="mt-4 space-y-4">
              <FormField label="Question Text">
                <FormInput
                  value={currentQuestion.text}
                  onChange={(e) => setCurrentQuestion({
                    ...currentQuestion,
                    text: e.target.value,
                  })}
                  placeholder="Enter question text"
                />
              </FormField>

              <FormField label="Difficulty">
                <select
                  className="form-input"
                  value={currentQuestion.difficulty}
                  onChange={(e) => setCurrentQuestion({
                    ...currentQuestion,
                    difficulty: e.target.value as 'easy' | 'medium' | 'hard',
                  })}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </FormField>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Options
                </label>
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={option.isCorrect}
                      onChange={() => handleCorrectOptionChange(index)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <FormInput
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                  </div>
                ))}
              </div>

              <Button
                type="button"
                onClick={addQuestion}
                variant="secondary"
              >
                Add Question
              </Button>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          disabled={questions.length === 0}
        >
          Create Quiz
        </Button>
      </Form>
    </div>
  );
} 