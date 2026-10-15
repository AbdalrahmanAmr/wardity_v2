import { FC, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOrders } from "@/services/queries/orderQueries";
import { formatDate, formatCurrency } from "@/utils/formatters";
import { TruckIcon } from "@heroicons/react/24/outline";

const statusLabel = (status: string, arabic: boolean) => arabic
  ? ({ pending: "قيد الانتظار", confirmed: "مؤكد", preparing: "قيد التجهيز", "out for delivery": "خرج للتوصيل", processing: "قيد المعالجة", shipped: "تم الشحن", delivered: "تم التوصيل", cancelled: "ملغي" }[status] || status)
  : status.replace(/\b\w/g, (letter) => letter.toUpperCase());

const statusColor = (status: string) => status === "delivered" ? "text-success bg-success/10" : status === "cancelled" ? "text-red-600 bg-red-50" : "text-primary bg-primary/10";

export const Orders: FC = () => {
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const query = useOrders(isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);
  if (!isAuthenticated) return null;

  if (query.isLoading) return <div className="min-h-screen bg-wardity-bg py-12"><div className="container mx-auto space-y-4 px-4">{[1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-xl bg-white" />)}</div></div>;
  if (query.isError) return <div className="container mx-auto min-h-screen px-4 py-16 text-center"><h1 className="text-2xl font-bold text-gray-900">{language === "ar" ? "تعذر تحميل الطلبات" : "Unable to load orders"}</h1><p className="mt-2 text-gray-600">{language === "ar" ? "حاول مرة أخرى لاحقاً." : "Please try again later."}</p></div>;
  const orders = query.data || [];

  return <div className="min-h-screen bg-wardity-bg py-12" dir={language === "ar" ? "rtl" : "ltr"}>
    <div className="container mx-auto px-4">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">{language === "ar" ? "طلباتي" : "My Orders"}</h1>
      {orders.length === 0 ? <div className="rounded-xl bg-white p-12 text-center"><TruckIcon className="mx-auto mb-4 h-24 w-24 text-gray-300" /><h2 className="text-2xl font-bold text-gray-900">{language === "ar" ? "لا توجد طلبات بعد" : "No orders yet"}</h2><p className="mb-6 text-gray-600">{language === "ar" ? "ابدأ التسوق لرؤية طلباتك هنا" : "Start shopping to see your orders here"}</p><Link to="/" className="inline-block rounded-lg bg-primary px-8 py-3 font-semibold text-white">{language === "ar" ? "ابدأ التسوق" : "Start Shopping"}</Link></div> :
        <div className="space-y-4">{orders.map((order) => <div key={order.id} className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><div className="mb-2 flex items-center gap-3"><h2 className="text-lg font-bold text-gray-900">#{order.id}</h2><span className={`rounded-full px-3 py-1 text-sm font-medium ${statusColor(order.status)}`}>{statusLabel(order.status, language === "ar")}</span></div><p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p></div><div className="text-right"><p className="text-2xl font-bold text-primary">{formatCurrency(order.total)}</p><Link to={`/orders/${encodeURIComponent(order.id)}`} className="text-sm text-primary hover:underline">{language === "ar" ? "عرض التفاصيل" : "View Details"}</Link></div></div>
          <div className="flex gap-4 overflow-x-auto border-t border-gray-200 pt-4">{order.items.map((item) => <img key={item.id} src={item.product.image} alt={item.product.name} className="h-20 w-20 flex-shrink-0 rounded-lg object-cover" />)}</div>
        </div>)}</div>}
    </div>
  </div>;
};
