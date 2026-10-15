import { FC } from "react";
import { useAdminUsers } from "@/services/queries/adminQueries";
import { PageLoadingSpinner, ErrorBlock } from "@/components/ui";

export const AdminUsers: FC = () => {
  const { data: users, isLoading, isError } = useAdminUsers();

  if (isLoading) return <PageLoadingSpinner />;
  if (isError) return <ErrorBlock message="Failed to load users." />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-serif text-wardity-primary">Users</h1>

      <div className="bg-white dark:bg-wardity-card-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">ID</th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Name</th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Email</th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Phone</th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Role</th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Joined Date</th>
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
              </tr>
            ))}
            {(!users || users.length === 0) && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
