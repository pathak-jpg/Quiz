'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, FormField, FormInput } from '@/app/components/ui/Form';
import Button from '@/app/components/ui/Button';

export default function AttemptQuiz() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const code = formData.get('code') as string;

    try {
      const response = await fetch(`/api/student/quizzes/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Invalid quiz code');
      }

      const { quizId } = await response.json();
      router.push(`/student/quiz/${quizId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start quiz');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md py-12">
      <h1 className="mb-8 text-center">Take a Quiz</h1>

      <Form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        <FormField label="Quiz Code">
          <FormInput
            name="code"
            required
            placeholder="Enter quiz code"
            className="uppercase"
            maxLength={6}
            pattern="[A-Z0-9]{6}"
            title="Quiz code must be 6 characters long and contain only uppercase letters and numbers"
          />
        </FormField>

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
        >
          Start Quiz
        </Button>
      </Form>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Enter the quiz code provided by your teacher to start the quiz.</p>
      </div>
    </div>
  );
} 