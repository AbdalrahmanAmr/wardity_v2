import { FC, useState } from "react";
import { useAdminOrders, useUpdateOrder } from "@/services/queries/adminQueries";
import { PageLoadingSpinner, ErrorBlock } from "@/components/ui";

export const AdminOrders: FC = () => {
  const { data: orders, isLoading, isError } = useAdminOrders();
  const updateOrder = useUpdateOrder();
  const [updateError, setUpdateError] = useState<string | null>(null);

  if (isLoading) return <PageLoadingSpinner />;
  if (isError) return <ErrorBlock message="Failed to load orders." />;

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdateError(null);
    try {
      await updateOrder.mutateAsync({ id, status: newStatus });
    } catch (err: any) {
      setUpdateError(err.response?.data?.message || err.message || "Failed to update order status.");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-serif text-wardity-primary">Orders</h1>
      
      {updateError && (
        <ErrorBlock message={updateError} />
      )}

      <div className="bg-white dark:bg-wardity-card-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Order ID</th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">User ID</th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Total</th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Date</th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {orders?.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                <td className="p-4 text-sm font-mono">{order.id.slice(0, 8)}...</td>
                <td className="p-4 text-sm font-mono">{order.user_id.slice(0, 8)}...</td>
                <td className="p-4 font-medium">${order.total.toFixed(2)}</td>
                <td className="p-4 text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    disabled={updateOrder.isPending}
                    className="bg-white dark:bg-wardity-bg-dark border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-wardity-primary"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
