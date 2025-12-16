import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../hooks/useAuth';
import { getHomePath } from '../utils/permissions';

const loginSchema = z.object({
  email: z.string().email('Enter a valid government email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginForm) => {
    setServerError(null);
    try {
      const { user } = await login(values.email, values.password);
      navigate(getHomePath(user?.role), { replace: true });
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message;
      setServerError(apiMessage || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-2">CEMS Login</h1>
        <p className="text-sm text-slate-400 mb-6">Access with your government credentials.</p>
        {serverError && <p className="mb-4 text-red-400 text-sm">{serverError}</p>}
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
              {...register('password')}
            />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-lg py-2 font-semibold"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

