import React from 'react';
import { cn } from '@/app/utils/cn';

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <form
        ref={ref}
        className={cn(
          'space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm',
          className
        )}
        {...props}
      >
        {children}
      </form>
    );
  }
);

Form.displayName = 'Form';

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({ label, error, children }) => {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'form-input',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
    );
  }
);

FormInput.displayName = 'FormInput';

export { Form, FormField, FormInput }; 