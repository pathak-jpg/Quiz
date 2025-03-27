'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Form, FormField, FormInput } from '@/app/components/ui/Form';
import Button from '@/app/components/ui/Button';

export default function SignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to sign in');
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md py-12">
      <h1 className="mb-8 text-center">Sign In</h1>
      
      <Form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        <FormField label="Email">
          <FormInput
            type="email"
            name="email"
            required
            placeholder="Enter your email"
          />
        </FormField>

        <FormField label="Password">
          <FormInput
            type="password"
            name="password"
            required
            placeholder="Enter your password"
          />
        </FormField>

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
        >
          Sign In
        </Button>

        <div className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-blue-600 hover:underline">
            Sign Up
          </Link>
        </div>
      </Form>
    </div>
  );
} 