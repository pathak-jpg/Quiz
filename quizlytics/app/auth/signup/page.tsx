'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Form, FormField, FormInput } from '@/app/components/ui/Form';
import Button from '@/app/components/ui/Button';

export default function SignUp() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, role }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to sign up');
      }

      router.push('/auth/signin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md py-12">
      <h1 className="mb-8 text-center">Sign Up</h1>
      
      <Form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        <FormField label="Name">
          <FormInput
            type="text"
            name="name"
            required
            placeholder="Enter your name"
          />
        </FormField>

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

        <FormField label="Role">
          <select
            name="role"
            className="form-input"
            required
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </FormField>

        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
        >
          Sign Up
        </Button>

        <div className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-blue-600 hover:underline">
            Sign In
          </Link>
        </div>
      </Form>
    </div>
  );
} 