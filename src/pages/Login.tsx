import { FC, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBlock } from "@/components/ui/ErrorBlock";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getErrorMessage } from "@/utils/errorMessage";

export const Login: FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as
    | { from?: string | { pathname?: string } }
    | null
    | undefined;
  const from =
    typeof state?.from === "string"
      ? state.from
      : state?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Email: Enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Email: Enter a valid email address, such as name@example.com.");
      return;
    }
    if (!password) {
      setError("Password: Enter your password.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login(normalizedEmail, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "We could not sign you in. Check your details and try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-wardity-bg flex items-center justify-center py-12 px-4 dark:bg-wardity-bg-dark">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 dark:bg-wardity-card-dark">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-wardity-text-dark">Welcome Back</h1>
            <p className="text-gray-600 dark:text-gray-300">Sign in to your Wardity account</p>
          </div>

          {error && (
            <div className="mb-6">
              <ErrorBlock
                compact
                title="Sign-in unsuccessful"
                message={error}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:border-gray-600 dark:bg-gray-800 dark:text-wardity-text-dark"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:border-gray-600 dark:bg-gray-800 dark:text-wardity-text-dark"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

