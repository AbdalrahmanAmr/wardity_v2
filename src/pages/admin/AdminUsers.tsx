import { FC } from "react";
import { useAdminUsers, useDeleteAdminUser } from "@/services/queries/adminQueries";
import { PageLoadingSpinner, ErrorBlock } from "@/components/ui";
import { useAdminTranslations } from "@/locales/admin";
import { getErrorMessage } from "@/utils/errorMessage";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export const AdminUsers: FC = () => {
  const { data: users, isLoading, isError } = useAdminUsers();
  const deleteUser = useDeleteAdminUser();
  const { user: currentUser } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [isErrorMessage, setIsErrorMessage] = useState(false);
  const t = useAdminTranslations();

  const handleDelete = async (userId: string, name: string) => {
    if (!window.confirm(`Delete ${name}? This also removes their cart, wishlist, and orders.`)) return;
    try {
      await deleteUser.mutateAsync(userId);
      setIsErrorMessage(false);
      setMessage(t.deleted);
    } catch (error) {
      setIsErrorMessage(true);
      setMessage(getErrorMessage(error));
    }
  };

  if (isLoading) return <PageLoadingSpinner />;
  if (isError) return <ErrorBlock message={t.failedUsers} />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-serif text-wardity-primary">{t.users}</h1>
      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm ${isErrorMessage ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300" : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"}`}>
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-wardity-card-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">ID</th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">{t.name}</th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Email</th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Phone</th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">{t.role}</th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">{t.joinedDate}</th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {users?.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                <td className="p-4 text-sm font-mono text-gray-500">{user.id.slice(0, 8)}...</td>
                <td className="p-4 font-medium">{user.name}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4 text-gray-500">{user.phone || "-"}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${user.role === "admin" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <button
                    type="button"
                    disabled={deleteUser.isPending || user.role === "admin" || currentUser?.id === user.id}
                    onClick={() => void handleDelete(user.id, user.name)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                    title={user.role === "admin" ? "Admin accounts cannot be deleted" : currentUser?.id === user.id ? "You cannot delete your own account" : undefined}
                  >
                    {t.delete}
                  </button>
                </td>
              </tr>
            ))}
            {(!users || users.length === 0) && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">{t.noUsers}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
