import { FC, useState } from "react";
import { useAdminOrders, useResolveShippingQuote, useUpdateOrder } from "@/services/queries/adminQueries";
import { PageLoadingSpinner, ErrorBlock } from "@/components/ui";
import { useAdminTranslations } from "@/locales/admin";

export const AdminOrders: FC = () => {
  const { data: orders, isLoading, isError } = useAdminOrders();
  const updateOrder = useUpdateOrder();
  const resolveQuote = useResolveShippingQuote();
  const t = useAdminTranslations();
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [quoteFees, setQuoteFees] = useState<Record<string, string>>({});

  if (isLoading) return <PageLoadingSpinner />;
  if (isError) return <ErrorBlock message={t.failedOrders} />;

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdateError(null);
    try {
      await updateOrder.mutateAsync({ id, status: newStatus });
    } catch (err: any) {
      setUpdateError(err.response?.data?.message || err.message || "Failed to update order status.");
    }
  };
  const resolveShippingQuote = async (id: string) => {
    const deliveryFee = Number(quoteFees[id]);
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0) { setUpdateError("Enter a valid delivery fee."); return; }
    try { await resolveQuote.mutateAsync({ id, deliveryFee }); } catch (err) { setUpdateError(err instanceof Error ? err.message : "Could not save shipping quote."); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-serif text-wardity-primary">{t.orders}</h1>
      
      {updateError && (
        <ErrorBlock message={updateError} />
      )}

      <div className="bg-white dark:bg-wardity-card-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">{t.orderId}</th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">{t.userId}</th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">{t.total}</th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Delivery</th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">{t.date}</th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">{t.status}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {orders?.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                <td className="p-4 text-sm font-mono">{order.id.slice(0, 8)}...</td>
                <td className="p-4 text-sm font-mono">{order.user_id.slice(0, 8)}...</td>
                <td className="p-4 font-medium">{order.total == null ? "Quote required" : `${Number(order.total).toFixed(2)} EGP`}</td>
                <td className="p-4 text-sm">{order.requires_shipping_quote ? <div className="space-y-2"><p className="font-medium text-amber-700">Quote required</p><p>{order.delivery_location_name || "—"}</p><div className="flex gap-2"><input aria-label="Quoted delivery fee" type="number" min="0" step="0.01" value={quoteFees[order.id] || ""} onChange={(e) => setQuoteFees((current) => ({ ...current, [order.id]: e.target.value }))} className="w-24 rounded border p-1"/><button type="button" disabled={resolveQuote.isPending} onClick={() => resolveShippingQuote(order.id)} className="rounded bg-primary px-2 py-1 text-white">Save</button></div></div> : <><p>{order.delivery_location_name || "—"}</p><p>{order.delivery_fee == null ? "—" : `${Number(order.delivery_fee).toFixed(2)} EGP`}</p></>}</td>
                <td className="p-4 text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    disabled={updateOrder.isPending}
                    className="bg-white dark:bg-wardity-bg-dark border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-wardity-primary"
                  >
                    <option value="pending">{t.pending}</option>
                    <option value="processing">{t.processing}</option>
                    <option value="shipped">{t.shipped}</option>
                    <option value="delivered">{t.delivered}</option>
                    <option value="cancelled">{t.cancelled}</option>
                  </select>
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">{t.noOrders}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
