import { FC } from "react";
import { Link } from "react-router-dom";
import { useAdminStats } from "@/services/queries/adminQueries";
import { PageLoadingSpinner, ErrorBlock } from "@/components/ui";

export const AdminDashboard: FC = () => {
  const { data: stats, isLoading, isError } = useAdminStats();

  if (isLoading) return <PageLoadingSpinner />;
  if (isError) return <ErrorBlock message="Failed to load admin stats." />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-serif text-wardity-primary">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Products" value={stats?.productsCount} link="/admin/products" />
        <StatCard title="Total Orders" value={stats?.ordersCount} link="/admin/orders" />
        <StatCard title="Total Users" value={stats?.usersCount} link="/admin/users" />
      </div>
    </div>
  );
};

const StatCard: FC<{ title: string; value?: number; link: string }> = ({ title, value, link }) => (
  <Link to={link} className="block p-6 bg-white dark:bg-wardity-card-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
    <p className="text-4xl font-bold mt-2 text-wardity-text dark:text-wardity-text-dark">{value ?? "-"}</p>
  </Link>
);
