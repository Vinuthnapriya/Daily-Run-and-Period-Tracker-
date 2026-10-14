import { FormEvent, useState } from 'react';
import { Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthScreenProps {
  onConfigured?: () => void;
}

export function AuthScreen({ onConfigured }: AuthScreenProps) {
  const client = supabase;
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!client) {
    return (
      <AuthLayout>
        <h2 className="text-xl font-bold text-white">Connect cloud storage</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Add <code className="text-emerald-300">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-emerald-300">VITE_SUPABASE_ANON_KEY</code> to your local
          <code className="text-emerald-300"> .env.local</code> file. See README.md for setup and
          deployment steps.
        </p>
      </AuthLayout>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      if (isSignUp) {
        const { data, error } = await client.auth.signUp({ email, password });
        if (error) throw error;

        if (data.session) {
          onConfigured?.();
        } else {
          setMessage('Check your email to confirm your account, then sign in.');
        }
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-xl font-bold text-white">{isSignUp ? 'Create your account' : 'Sign in'}</h2>
      <p className="mt-2 text-sm text-slate-400">
        Your tracker data is stored in your private cloud account and follows you across devices.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-300">
          Email
          <input
            autoComplete="email"
            className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label className="block text-sm font-medium text-slate-300">
          Password
          <input
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500"
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {message && <p className="text-sm text-emerald-300">{message}</p>}
        {errorMessage && <p role="alert" className="text-sm text-rose-300">{errorMessage}</p>}
        <button
          className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <button
        className="mt-4 w-full text-sm text-slate-400 hover:text-white"
        onClick={() => {
          setIsSignUp((current) => !current);
          setMessage(null);
          setErrorMessage(null);
        }}
        type="button"
      >
        {isSignUp ? 'Already have an account? Sign in' : 'New here? Create an account'}
      </button>
      <p className="mt-6 text-xs leading-5 text-slate-500">
        Period and run logs can be sensitive. Use a unique password and only deploy to a trusted
        hosting provider.
      </p>
    </AuthLayout>
  );
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
            <Activity className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-bold text-white">Daily Run Tracker</p>
            <p className="text-xs text-slate-400">Private cloud sync</p>
          </div>
        </div>
        {children}
      </section>
    </main>
  );
}
