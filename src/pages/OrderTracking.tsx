import { FC } from "react";
import { Link, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOrder } from "@/services/queries/orderQueries";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { CheckCircleIcon, ChevronRightIcon, ClockIcon, TruckIcon } from "@heroicons/react/24/outline";

const sequence = ["pending", "confirmed", "preparing", "out for delivery", "delivered"] as const;
const labels: Record<string, [string, string]> = { pending: ["Order placed", "تم إنشاء الطلب"], confirmed: ["Order confirmed", "تم تأكيد الطلب"], preparing: ["Preparing your order", "جاري تجهيز الطلب"], "out for delivery": ["Out for delivery", "خرج للتوصيل"], delivered: ["Delivered", "تم التوصيل"], cancelled: ["Cancelled", "تم إلغاء الطلب"] };

export const OrderTracking: FC = () => {
  const { id = "" } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const query = useOrder(id);
  const arabic = language === "ar";
  if (query.isLoading) return <div className="min-h-screen bg-wardity-bg py-12"><div className="container mx-auto max-w-3xl animate-pulse space-y-4 px-4"><div className="h-10 rounded bg-gray-200" /><div className="h-72 rounded-xl bg-white" /></div></div>;
  if (query.isError || !query.data) return <div className="min-h-screen bg-wardity-bg px-4 py-16 text-center"><h1 className="text-2xl font-bold text-gray-900">{arabic ? "الطلب غير موجود" : "Order not found"}</h1><Link to="/orders" className="mt-6 inline-block text-primary hover:underline">{arabic ? "العودة إلى الطلبات" : "Back to orders"}</Link></div>;
  const order = query.data;
  const normalizedStatus = order.status === "processing" ? "preparing" : order.status === "shipped" ? "out for delivery" : order.status;
  const cancelled = normalizedStatus === "cancelled";
  const currentIndex = sequence.indexOf(normalizedStatus as typeof sequence[number]);
  const steps = cancelled ? ["pending", "cancelled"] : sequence.slice(0, currentIndex < 0 ? 1 : currentIndex + 1);
  return <div className="min-h-screen bg-wardity-bg py-12" dir={arabic ? "rtl" : "ltr"}><div className="container mx-auto px-4"><nav className="mb-8 flex items-center gap-2 text-sm text-gray-500"><Link to="/orders" className="hover:text-primary">{arabic ? "الطلبات" : "Orders"}</Link><ChevronRightIcon className="h-4 w-4" /><span>#{order.id}</span></nav><div className="mx-auto max-w-3xl"><h1 className="mb-8 text-3xl font-bold text-gray-900">{arabic ? "تتبع طلبك" : "Track Your Order"}</h1><div className="mb-6 rounded-xl bg-white p-6 shadow-sm">{steps.map((status, index) => <div key={status} className="relative pb-8 last:pb-0"><div className="flex gap-4"><div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${index === steps.length - 1 ? "bg-primary text-white" : "bg-primary/20 text-primary"}`}>{status === "out for delivery" ? <TruckIcon className="h-6 w-6" /> : index === steps.length - 1 ? <CheckCircleIcon className="h-6 w-6" /> : <ClockIcon className="h-6 w-6" />}</div><div><h3 className="font-semibold text-gray-900">{labels[status]?.[arabic ? 1 : 0] || status}</h3><p className="text-sm text-gray-600">{index === 0 ? formatDate(order.createdAt) : arabic ? "الحالة الحالية للطلب" : "Current known status"}</p></div></div></div>)}</div><div className="rounded-xl bg-white p-6 shadow-sm"><h2 className="mb-4 text-xl font-bold text-gray-900">{arabic ? "تفاصيل الطلب" : "Order Details"}</h2><div className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-gray-600">{arabic ? "رقم الطلب" : "Order Number"}</span><span>#{order.id}</span></div><div className="flex justify-between"><span className="text-gray-600">{arabic ? "العنوان" : "Shipping address"}</span><span className="max-w-xs text-right">{order.shippingAddress}</span></div><div className="flex justify-between"><span className="text-gray-600">{arabic ? "طريقة الدفع" : "Payment method"}</span><span>{order.paymentMethod || "-"}</span></div><div className="flex justify-between font-bold"><span>{arabic ? "الإجمالي" : "Total"}</span><span className="text-primary">{formatCurrency(order.total)}</span></div></div><div className="mt-6 space-y-3 border-t pt-4">{order.items.map((item) => <div key={item.id} className="flex items-center gap-3"><img src={item.product.image} alt={item.product.name} className="h-14 w-14 rounded object-cover" /><div className="flex-1"><p className="font-medium">{item.product.name}</p><p className="text-sm text-gray-500">{item.quantity} × {formatCurrency(item.price)}</p></div><span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span></div>)}</div></div></div></div></div>;
};
