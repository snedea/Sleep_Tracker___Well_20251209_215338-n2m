import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { loginSchema, type LoginInput } from '@sleep-tracker/shared';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';

export function LoginForm() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      setError(null);
      await login(data);
    } catch (err: unknown) {
      const error = err as { error?: string };
      setError(error.error || 'Login failed. Please try again.');
    }
  };

  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" fullWidth isLoading={isSubmitting}>
            Sign In
          </Button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-sleep hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </form>
      </CardBody>
    </Card>
  );
}

// Register form
export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string; password: string; name: string }>({
    resolver: zodResolver(loginSchema.extend({ name: loginSchema.shape.email })),
  });

  const onSubmit = async (data: { email: string; password: string; name: string }) => {
    try {
      setError(null);
      await registerUser(data);
    } catch (err: unknown) {
      const error = err as { error?: string };
      setError(error.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <Input
            label="Name"
            type="text"
            placeholder="Your name"
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Create a password"
            helperText="At least 8 characters with uppercase, lowercase, and number"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" fullWidth isLoading={isSubmitting}>
            Create Account
          </Button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-sleep hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </CardBody>
    </Card>
  );
}
