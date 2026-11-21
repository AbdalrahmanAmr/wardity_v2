import { FC, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBlock } from "@/components/ui/ErrorBlock";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { getErrorMessage } from "@/utils/errorMessage";

export const Register: FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim();
    const normalizedName = name.trim();
    const normalizedPhone = phone.trim();

    if (normalizedName.length < 2) {
      setError("Name: Enter at least 2 characters.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Email: Enter a valid email address, such as name@example.com.");
      return;
    }
    if (!normalizedPhone) {
      setError("Phone number: Enter a phone number.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Confirmed password: Enter the same password in both password fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      await register(normalizedEmail, password, normalizedName, normalizedPhone);
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-wardity-bg flex items-center justify-center py-12 px-4 dark:bg-wardity-bg-dark">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 dark:bg-wardity-card-dark">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-wardity-text-dark">Create Account</h1>
            <p className="text-gray-600 dark:text-gray-300">Join Wardity and start shopping</p>
          </div>

          {error && (
            <div className="mb-6">
              <ErrorBlock
                compact
                title="Account could not be created"
                message={error}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:border-gray-600 dark:bg-gray-800 dark:text-wardity-text-dark"
                placeholder="John Doe"
              />
            </div>

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
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:border-gray-600 dark:bg-gray-800 dark:text-wardity-text-dark"
                placeholder="Phone number"
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:border-gray-600 dark:bg-gray-800 dark:text-wardity-text-dark"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
