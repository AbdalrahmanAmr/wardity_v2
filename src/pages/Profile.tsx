import { FC, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ErrorBlock } from "@/components/ui/ErrorBlock";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { UserIcon, EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { getErrorMessage } from "@/utils/errorMessage";

export const Profile: FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await updateUser(formData);
      setIsEditing(false);
    } catch (err) {
      setError(getErrorMessage(err, "Your profile could not be updated. Check the details and try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = (): void => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-wardity-bg py-12 dark:bg-wardity-bg-dark" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 dark:text-wardity-text-dark">My Profile</h1>

          {error && (
            <div className="mb-6">
              <ErrorBlock
                compact
                title="Profile could not be updated"
                message={error}
              />
            </div>
          )}

          <div className="bg-white rounded-xl p-6 shadow-sm dark:bg-wardity-card-dark">
            {!isEditing ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <UserIcon className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-wardity-text-dark">{user.name}</h2>
                    <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-wardity-text-dark">{user.email}</p>
                    </div>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-3">
                      <PhoneIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                        <p className="font-medium text-gray-900 dark:text-wardity-text-dark">{user.phone}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                  >
                    Logout
                  </button>
                </div>
                <Link
                  to="/orders"
                  className="mt-4 block rounded-lg border border-primary px-4 py-3 text-center font-semibold text-primary transition-colors hover:bg-primary/5"
                >
                  {t("orderHistory")}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-wardity-text-dark"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-wardity-text-dark"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-200">
                    Phone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-wardity-text-dark"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user?.name || "",
                        email: user?.email || "",
                        phone: user?.phone || "",
                      });
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
